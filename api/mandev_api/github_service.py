"""Cache-aware GitHub stats service.

Wraps the GitHub fetcher with a SQLite-backed cache layer.
Stats are cached per GitHub username with a configurable TTL.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from mandev_api.db_models import GitHubStatsCache
from mandev_api.github_fetcher import fetch_github_stats

logger = logging.getLogger(__name__)

CACHE_TTL_HOURS = 24


async def get_github_stats(
    github_username: str,
    *,
    db: AsyncSession,
    token: str | None,
) -> dict | None:
    """Get GitHub stats, using cache when fresh.

    :param github_username: The GitHub username to look up.
    :param db: Database session.
    :param token: GitHub API token (``None`` disables fetching).
    :returns: Stats dict or ``None`` if unavailable.
    """
    # Check cache
    result = await db.execute(
        select(GitHubStatsCache).where(
            GitHubStatsCache.github_username == github_username
        )
    )
    cached = result.scalar_one_or_none()

    if cached is not None:
        age = datetime.now(timezone.utc) - cached.fetched_at.replace(
            tzinfo=timezone.utc
        )
        if age < timedelta(hours=CACHE_TTL_HOURS):
            return json.loads(cached.stats_json)

    # No fresh cache -- fetch if we have a token
    if not token:
        return None

    try:
        stats = await fetch_github_stats(github_username, token=token)
    except Exception:
        logger.exception("Failed to fetch GitHub stats for %s", github_username)
        # Return stale cache if available
        if cached is not None:
            return json.loads(cached.stats_json)
        return None

    stats_json = json.dumps(stats.model_dump())

    if cached is not None:
        cached.stats_json = stats_json
        cached.fetched_at = datetime.now(timezone.utc)
    else:
        cached = GitHubStatsCache(
            github_username=github_username,
            stats_json=stats_json,
            fetched_at=datetime.now(timezone.utc),
        )
        db.add(cached)

    await db.commit()
    return json.loads(stats_json)
