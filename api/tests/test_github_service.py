"""Tests for the cache-aware GitHub stats service."""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from mandev_api.database import Base
from mandev_api.db_models import GitHubStatsCache
from mandev_api.github_service import get_github_stats

# Ensure ORM models are registered on Base.metadata before create_all.
import mandev_api.db_models  # noqa: F401

FAKE_STATS = {
    "total_stars": 42,
    "total_repos": 10,
    "followers": 100,
    "total_contributions": 500,
    "current_streak": 7,
    "longest_streak": 14,
    "languages": [],
    "pinned_repos": [],
    "contributions": [],
    "fetched_at": "2026-02-14T00:00:00+00:00",
}


@pytest.fixture(params=["asyncio"])
def anyio_backend(request: pytest.FixtureRequest) -> str:
    """Override anyio backend to only use asyncio."""
    return request.param


@pytest.fixture
async def db_session() -> AsyncSession:
    """Yield an async session backed by an in-memory SQLite database."""
    engine = create_async_engine("sqlite+aiosqlite://", echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with session_factory() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


def _make_mock_stats() -> MagicMock:
    """Build a mock GitHubStats object with a ``model_dump`` method."""
    mock = MagicMock()
    mock.model_dump.return_value = FAKE_STATS
    return mock


@pytest.mark.anyio
async def test_cache_miss_fetches_and_stores(db_session: AsyncSession) -> None:
    """When no cache exists, fetch_github_stats is called and the result is cached."""
    mock_stats = _make_mock_stats()

    with patch(
        "mandev_api.github_service.fetch_github_stats",
        new_callable=AsyncMock,
        return_value=mock_stats,
    ) as mock_fetch:
        result = await get_github_stats(
            "octocat", db=db_session, token="ghp_fake"
        )

    mock_fetch.assert_awaited_once_with("octocat", token="ghp_fake")
    assert result == FAKE_STATS

    # Verify data was persisted
    from sqlalchemy import select

    row = (
        await db_session.execute(
            select(GitHubStatsCache).where(
                GitHubStatsCache.github_username == "octocat"
            )
        )
    ).scalar_one()
    assert json.loads(row.stats_json) == FAKE_STATS


@pytest.mark.anyio
async def test_fresh_cache_returns_without_fetching(db_session: AsyncSession) -> None:
    """When a fresh cache entry exists, it is returned without calling the fetcher."""
    db_session.add(
        GitHubStatsCache(
            github_username="octocat",
            stats_json=json.dumps(FAKE_STATS),
            fetched_at=datetime.now(timezone.utc),
        )
    )
    await db_session.commit()

    with patch(
        "mandev_api.github_service.fetch_github_stats",
        new_callable=AsyncMock,
    ) as mock_fetch:
        result = await get_github_stats(
            "octocat", db=db_session, token="ghp_fake"
        )

    mock_fetch.assert_not_awaited()
    assert result == FAKE_STATS


@pytest.mark.anyio
async def test_stale_cache_refetches(db_session: AsyncSession) -> None:
    """When cache is older than the TTL, a fresh fetch is performed and cache updated."""
    stale_time = datetime.now(timezone.utc) - timedelta(hours=25)
    db_session.add(
        GitHubStatsCache(
            github_username="octocat",
            stats_json=json.dumps({"old": True}),
            fetched_at=stale_time,
        )
    )
    await db_session.commit()

    mock_stats = _make_mock_stats()

    with patch(
        "mandev_api.github_service.fetch_github_stats",
        new_callable=AsyncMock,
        return_value=mock_stats,
    ) as mock_fetch:
        result = await get_github_stats(
            "octocat", db=db_session, token="ghp_fake"
        )

    mock_fetch.assert_awaited_once_with("octocat", token="ghp_fake")
    assert result == FAKE_STATS

    # Verify cache was updated (not a second row)
    from sqlalchemy import select, func as sa_func

    count = (
        await db_session.execute(
            select(sa_func.count()).select_from(GitHubStatsCache)
        )
    ).scalar()
    assert count == 1


@pytest.mark.anyio
async def test_no_token_no_cache_returns_none(db_session: AsyncSession) -> None:
    """Without a token and no cached data, None is returned."""
    result = await get_github_stats("octocat", db=db_session, token=None)
    assert result is None
