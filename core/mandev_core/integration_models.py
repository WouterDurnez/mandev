"""Data models for fetched integration statistics.

These are NOT config models -- they represent cached data fetched
from external APIs (npm, PyPI, Dev.to, Hashnode).
"""

from __future__ import annotations

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# npm
# ---------------------------------------------------------------------------

class NpmPackage(BaseModel):
    """A single npm package."""

    name: str
    version: str
    description: str = ""
    weekly_downloads: int = 0
    url: str = ""


class NpmStats(BaseModel):
    """Aggregated npm statistics for a user."""

    total_packages: int
    total_weekly_downloads: int
    packages: list[NpmPackage]
    fetched_at: str


# ---------------------------------------------------------------------------
# PyPI
# ---------------------------------------------------------------------------

class PyPIPackage(BaseModel):
    """A single PyPI package."""

    name: str
    version: str
    description: str = ""
    monthly_downloads: int = 0
    url: str = ""


class PyPIStats(BaseModel):
    """Aggregated PyPI statistics for a set of packages."""

    total_packages: int
    total_monthly_downloads: int
    packages: list[PyPIPackage]
    fetched_at: str


# ---------------------------------------------------------------------------
# Dev.to
# ---------------------------------------------------------------------------

class DevToArticle(BaseModel):
    """A single Dev.to article."""

    title: str
    url: str
    published_at: str
    reactions: int = 0
    comments: int = 0
    reading_time: int = 0
    tags: list[str] = []


class DevToStats(BaseModel):
    """Aggregated Dev.to statistics for a user."""

    total_articles: int
    total_reactions: int
    total_comments: int
    articles: list[DevToArticle]
    fetched_at: str


# ---------------------------------------------------------------------------
# Hashnode
# ---------------------------------------------------------------------------

class HashnodeArticle(BaseModel):
    """A single Hashnode article."""

    title: str
    url: str
    published_at: str
    reactions: int = 0
    brief: str = ""


class HashnodeStats(BaseModel):
    """Aggregated Hashnode statistics for a user."""

    total_articles: int
    total_reactions: int
    articles: list[HashnodeArticle]
    fetched_at: str
