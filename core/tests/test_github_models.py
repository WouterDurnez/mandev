"""Tests for GitHub stats data models."""

from mandev_core.github_models import GitHubLanguage, GitHubRepo, GitHubStats, ContributionDay


def test_github_stats_minimal():
    """GitHubStats can be constructed with required fields."""
    stats = GitHubStats(
        total_stars=100,
        total_repos=10,
        followers=50,
        total_contributions=500,
        current_streak=5,
        longest_streak=30,
        languages=[],
        pinned_repos=[],
        contributions=[],
        fetched_at="2026-02-14T00:00:00Z",
    )
    assert stats.total_stars == 100
    assert stats.languages == []


def test_github_stats_with_data():
    """GitHubStats with languages and pinned repos."""
    stats = GitHubStats(
        total_stars=1234,
        total_repos=42,
        followers=567,
        total_contributions=2048,
        current_streak=12,
        longest_streak=60,
        languages=[
            GitHubLanguage(name="Python", percentage=45.2, color="#3572A5"),
            GitHubLanguage(name="TypeScript", percentage=30.1, color="#2b7489"),
        ],
        pinned_repos=[
            GitHubRepo(
                name="cool-project",
                description="A cool project",
                stars=100,
                forks=20,
                language="Python",
                language_color="#3572A5",
                url="https://github.com/user/cool-project",
            ),
        ],
        contributions=[ContributionDay(date="2026-02-14", count=5)],
        fetched_at="2026-02-14T12:00:00Z",
    )
    assert len(stats.languages) == 2
    assert stats.pinned_repos[0].name == "cool-project"
