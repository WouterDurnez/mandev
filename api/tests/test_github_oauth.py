"""Tests for the GitHub OAuth endpoints."""

from unittest.mock import AsyncMock, Mock, patch

import pytest
from httpx import AsyncClient


async def _signup_and_login(client: AsyncClient, username: str = "ghuser") -> str:
    """Create a user and return a JWT."""
    await client.post(
        "/api/auth/signup",
        json={"email": f"{username}@example.com", "username": username, "password": "pass"},
    )
    resp = await client.post(
        "/api/auth/login",
        json={"email": f"{username}@example.com", "password": "pass"},
    )
    return resp.json()["access_token"]


@pytest.mark.anyio
async def test_github_redirect_returns_302(client: AsyncClient) -> None:
    """GET /api/auth/github redirects to GitHub OAuth with state."""
    token = await _signup_and_login(client, "redirect_user")
    with patch("mandev_api.routers.github_oauth.settings") as mock_settings:
        mock_settings.github_oauth_client_id = "test-client-id"
        resp = await client.get(
            f"/api/auth/github?token={token}",
            follow_redirects=False,
        )
    assert resp.status_code == 307
    location = resp.headers["location"]
    assert "github.com/login/oauth/authorize" in location
    assert "read" in location and "user" in location
    assert "state=" in location


@pytest.mark.anyio
async def test_github_redirect_without_token(client: AsyncClient) -> None:
    """GET /api/auth/github without token returns 401."""
    with patch("mandev_api.routers.github_oauth.settings") as mock_settings:
        mock_settings.github_oauth_client_id = "test-client-id"
        resp = await client.get("/api/auth/github")
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_github_callback_without_code(client: AsyncClient) -> None:
    """GET /api/auth/github/callback without code returns 400."""
    token = await _signup_and_login(client, "cb_nocode")
    resp = await client.get(
        f"/api/auth/github/callback?state={token}",
    )
    assert resp.status_code == 400


@pytest.mark.anyio
async def test_github_callback_without_state(client: AsyncClient) -> None:
    """GET /api/auth/github/callback without state returns 401."""
    resp = await client.get("/api/auth/github/callback?code=testcode123")
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_github_callback_with_invalid_state(client: AsyncClient) -> None:
    """GET /api/auth/github/callback with bad state returns 401."""
    resp = await client.get(
        "/api/auth/github/callback?code=testcode123&state=garbage-token",
    )
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_github_callback_exchanges_code(client: AsyncClient) -> None:
    """GET /api/auth/github/callback exchanges code and stores username."""
    token = await _signup_and_login(client, "oauth_user")

    mock_token_response = Mock()
    mock_token_response.status_code = 200
    mock_token_response.json.return_value = {"access_token": "gho_fake123"}

    mock_user_response = Mock()
    mock_user_response.status_code = 200
    mock_user_response.json.return_value = {"login": "oauth_user_gh"}

    with patch("mandev_api.routers.github_oauth.httpx.AsyncClient") as mock_client_cls:
        mock_http = AsyncMock()
        mock_http.post = AsyncMock(return_value=mock_token_response)
        mock_http.get = AsyncMock(return_value=mock_user_response)
        mock_http.__aenter__ = AsyncMock(return_value=mock_http)
        mock_http.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_http

        resp = await client.get(
            f"/api/auth/github/callback?code=testcode123&state={token}",
            follow_redirects=False,
        )

    assert resp.status_code == 307
    assert "/dashboard" in resp.headers["location"]


@pytest.mark.anyio
async def test_github_unlink(client: AsyncClient) -> None:
    """POST /api/auth/github/unlink clears github fields."""
    token = await _signup_and_login(client, "unlink_user")

    resp = await client.post(
        "/api/auth/github/unlink",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["github_username"] is None
