"""Tests for the profile and config-validation endpoints."""

import pytest
from httpx import AsyncClient

VALID_CONFIG = {
    "profile": {"name": "Test User", "tagline": "Hello"},
    "skills": [{"name": "Python", "level": "expert"}],
}


async def _signup_and_login(client: AsyncClient, username: str = "tester") -> str:
    """Create a user and return a JWT access token.

    :param client: The test HTTP client.
    :param username: Username for the test user.
    :returns: A valid access token.
    """
    await client.post(
        "/api/auth/signup",
        json={
            "email": f"{username}@example.com",
            "username": username,
            "password": "pass",
        },
    )
    resp = await client.post(
        "/api/auth/login",
        json={"email": f"{username}@example.com", "password": "pass"},
    )
    return resp.json()["access_token"]


@pytest.mark.anyio
async def test_get_own_profile_empty(client: AsyncClient) -> None:
    """GET /api/profile returns {} for a new user."""
    token = await _signup_and_login(client, "empty_profile")
    resp = await client.get(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json() == {}


@pytest.mark.anyio
async def test_put_then_get_profile(client: AsyncClient) -> None:
    """PUT /api/profile then GET /api/profile roundtrips correctly."""
    token = await _signup_and_login(client, "roundtrip")
    headers = {"Authorization": f"Bearer {token}"}

    put_resp = await client.put("/api/profile", json=VALID_CONFIG, headers=headers)
    assert put_resp.status_code == 200

    get_resp = await client.get("/api/profile", headers=headers)
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["profile"]["name"] == "Test User"
    assert data["skills"][0]["name"] == "Python"


@pytest.mark.anyio
async def test_put_invalid_config(client: AsyncClient) -> None:
    """PUT /api/profile returns 422 on invalid config."""
    token = await _signup_and_login(client, "invalid_cfg")
    resp = await client.put(
        "/api/profile",
        json={"not_valid": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 422


@pytest.mark.anyio
async def test_get_public_profile(client: AsyncClient) -> None:
    """GET /api/profile/{username} returns config + username."""
    token = await _signup_and_login(client, "public_user")
    await client.put(
        "/api/profile",
        json=VALID_CONFIG,
        headers={"Authorization": f"Bearer {token}"},
    )

    resp = await client.get("/api/profile/public_user")
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "public_user"
    assert data["config"]["profile"]["name"] == "Test User"


@pytest.mark.anyio
async def test_get_public_profile_not_found(client: AsyncClient) -> None:
    """GET /api/profile/{username} returns 404 for unknown user."""
    resp = await client.get("/api/profile/nonexistent")
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_validate_valid_config(client: AsyncClient) -> None:
    """POST /api/config/validate returns valid=true for good config."""
    resp = await client.post("/api/config/validate", json=VALID_CONFIG)
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is True
    assert data["errors"] == []


@pytest.mark.anyio
async def test_validate_invalid_config(client: AsyncClient) -> None:
    """POST /api/config/validate returns valid=false with errors."""
    resp = await client.post("/api/config/validate", json={"bad": "data"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is False
    assert len(data["errors"]) > 0
