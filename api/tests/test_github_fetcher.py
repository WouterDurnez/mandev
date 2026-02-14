"""Tests for the GitHub GraphQL stats fetcher."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from mandev_api.github_fetcher import (
    _aggregate_languages,
    _compute_streaks,
    fetch_github_stats,
)
from mandev_core.github_models import ContributionDay

MOCK_GRAPHQL_RESPONSE = {
    "data": {
        "user": {
            "followers": {"totalCount": 567},
            "repositories": {
                "totalCount": 42,
                "nodes": [
                    {
                        "name": "cool-project",
                        "description": "A cool project",
                        "stargazerCount": 100,
                        "forkCount": 20,
                        "primaryLanguage": {"name": "Python", "color": "#3572A5"},
                        "url": "https://github.com/testuser/cool-project",
                        "languages": {
                            "edges": [
                                {
                                    "size": 5000,
                                    "node": {"name": "Python", "color": "#3572A5"},
                                },
                                {
                                    "size": 3000,
                                    "node": {
                                        "name": "JavaScript",
                                        "color": "#f1e05a",
                                    },
                                },
                            ]
                        },
                    },
                    {
                        "name": "another-project",
                        "description": None,
                        "stargazerCount": 50,
                        "forkCount": 5,
                        "primaryLanguage": {
                            "name": "TypeScript",
                            "color": "#2b7489",
                        },
                        "url": "https://github.com/testuser/another-project",
                        "languages": {
                            "edges": [
                                {
                                    "size": 2000,
                                    "node": {
                                        "name": "TypeScript",
                                        "color": "#2b7489",
                                    },
                                },
                            ]
                        },
                    },
                ],
            },
            "pinnedItems": {
                "nodes": [
                    {
                        "name": "cool-project",
                        "description": "A cool project",
                        "stargazerCount": 100,
                        "forkCount": 20,
                        "primaryLanguage": {"name": "Python", "color": "#3572A5"},
                        "url": "https://github.com/testuser/cool-project",
                    },
                ],
            },
            "contributionsCollection": {
                "contributionCalendar": {
                    "totalContributions": 2048,
                    "weeks": [
                        {
                            "contributionDays": [
                                {"date": "2026-02-13", "contributionCount": 5},
                                {"date": "2026-02-14", "contributionCount": 3},
                            ]
                        },
                    ],
                },
            },
        }
    }
}


@pytest.fixture(params=["asyncio"])
def anyio_backend(request: pytest.FixtureRequest) -> str:
    """Override anyio backend to only use asyncio."""
    return request.param


@pytest.mark.anyio
async def test_fetch_github_stats_parses_response() -> None:
    """Mocked GraphQL response is correctly parsed into a GitHubStats."""
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = MOCK_GRAPHQL_RESPONSE

    mock_client_instance = AsyncMock()
    mock_client_instance.post.return_value = mock_response
    mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
    mock_client_instance.__aexit__ = AsyncMock(return_value=False)

    with patch("mandev_api.github_fetcher.httpx.AsyncClient", return_value=mock_client_instance):
        stats = await fetch_github_stats("testuser", token="fake-token")

    assert stats.total_stars == 150
    assert stats.total_repos == 42
    assert stats.followers == 567
    assert stats.total_contributions == 2048
    assert len(stats.pinned_repos) == 1
    assert stats.pinned_repos[0].name == "cool-project"


@pytest.mark.anyio
async def test_fetch_github_stats_raises_without_token() -> None:
    """Calling without a token raises ValueError."""
    with pytest.raises(ValueError, match="token"):
        await fetch_github_stats("testuser", token=None)

    with pytest.raises(ValueError, match="token"):
        await fetch_github_stats("testuser", token="")


def test_language_percentages_sum_to_100() -> None:
    """Aggregated language percentages sum to approximately 100%."""
    repos = MOCK_GRAPHQL_RESPONSE["data"]["user"]["repositories"]["nodes"]
    languages = _aggregate_languages(repos)

    total = sum(lang.percentage for lang in languages)
    assert abs(total - 100.0) < 0.1

    # Python: 5000/10000 = 50%, JS: 3000/10000 = 30%, TS: 2000/10000 = 20%
    by_name = {lang.name: lang.percentage for lang in languages}
    assert abs(by_name["Python"] - 50.0) < 0.1
    assert abs(by_name["JavaScript"] - 30.0) < 0.1
    assert abs(by_name["TypeScript"] - 20.0) < 0.1


def test_compute_streaks_consecutive_days() -> None:
    """Streak computation counts consecutive days with contributions."""
    days = [
        ContributionDay(date="2026-02-13", count=5),
        ContributionDay(date="2026-02-14", count=3),
    ]
    current, longest = _compute_streaks(days)
    assert current == 2
    assert longest == 2


def test_compute_streaks_with_gap() -> None:
    """Streak resets on a day with zero contributions."""
    days = [
        ContributionDay(date="2026-02-10", count=1),
        ContributionDay(date="2026-02-11", count=0),
        ContributionDay(date="2026-02-12", count=2),
        ContributionDay(date="2026-02-13", count=3),
        ContributionDay(date="2026-02-14", count=1),
    ]
    current, longest = _compute_streaks(days)
    assert current == 3
    assert longest == 3


def test_compute_streaks_empty() -> None:
    """Empty contribution list yields zero streaks."""
    current, longest = _compute_streaks([])
    assert current == 0
    assert longest == 0


def test_compute_streaks_ends_with_zero() -> None:
    """Current streak is zero if the last day has no contributions."""
    days = [
        ContributionDay(date="2026-02-12", count=5),
        ContributionDay(date="2026-02-13", count=3),
        ContributionDay(date="2026-02-14", count=0),
    ]
    current, longest = _compute_streaks(days)
    assert current == 0
    assert longest == 2


def test_aggregate_languages_empty_repos() -> None:
    """Aggregating languages from no repos returns an empty list."""
    assert _aggregate_languages([]) == []
