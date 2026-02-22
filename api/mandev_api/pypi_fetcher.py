"""PyPI package stats fetcher.

Queries PyPI JSON API for package metadata and pypistats for download
counts. Skips packages that return 404 (typo or removed).
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

import httpx

from mandev_core.integration_models import PyPIPackage, PyPIStats

logger = logging.getLogger(__name__)

PYPI_API_URL = "https://pypi.org/pypi"
PYPISTATS_API_URL = "https://pypistats.org/api/packages"

_SEMAPHORE = asyncio.Semaphore(5)


async def _fetch_package(
    client: httpx.AsyncClient,
    package_name: str,
) -> PyPIPackage | None:
    """Fetch metadata and downloads for a single PyPI package."""
    async with _SEMAPHORE:
        try:
            meta_resp = await client.get(
                f"{PYPI_API_URL}/{package_name}/json", timeout=10.0
            )
            if meta_resp.status_code == 404:
                logger.warning("PyPI package not found: %s", package_name)
                return None
            meta_resp.raise_for_status()
            meta = meta_resp.json()
        except Exception:
            logger.warning("Failed to fetch PyPI metadata for %s", package_name)
            return None

        monthly_downloads = 0
        try:
            dl_resp = await client.get(
                f"{PYPISTATS_API_URL}/{package_name}/recent", timeout=10.0
            )
            if dl_resp.status_code == 200:
                dl_data = dl_resp.json().get("data", {})
                monthly_downloads = dl_data.get("last_month", 0)
        except Exception:
            logger.warning("Failed to fetch pypistats for %s", package_name)

        info = meta.get("info", {})
        return PyPIPackage(
            name=info.get("name", package_name),
            version=info.get("version", ""),
            description=info.get("summary", ""),
            monthly_downloads=monthly_downloads,
            url=info.get("project_url", f"https://pypi.org/project/{package_name}/"),
        )


async def fetch_pypi_stats(packages: list[str], max_packages: int = 10) -> dict:
    """Fetch PyPI stats for a list of package names.

    :param packages: Package names to look up.
    :param max_packages: Maximum packages to return.
    :returns: Dict suitable for JSON serialisation (PyPIStats shape).
    """
    async with httpx.AsyncClient() as client:
        tasks = [_fetch_package(client, pkg) for pkg in packages[:max_packages]]
        results = await asyncio.gather(*tasks)

    valid: list[PyPIPackage] = [r for r in results if r is not None]
    valid.sort(key=lambda p: p.monthly_downloads, reverse=True)

    stats = PyPIStats(
        total_packages=len(valid),
        total_monthly_downloads=sum(p.monthly_downloads for p in valid),
        packages=valid,
        fetched_at=datetime.now(timezone.utc).isoformat(),
    )
    return stats.model_dump()
