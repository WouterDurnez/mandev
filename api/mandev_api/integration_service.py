"""Generic cache-aware integration service.

Wraps any integration fetcher with a database-backed cache layer.
Same pattern as ``github_service.py`` but parameterized by service name.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Awaitable, Callable

from mandev_api.tables import IntegrationCache

logger = logging.getLogger(__name__)

CACHE_TTL_HOURS = 24


async def get_cached_stats(
    service: str,
    lookup_key: str,
    fetcher: Callable[..., Awaitable[dict]],
    **fetcher_kwargs: object,
) -> dict | None:
    """Get integration stats, using cache when fresh.

    :param service: Integration name (e.g. ``"npm"``, ``"pypi"``).
    :param lookup_key: Cache key (username or deterministic hash).
    :param fetcher: Async callable that returns a stats dict.
    :param fetcher_kwargs: Extra kwargs forwarded to *fetcher*.
    :returns: Stats dict or ``None`` if unavailable.
    """
    cached = (
        await IntegrationCache.objects()
        .where(
            IntegrationCache.service == service,
            IntegrationCache.lookup_key == lookup_key,
        )
        .first()
        .run()
    )

    if cached is not None:
        age = datetime.now(timezone.utc) - cached.fetched_at.replace(
            tzinfo=timezone.utc
        )
        if age < timedelta(hours=CACHE_TTL_HOURS):
            return json.loads(cached.stats_json)

    try:
        stats = await fetcher(**fetcher_kwargs)
    except Exception:
        logger.exception("Failed to fetch %s stats for %s", service, lookup_key)
        if cached is not None:
            return json.loads(cached.stats_json)
        return None

    stats_json = json.dumps(stats)

    if cached is not None:
        cached.stats_json = stats_json
        cached.fetched_at = datetime.now(timezone.utc)
    else:
        cached = IntegrationCache(
            service=service,
            lookup_key=lookup_key,
            stats_json=stats_json,
            fetched_at=datetime.now(timezone.utc),
        )

    await cached.save().run()
    return json.loads(stats_json)
