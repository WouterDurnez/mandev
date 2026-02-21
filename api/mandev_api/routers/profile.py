"""Profile and config-validation routes."""

import json
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ValidationError
from piccolo.query.functions import Sum

from mandev_core import MandevConfig
from mandev_api.config import settings
from mandev_api.tables import User, UserProfile, ProfileView
from mandev_api.github_service import get_github_stats
from mandev_api.routers.auth import _get_current_user

router = APIRouter(tags=["profile"])

BOT_PATTERNS = (
    "bot", "crawl", "spider", "slurp", "mediapartners",
    "facebookexternalhit", "twitterbot", "linkedinbot",
    "slackbot", "discordbot", "whatsapp", "telegrambot",
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PublicProfileResponse(BaseModel):
    """Public profile with username."""

    username: str
    config: dict


class ValidationRequest(BaseModel):
    """Body for the config validation endpoint.

    Accepts arbitrary JSON that will be validated against
    :class:`MandevConfig`.
    """

    model_config = {"extra": "allow"}


class ValidationResponse(BaseModel):
    """Result of config validation."""

    valid: bool
    errors: list[dict[str, object]] = []


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/api/profile")
async def get_own_profile(
    user: User = Depends(_get_current_user),
) -> dict:
    """Return the authenticated user's profile config.

    :param user: The authenticated user.
    :returns: The stored config JSON (or empty dict).
    """
    profile = (
        await UserProfile.objects()
        .where(UserProfile.user_id == user.id)
        .first()
        .run()
    )
    if profile is None or profile.config_json in ("", "{}"):
        return {}
    return json.loads(profile.config_json)


@router.put("/api/profile")
async def put_own_profile(
    body: dict,
    user: User = Depends(_get_current_user),
) -> dict:
    """Update the authenticated user's profile config.

    The body is validated against :class:`MandevConfig` before storing.

    :param body: The config data.
    :param user: The authenticated user.
    :returns: The stored config.
    """
    try:
        MandevConfig.model_validate(body)
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(),
        )

    profile = (
        await UserProfile.objects()
        .where(UserProfile.user_id == user.id)
        .first()
        .run()
    )
    if profile is None:
        profile = UserProfile(user_id=user.id, config_json=json.dumps(body))
    else:
        profile.config_json = json.dumps(body)

    profile.updated_at = datetime.now(timezone.utc)
    await profile.save().run()
    return json.loads(profile.config_json)


@router.get("/api/profile/{username}")
async def get_public_profile(
    username: str,
    request: Request,
) -> dict:
    """Return a user's public profile by username.

    Returns the config JSON with ``username`` injected at the top level
    so the frontend can access ``profile``, ``theme``, etc. directly.

    :param username: The username to look up.
    :param request: The incoming request (for user-agent detection).
    :returns: The public profile with username.
    """
    user = await User.objects().where(User.username == username).first().run()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    profile = (
        await UserProfile.objects()
        .where(UserProfile.user_id == user.id)
        .first()
        .run()
    )
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    config = json.loads(profile.config_json) if profile.config_json else {}
    response = {"username": user.username, **config}

    # Compute github_verified
    config_gh_username = (config.get("github") or {}).get("username", "")
    response["github_verified"] = bool(
        user.github_username
        and config_gh_username
        and user.github_username.lower() == config_gh_username.lower()
    )

    # Attach GitHub stats if configured
    github_config = config.get("github")
    if github_config and github_config.get("username"):
        token = user.github_token or settings.github_token
        stats = await get_github_stats(
            github_config["username"],
            token=token,
        )
        response["github_stats"] = stats
    else:
        response["github_stats"] = None

    # Increment view count (skip bots)
    ua = (request.headers.get("user-agent") or "").lower()
    is_bot = any(pattern in ua for pattern in BOT_PATTERNS)
    if not is_bot:
        today = date.today().isoformat()
        view = (
            await ProfileView.objects()
            .where(ProfileView.username == username, ProfileView.date == today)
            .first()
            .run()
        )
        if view is None:
            view = ProfileView(username=username, date=today, count=1)
        else:
            view.count += 1
        await view.save().run()

    # Total view count
    result = (
        await ProfileView.select(Sum(ProfileView.count))
        .where(ProfileView.username == username)
        .run()
    )
    total_views = result[0]["sum"] if result and result[0].get("sum") is not None else 0
    response["view_count"] = total_views

    return response


@router.post("/api/config/validate", response_model=ValidationResponse)
async def validate_config(body: dict) -> ValidationResponse:
    """Validate a config body against the MandevConfig schema.

    :param body: The config data to validate.
    :returns: Validation result with ``valid`` flag and any errors.
    """
    try:
        MandevConfig.model_validate(body)
        return ValidationResponse(valid=True, errors=[])
    except ValidationError as exc:
        errors = [
            {"loc": list(e["loc"]), "msg": e["msg"], "type": e["type"]}
            for e in exc.errors()
        ]
        return ValidationResponse(valid=False, errors=errors)
