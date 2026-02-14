"""GitHub GraphQL stats fetcher.

Sends a single GraphQL query to the GitHub API and parses the response
into a :class:`~mandev_core.github_models.GitHubStats` instance.
"""

from __future__ import annotations

from datetime import datetime, timezone

import httpx

from mandev_core.github_models import (
    ContributionDay,
    GitHubLanguage,
    GitHubRepo,
    GitHubStats,
)

GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"

QUERY = """
query ($username: String!) {
  user(login: $username) {
    followers {
      totalCount
    }
    repositories(
      first: 100
      ownerAffiliations: OWNER
      orderBy: {field: STARGAZERS, direction: DESC}
    ) {
      totalCount
      nodes {
        name
        description
        stargazerCount
        forkCount
        primaryLanguage {
          name
          color
        }
        url
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
          edges {
            size
            node {
              name
              color
            }
          }
        }
      }
    }
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name
          description
          stargazerCount
          forkCount
          primaryLanguage {
            name
            color
          }
          url
        }
      }
    }
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}
"""


def _compute_streaks(days: list[ContributionDay]) -> tuple[int, int]:
    """Compute current and longest contribution streaks.

    Iterates through contribution days in order, counting consecutive
    days where ``count > 0``.  The *current* streak is the run that
    ends on the last day (zero if the last day has no contributions).

    :param days: Chronologically ordered contribution days.
    :return: A ``(current_streak, longest_streak)`` tuple.
    """
    if not days:
        return 0, 0

    longest = 0
    current = 0

    for day in days:
        if day.count > 0:
            current += 1
            longest = max(longest, current)
        else:
            current = 0

    return current, longest


def _aggregate_languages(repos: list[dict]) -> list[GitHubLanguage]:
    """Aggregate language byte counts across repositories into percentages.

    Sums the byte size of each language across all repositories, then
    converts to percentages.  Results are sorted by percentage descending.

    :param repos: Repository node dicts from the GraphQL response.
    :return: Languages with computed percentages, sorted by usage.
    """
    totals: dict[str, dict[str, int | str]] = {}

    for repo in repos:
        edges = repo.get("languages", {}).get("edges", [])
        for edge in edges:
            name = edge["node"]["name"]
            color = edge["node"]["color"]
            size = edge["size"]
            if name in totals:
                totals[name]["size"] += size  # type: ignore[operator]
            else:
                totals[name] = {"size": size, "color": color}

    total_bytes = sum(entry["size"] for entry in totals.values())  # type: ignore[arg-type]
    if total_bytes == 0:
        return []

    languages = [
        GitHubLanguage(
            name=name,
            percentage=round(entry["size"] / total_bytes * 100, 1),  # type: ignore[operator]
            color=str(entry["color"]),
        )
        for name, entry in totals.items()
    ]
    languages.sort(key=lambda lang: lang.percentage, reverse=True)
    return languages


async def fetch_github_stats(
    username: str,
    *,
    token: str | None,
) -> GitHubStats:
    """Fetch GitHub statistics for a user via the GraphQL API.

    Sends a single GraphQL query and parses the full response into a
    :class:`~mandev_core.github_models.GitHubStats`.

    :param username: GitHub username to fetch stats for.
    :param token: GitHub personal access token.  Required.
    :return: Parsed GitHub statistics.
    :raises ValueError: If *token* is ``None`` or empty.
    :raises httpx.HTTPStatusError: If the GitHub API returns an error.
    """
    if not token:
        raise ValueError("A GitHub token is required to fetch stats.")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            GITHUB_GRAPHQL_URL,
            json={"query": QUERY, "variables": {"username": username}},
            headers=headers,
            timeout=30.0,
        )
        response.raise_for_status()
        data = response.json()

    user = data["data"]["user"]

    # Stars: sum across all returned repository nodes
    repo_nodes = user["repositories"]["nodes"]
    total_stars = sum(repo["stargazerCount"] for repo in repo_nodes)

    # Pinned repos
    pinned_repos = [
        GitHubRepo(
            name=pin["name"],
            description=pin.get("description"),
            stars=pin["stargazerCount"],
            forks=pin["forkCount"],
            language=(pin.get("primaryLanguage") or {}).get("name"),
            language_color=(pin.get("primaryLanguage") or {}).get("color"),
            url=pin["url"],
        )
        for pin in user["pinnedItems"]["nodes"]
    ]

    # Contributions
    calendar = user["contributionsCollection"]["contributionCalendar"]
    contribution_days: list[ContributionDay] = []
    for week in calendar["weeks"]:
        for day in week["contributionDays"]:
            contribution_days.append(
                ContributionDay(date=day["date"], count=day["contributionCount"])
            )

    current_streak, longest_streak = _compute_streaks(contribution_days)

    # Languages
    languages = _aggregate_languages(repo_nodes)

    return GitHubStats(
        total_stars=total_stars,
        total_repos=user["repositories"]["totalCount"],
        followers=user["followers"]["totalCount"],
        total_contributions=calendar["totalContributions"],
        current_streak=current_streak,
        longest_streak=longest_streak,
        languages=languages,
        pinned_repos=pinned_repos,
        contributions=contribution_days,
        fetched_at=datetime.now(timezone.utc).isoformat(),
    )
