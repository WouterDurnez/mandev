"""Profile and config-validation routes."""

import asyncio
import hashlib
import json
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ValidationError
from piccolo.query.functions import Sum

from mandev_core import MandevConfig
from mandev_api.config import settings
from mandev_api.tables import User, UserProfile, ProfileView
from mandev_api.github_service import get_github_stats
from mandev_api.integration_service import get_cached_stats
from mandev_api.npm_fetcher import fetch_npm_stats
from mandev_api.pypi_fetcher import fetch_pypi_stats
from mandev_api.devto_fetcher import fetch_devto_stats
from mandev_api.hashnode_fetcher import fetch_hashnode_stats
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

    # Fetch all integration stats in parallel
    github_config = config.get("github")
    npm_config = config.get("npm")
    pypi_config = config.get("pypi")
    devto_config = config.get("devto")
    hashnode_config = config.get("hashnode")

    async def _fetch_github() -> dict | None:
        if github_config and github_config.get("username"):
            token = user.github_token or settings.github_token
            return await get_github_stats(github_config["username"], token=token)
        return None

    async def _fetch_npm() -> dict | None:
        if npm_config and npm_config.get("username"):
            return await get_cached_stats(
                "npm",
                npm_config["username"],
                fetch_npm_stats,
                username=npm_config["username"],
                max_packages=npm_config.get("max_packages", 10),
            )
        return None

    async def _fetch_pypi() -> dict | None:
        if pypi_config and pypi_config.get("packages"):
            pkgs = pypi_config["packages"]
            lookup = hashlib.sha256(",".join(sorted(pkgs)).encode()).hexdigest()[:16]
            return await get_cached_stats(
                "pypi",
                lookup,
                fetch_pypi_stats,
                packages=pkgs,
                max_packages=pypi_config.get("max_packages", 10),
            )
        return None

    async def _fetch_devto() -> dict | None:
        if devto_config and devto_config.get("username"):
            return await get_cached_stats(
                "devto",
                devto_config["username"],
                fetch_devto_stats,
                username=devto_config["username"],
                max_articles=devto_config.get("max_articles", 5),
            )
        return None

    async def _fetch_hashnode() -> dict | None:
        if hashnode_config and hashnode_config.get("username"):
            return await get_cached_stats(
                "hashnode",
                hashnode_config["username"],
                fetch_hashnode_stats,
                username=hashnode_config["username"],
                max_articles=hashnode_config.get("max_articles", 5),
            )
        return None

    github_stats, npm_stats, pypi_stats, devto_stats, hashnode_stats = (
        await asyncio.gather(
            _fetch_github(),
            _fetch_npm(),
            _fetch_pypi(),
            _fetch_devto(),
            _fetch_hashnode(),
        )
    )

    response["github_stats"] = github_stats
    response["npm_stats"] = npm_stats
    response["pypi_stats"] = pypi_stats
    response["devto_stats"] = devto_stats
    response["hashnode_stats"] = hashnode_stats

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
