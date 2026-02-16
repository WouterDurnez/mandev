"""Tests for the profile view counter."""

import pytest
from httpx import AsyncClient


async def _signup_with_profile(client: AsyncClient, username: str) -> None:
    """Create a user and set a profile config."""
    await client.post(
        "/api/auth/signup",
        json={"email": f"{username}@example.com", "username": username, "password": "pass"},
    )
    resp = await client.post(
        "/api/auth/login",
        json={"email": f"{username}@example.com", "password": "pass"},
    )
    token = resp.json()["access_token"]
    await client.put(
        "/api/profile",
        json={"profile": {"name": "Test", "tagline": "Hello"}},
        headers={"Authorization": f"Bearer {token}"},
    )


@pytest.mark.anyio
async def test_view_count_increments(client: AsyncClient) -> None:
    """Visiting a profile increments the view counter."""
    await _signup_with_profile(client, "counted_user")

    resp1 = await client.get("/api/profile/counted_user")
    assert resp1.status_code == 200
    count1 = resp1.json()["view_count"]

    resp2 = await client.get("/api/profile/counted_user")
    count2 = resp2.json()["view_count"]

    assert count2 == count1 + 1


@pytest.mark.anyio
async def test_view_count_skips_bots(client: AsyncClient) -> None:
    """Bot user-agents should not increment the view counter."""
    await _signup_with_profile(client, "bot_test_user")

    resp1 = await client.get("/api/profile/bot_test_user")
    count1 = resp1.json()["view_count"]

    resp2 = await client.get(
        "/api/profile/bot_test_user",
        headers={"User-Agent": "Googlebot/2.1"},
    )
    count2 = resp2.json()["view_count"]

    assert count2 == count1  # No increment for bots
