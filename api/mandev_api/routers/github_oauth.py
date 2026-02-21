"""GitHub OAuth routes: link, callback, and unlink."""

from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from mandev_api.config import settings
from mandev_api.tables import User
from mandev_api.routers.auth import _get_current_user

router = APIRouter(prefix="/api/auth/github", tags=["github-oauth"])

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"


class GitHubLinkResponse(BaseModel):
    """Response after linking or unlinking GitHub."""

    github_username: str | None


@router.get("")
async def github_redirect() -> RedirectResponse:
    """Redirect user to GitHub OAuth authorization page.

    :returns: A redirect to GitHub's OAuth flow.
    """
    if not settings.github_oauth_client_id:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="GitHub OAuth not configured",
        )

    params = urlencode({
        "client_id": settings.github_oauth_client_id,
        "scope": "read:user",
    })
    return RedirectResponse(
        url=f"{GITHUB_AUTHORIZE_URL}?{params}",
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
    )


@router.get("/callback")
async def github_callback(
    code: str = Query(None),
    user: User = Depends(_get_current_user),
) -> RedirectResponse:
    """Exchange GitHub authorization code for access token and store username.

    :param code: The authorization code from GitHub.
    :param user: The authenticated user.
    :returns: Redirect to the dashboard.
    """
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
    return GitHubLinkResponse(github_username=None)
