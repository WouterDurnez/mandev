"""Hashnode articles fetcher.

Queries the Hashnode GraphQL API for a user's published articles.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from mandev_core.integration_models import HashnodeArticle, HashnodeStats

logger = logging.getLogger(__name__)

HASHNODE_GQL_URL = "https://gql.hashnode.com"

QUERY = """
query GetUserArticles($username: String!, $pageSize: Int!) {
  publication(host: $username) {
    posts(first: $pageSize) {
      edges {
        node {
          title
          brief
          url
          publishedAt
          reactionCount
        }
      }
      totalDocuments
    }
  }
}
"""


async def fetch_hashnode_stats(username: str, max_articles: int = 5) -> dict:
    """Fetch Hashnode stats for a given username.

    :param username: Hashnode blog host (e.g. ``"username.hashnode.dev"``
        or just ``"username"``).
    :param max_articles: Maximum articles to return.
    :returns: Dict suitable for JSON serialisation (HashnodeStats shape).
    """
    host = username if "." in username else f"{username}.hashnode.dev"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            HASHNODE_GQL_URL,
            json={
                "query": QUERY,
                "variables": {"username": host, "pageSize": max_articles},
            },
            headers={"Content-Type": "application/json"},
            timeout=15.0,
        )
        resp.raise_for_status()
        data = resp.json()

    publication = (data.get("data") or {}).get("publication")
    if not publication:
        return HashnodeStats(
            total_articles=0,
            total_reactions=0,
            articles=[],
            fetched_at=datetime.now(timezone.utc).isoformat(),
        ).model_dump()

    posts = publication.get("posts", {})
    edges = posts.get("edges", [])
    total = posts.get("totalDocuments", len(edges))

    articles: list[HashnodeArticle] = []
    total_reactions = 0

    for edge in edges:
        node = edge.get("node", {})
        reactions = node.get("reactionCount", 0)
        total_reactions += reactions
        articles.append(HashnodeArticle(
            title=node.get("title", ""),
            url=node.get("url", ""),
            published_at=node.get("publishedAt", ""),
            reactions=reactions,
            brief=node.get("brief", ""),
        ))

    stats = HashnodeStats(
        total_articles=total,
        total_reactions=total_reactions,
        articles=articles,
        fetched_at=datetime.now(timezone.utc).isoformat(),
    )
    return stats.model_dump()
