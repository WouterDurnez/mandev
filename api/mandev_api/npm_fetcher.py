"""npm registry stats fetcher.

Queries the npm search API for packages by a maintainer, then fetches
weekly download counts for each package.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

import httpx

from mandev_core.integration_models import NpmPackage, NpmStats

logger = logging.getLogger(__name__)

NPM_SEARCH_URL = "https://registry.npmjs.org/-/v1/search"
NPM_DOWNLOADS_URL = "https://api.npmjs.org/downloads/point/last-week"

_SEMAPHORE = asyncio.Semaphore(5)


async def _fetch_downloads(client: httpx.AsyncClient, package: str) -> int:
    """Fetch weekly download count for a single package."""
    async with _SEMAPHORE:
        try:
            resp = await client.get(f"{NPM_DOWNLOADS_URL}/{package}", timeout=10.0)
            if resp.status_code == 200:
                return resp.json().get("downloads", 0)
        except Exception:
            logger.warning("Failed to fetch downloads for npm package %s", package)
    return 0


async def fetch_npm_stats(username: str, max_packages: int = 10) -> dict:
    """Fetch npm stats for a given username.

    :param username: npm registry username.
    :param max_packages: Maximum packages to return.
    :returns: Dict suitable for JSON serialisation (NpmStats shape).
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            NPM_SEARCH_URL,
            params={"text": f"maintainer:{username}", "size": max_packages},
            timeout=15.0,
        )
        resp.raise_for_status()
        data = resp.json()

        objects = data.get("objects", [])
        packages: list[NpmPackage] = []

        # Fetch downloads in parallel
        download_tasks = []
        for obj in objects:
            pkg = obj.get("package", {})
            download_tasks.append(_fetch_downloads(client, pkg.get("name", "")))

        downloads = await asyncio.gather(*download_tasks)

        for obj, dl_count in zip(objects, downloads):
            pkg = obj.get("package", {})
            packages.append(NpmPackage(
                name=pkg.get("name", ""),
                version=pkg.get("version", ""),
                description=pkg.get("description", ""),
                weekly_downloads=dl_count,
                url=pkg.get("links", {}).get("npm", ""),
            ))

    packages.sort(key=lambda p: p.weekly_downloads, reverse=True)

    stats = NpmStats(
        total_packages=len(packages),
        total_weekly_downloads=sum(p.weekly_downloads for p in packages),
        packages=packages,
        fetched_at=datetime.now(timezone.utc).isoformat(),
    )
    return stats.model_dump()
