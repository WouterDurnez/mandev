"""Profile and config-validation routes."""

import json

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from mandev_core import MandevConfig
from mandev_api.database import get_db
from mandev_api.db_models import User, UserProfile
from mandev_api.routers.auth import _get_current_user

router = APIRouter(tags=["profile"])


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
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return the authenticated user's profile config.

    :param user: The authenticated user.
    :param db: Database session.
    :returns: The stored config JSON (or empty dict).
    """
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id),
    )
    profile = result.scalar_one_or_none()
    if profile is None or profile.config_json in ("", "{}"):
        return {}
    return json.loads(profile.config_json)


@router.put("/api/profile")
async def put_own_profile(
    body: dict,
    user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Update the authenticated user's profile config.

    The body is validated against :class:`MandevConfig` before storing.

    :param body: The config data.
    :param user: The authenticated user.
    :param db: Database session.
    :returns: The stored config.
    """
    try:
        MandevConfig.model_validate(body)
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(),
        )

    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id),
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = UserProfile(user_id=user.id, config_json=json.dumps(body))
        db.add(profile)
    else:
        profile.config_json = json.dumps(body)

    await db.commit()
    await db.refresh(profile)
    return json.loads(profile.config_json)


@router.get("/api/profile/{username}", response_model=PublicProfileResponse)
async def get_public_profile(
    username: str,
    db: AsyncSession = Depends(get_db),
) -> PublicProfileResponse:
    """Return a user's public profile by username.

    :param username: The username to look up.
    :param db: Database session.
    :returns: The public profile.
    """
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id),
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    config = json.loads(profile.config_json) if profile.config_json else {}
    return PublicProfileResponse(username=user.username, config=config)


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
