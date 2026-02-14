"""Data models for fetched GitHub statistics.

These are NOT config models -- they represent cached data fetched
from the GitHub API, stored alongside user profiles.
"""

from __future__ import annotations

from pydantic import BaseModel


class GitHubLanguage(BaseModel):
    """A programming language with usage percentage.

    :param name: Language name (e.g. ``"Python"``).
    :param percentage: Usage percentage across repositories.
    :param color: Hex color code associated with the language.
    """

    name: str
    percentage: float
    color: str


class GitHubRepo(BaseModel):
    """A pinned or top repository.

    :param name: Repository name.
    :param description: Short description of the repository.
    :param stars: Number of stargazers.
    :param forks: Number of forks.
    :param language: Primary language name.
    :param language_color: Hex color for the primary language.
    :param url: Full URL to the repository on GitHub.
    """

    name: str
    description: str | None = None
    stars: int
    forks: int
    language: str | None = None
    language_color: str | None = None
    url: str


class ContributionDay(BaseModel):
    """A single day's contribution count.

    :param date: ISO-8601 date string (``YYYY-MM-DD``).
    :param count: Number of contributions on this day.
    """

    date: str
    count: int


class GitHubStats(BaseModel):
    """Aggregated GitHub statistics for a user.

    Fetched from the GitHub GraphQL API and cached server-side.

    :param total_stars: Sum of stars across all repositories.
    :param total_repos: Total number of repositories.
    :param followers: Number of followers.
    :param total_contributions: Lifetime contribution count.
    :param current_streak: Current consecutive days with contributions.
    :param longest_streak: Longest consecutive days with contributions.
    :param languages: Top languages by usage percentage.
    :param pinned_repos: User's pinned repositories.
    :param contributions: Daily contribution history.
    :param fetched_at: ISO-8601 timestamp of when these stats were fetched.
    """

    total_stars: int
    total_repos: int
    followers: int
    total_contributions: int
    current_streak: int
    longest_streak: int
    languages: list[GitHubLanguage]
    pinned_repos: list[GitHubRepo]
    contributions: list[ContributionDay | dict]
    fetched_at: str
