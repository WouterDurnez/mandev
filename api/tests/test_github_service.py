"""Tests for the cache-aware GitHub stats service."""

from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from piccolo.engine.sqlite import SQLiteEngine
from piccolo.table import create_db_tables, drop_db_tables

from mandev_api.tables import GitHubStatsCache
from mandev_api.github_service import get_github_stats

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
async def _setup_db():
    """Set up a temporary SQLite database for GitHubStatsCache tests."""
    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(db_fd)

    engine = SQLiteEngine(path=db_path)
    original_engine = GitHubStatsCache._meta._db
    GitHubStatsCache._meta._db = engine

    try:
        await create_db_tables(GitHubStatsCache, if_not_exists=True)
        yield
        await drop_db_tables(GitHubStatsCache)
    finally:
        GitHubStatsCache._meta._db = original_engine
        os.unlink(db_path)


def _make_mock_stats() -> MagicMock:
    """Build a mock GitHubStats object with a ``model_dump`` method."""
    mock = MagicMock()
    mock.model_dump.return_value = FAKE_STATS
    return mock


@pytest.mark.anyio
@pytest.mark.usefixtures("_setup_db")
async def test_cache_miss_fetches_and_stores() -> None:
    """When no cache exists, fetch_github_stats is called and the result is cached."""
    mock_stats = _make_mock_stats()

    with patch(
        "mandev_api.github_service.fetch_github_stats",
        new_callable=AsyncMock,
        return_value=mock_stats,
    ) as mock_fetch:
        result = await get_github_stats("octocat", token="ghp_fake")

    mock_fetch.assert_awaited_once_with("octocat", token="ghp_fake")
    assert result == FAKE_STATS

    # Verify data was persisted
    row = (
        await GitHubStatsCache.objects()
        .where(GitHubStatsCache.github_username == "octocat")
        .first()
        .run()
    )
    assert row is not None
    assert json.loads(row.stats_json) == FAKE_STATS


@pytest.mark.anyio
@pytest.mark.usefixtures("_setup_db")
async def test_fresh_cache_returns_without_fetching() -> None:
    """When a fresh cache entry exists, it is returned without calling the fetcher."""
    cache = GitHubStatsCache(
        github_username="octocat",
        stats_json=json.dumps(FAKE_STATS),
        fetched_at=datetime.now(timezone.utc),
    )
    await cache.save().run()

    with patch(
        "mandev_api.github_service.fetch_github_stats",
        new_callable=AsyncMock,
    ) as mock_fetch:
        result = await get_github_stats("octocat", token="ghp_fake")

    mock_fetch.assert_not_awaited()
    assert result == FAKE_STATS


@pytest.mark.anyio
@pytest.mark.usefixtures("_setup_db")
async def test_stale_cache_refetches() -> None:
    """When cache is older than the TTL, a fresh fetch is performed and cache updated."""
    stale_time = datetime.now(timezone.utc) - timedelta(hours=25)
    cache = GitHubStatsCache(
        github_username="octocat",
        stats_json=json.dumps({"old": True}),
        fetched_at=stale_time,
    )
    await cache.save().run()

    mock_stats = _make_mock_stats()

    with patch(
        "mandev_api.github_service.fetch_github_stats",
        new_callable=AsyncMock,
        return_value=mock_stats,
    ) as mock_fetch:
        result = await get_github_stats("octocat", token="ghp_fake")

    mock_fetch.assert_awaited_once_with("octocat", token="ghp_fake")
    assert result == FAKE_STATS

    # Verify cache was updated (not a second row)
    from piccolo.query.functions import Count

    result_count = await GitHubStatsCache.select(Count(GitHubStatsCache.id)).run()
    assert result_count[0]["count"] == 1


@pytest.mark.anyio
@pytest.mark.usefixtures("_setup_db")
async def test_no_token_no_cache_returns_none() -> None:
    """Without a token and no cached data, None is returned."""
    result = await get_github_stats("octocat", token=None)
    assert result is None
