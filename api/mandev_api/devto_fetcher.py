"""Dev.to articles fetcher.

Queries the public Dev.to API for a user's published articles and
computes aggregate stats.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from mandev_core.integration_models import DevToArticle, DevToStats

logger = logging.getLogger(__name__)

DEVTO_API_URL = "https://dev.to/api/articles"


async def fetch_devto_stats(username: str, max_articles: int = 5) -> dict:
    """Fetch Dev.to stats for a given username.

    :param username: Dev.to username.
    :param max_articles: Maximum articles to return in the list.
    :returns: Dict suitable for JSON serialisation (DevToStats shape).
    """
    all_articles: list[dict] = []
    page = 1

    async with httpx.AsyncClient() as client:
        # Paginate to get totals (up to 1000 articles)
        while True:
            resp = await client.get(
                DEVTO_API_URL,
                params={
                    "username": username,
                    "per_page": 100,
                    "page": page,
                },
                timeout=15.0,
            )
            resp.raise_for_status()
            batch = resp.json()
            if not batch:
                break
            all_articles.extend(batch)
            if len(batch) < 100:
                break
            page += 1

    total_reactions = sum(a.get("positive_reactions_count", 0) for a in all_articles)
    total_comments = sum(a.get("comments_count", 0) for a in all_articles)

    # Sort by reactions descending, take top N
    all_articles.sort(
        key=lambda a: a.get("positive_reactions_count", 0), reverse=True
    )
    top = all_articles[:max_articles]

    articles = [
        DevToArticle(
            title=a.get("title", ""),
            url=a.get("url", ""),
            published_at=a.get("published_at", ""),
            reactions=a.get("positive_reactions_count", 0),
            comments=a.get("comments_count", 0),
            reading_time=a.get("reading_time_minutes", 0),
            tags=a.get("tag_list", []),
        )
        for a in top
    ]

    stats = DevToStats(
        total_articles=len(all_articles),
        total_reactions=total_reactions,
        total_comments=total_comments,
        articles=articles,
        fetched_at=datetime.now(timezone.utc).isoformat(),
    )
    return stats.model_dump()
