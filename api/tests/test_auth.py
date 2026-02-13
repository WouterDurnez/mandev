"""Tests for the authentication endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_signup_success(client: AsyncClient) -> None:
    """POST /api/auth/signup creates a user and returns 201."""
    resp = await client.post(
        "/api/auth/signup",
        json={"email": "alice@example.com", "username": "alice", "password": "secret123"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "alice@example.com"
    assert data["username"] == "alice"
    assert "id" in data


@pytest.mark.anyio
async def test_signup_duplicate_email(client: AsyncClient) -> None:
    """POST /api/auth/signup returns 409 on duplicate email."""
    await client.post(
        "/api/auth/signup",
        json={"email": "bob@example.com", "username": "bob", "password": "pass"},
    )
    resp = await client.post(
        "/api/auth/signup",
        json={"email": "bob@example.com", "username": "bob2", "password": "pass"},
    )
    assert resp.status_code == 409


@pytest.mark.anyio
async def test_signup_duplicate_username(client: AsyncClient) -> None:
    """POST /api/auth/signup returns 409 on duplicate username."""
    await client.post(
        "/api/auth/signup",
        json={"email": "carol@example.com", "username": "carol", "password": "pass"},
    )
    resp = await client.post(
        "/api/auth/signup",
        json={"email": "carol2@example.com", "username": "carol", "password": "pass"},
    )
    assert resp.status_code == 409


@pytest.mark.anyio
async def test_login_success(client: AsyncClient) -> None:
    """POST /api/auth/login returns a JWT on valid credentials."""
    await client.post(
        "/api/auth/signup",
        json={"email": "dave@example.com", "username": "dave", "password": "pass"},
    )
    resp = await client.post(
        "/api/auth/login",
        json={"email": "dave@example.com", "password": "pass"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.anyio
async def test_login_wrong_password(client: AsyncClient) -> None:
    """POST /api/auth/login returns 401 on wrong password."""
    await client.post(
        "/api/auth/signup",
        json={"email": "eve@example.com", "username": "eve", "password": "pass"},
    )
    resp = await client.post(
        "/api/auth/login",
        json={"email": "eve@example.com", "password": "wrong"},
    )
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_me_success(client: AsyncClient) -> None:
    """GET /api/auth/me returns current user info."""
    await client.post(
        "/api/auth/signup",
        json={"email": "frank@example.com", "username": "frank", "password": "pass"},
    )
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": "frank@example.com", "password": "pass"},
    )
    token = login_resp.json()["access_token"]

    resp = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["username"] == "frank"


@pytest.mark.anyio
async def test_me_unauthenticated(client: AsyncClient) -> None:
    """GET /api/auth/me returns 401 without a token."""
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 422 or resp.status_code == 401
