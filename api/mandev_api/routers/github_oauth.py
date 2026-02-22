"""GitHub OAuth routes: link, callback, and unlink."""

import json
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from mandev_api.auth import decode_access_token
from mandev_api.config import settings
from mandev_api.tables import User, UserProfile
from mandev_api.routers.auth import _get_current_user

router = APIRouter(prefix="/api/auth/github", tags=["github-oauth"])

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"


class GitHubLinkResponse(BaseModel):
    """Response after linking or unlinking GitHub."""

    github_username: str | None


@router.get("")
async def github_redirect(token: str = Query(None)) -> RedirectResponse:
    """Redirect user to GitHub OAuth authorization page.

    :param token: JWT token from the authenticated user.
    :returns: A redirect to GitHub's OAuth flow.
    """
    if not settings.github_oauth_client_id:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="GitHub OAuth not configured. Set MANDEV_GITHUB_OAUTH_CLIENT_ID and MANDEV_GITHUB_OAUTH_CLIENT_SECRET environment variables.",
        )

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    # Validate the token early so we fail fast on bad JWTs
    payload = decode_access_token(token)
    if payload is None or payload.get("sub") is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    params = urlencode({
        "client_id": settings.github_oauth_client_id,
        "scope": "read:user",
        "state": token,
    })
    return RedirectResponse(
        url=f"{GITHUB_AUTHORIZE_URL}?{params}",
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
    )


@router.get("/callback")
async def github_callback(
    code: str = Query(None),
    state: str = Query(None),
) -> RedirectResponse:
    """Exchange GitHub authorization code for access token and store username.

    The user is identified via the ``state`` parameter, which carries the
    JWT that was passed through the GitHub OAuth redirect.

    :param code: The authorization code from GitHub.
    :param state: The JWT token echoed back by GitHub.
    :returns: Redirect to the dashboard.
    """
    if not state:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing state parameter",
        )

    payload = decode_access_token(state)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user = await User.objects().where(User.id == int(user_id)).first().run()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing authorization code",
        )

    async with httpx.AsyncClient() as http:
        token_resp = await http.post(
            GITHUB_TOKEN_URL,
            json={
                "client_id": settings.github_oauth_client_id,
                "client_secret": settings.github_oauth_client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
        if token_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to exchange code with GitHub",
            )

        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="No access token in GitHub response",
            )

        user_resp = await http.get(
            GITHUB_USER_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
            },
        )
        if user_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to fetch GitHub user",
            )

        github_login = user_resp.json().get("login")

    user.github_username = github_login
    user.github_token = access_token
    await user.save().run()

    # Auto-populate github.username in profile config
    profile = (
        await UserProfile.objects()
        .where(UserProfile.user_id == user.id)
        .first()
        .run()
    )
    if profile:
        try:
            config = json.loads(profile.config_json) if profile.config_json else {}
        except (json.JSONDecodeError, TypeError):
            config = {}
        gh = config.get("github") or {}
        if not gh.get("username"):
            gh["username"] = github_login
            config["github"] = gh
            profile.config_json = json.dumps(config)
            await profile.save().run()

    return RedirectResponse(
        url="/dashboard",
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
    )


@router.post("/unlink", response_model=GitHubLinkResponse)
async def github_unlink(
    user: User = Depends(_get_current_user),
) -> GitHubLinkResponse:
    """Remove the linked GitHub account from the user.

    :param user: The authenticated user.
    :returns: Confirmation with null github_username.
    """
    user.github_username = None
    user.github_token = None
    await user.save().run()

    # Remove github.username from profile config
    profile = (
        await UserProfile.objects()
        .where(UserProfile.user_id == user.id)
        .first()
        .run()
    )
    if profile and profile.config_json:
        try:
            config = json.loads(profile.config_json)
            if "github" in config:
                del config["github"]
                profile.config_json = json.dumps(config)
                await profile.save().run()
        except (json.JSONDecodeError, TypeError):
            pass

    return GitHubLinkResponse(github_username=None)
