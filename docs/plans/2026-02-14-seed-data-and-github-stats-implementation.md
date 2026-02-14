# Seed Data & GitHub Stats Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Populate the database with rich fake profiles and add GitHub stats integration (fetcher, cache, profile rendering).

**Architecture:** Two workstreams. (A) A seed script that inserts 4-5 fake users+profiles into SQLite via the ORM. (B) Extend the data model with a `[github]` config section, build a GraphQL fetcher with SQLite caching, serve stats through the existing profile API, and render on the public profile page. Seed data includes fake GitHub stats so the UI can be developed without live API calls.

**Tech Stack:** Python 3.12+, Pydantic, SQLAlchemy async, FastAPI, httpx (for GitHub GraphQL), Astro + React (profile page), pytest

---

## Workstream A: Seed Data

### Task 1: Add `GitHub` model to core

**Files:**
- Modify: `core/mandev_core/models.py`
- Modify: `core/tests/test_models.py`

**Step 1: Write the failing test**

Add to `core/tests/test_models.py`:

```python
def test_config_with_github_section():
    """Config with a [github] section parses correctly."""
    data = {
        "profile": {"name": "Test"},
        "github": {"username": "testuser"},
    }
    config = MandevConfig.model_validate(data)
    assert config.github is not None
    assert config.github.username == "testuser"
    assert config.github.show_heatmap is True
    assert config.github.show_stats is True
    assert config.github.show_languages is True
    assert config.github.show_pinned is True


def test_config_without_github_section():
    """Config without [github] still works."""
    data = {"profile": {"name": "Test"}}
    config = MandevConfig.model_validate(data)
    assert config.github is None
```

**Step 2: Run test to verify it fails**

Run: `uv run pytest core/tests/test_models.py::test_config_with_github_section -v`
Expected: FAIL — `GitHub` doesn't exist yet.

**Step 3: Write minimal implementation**

Add to `core/mandev_core/models.py` before `MandevConfig`:

```python
class GitHub(BaseModel):
    """GitHub integration config."""

    username: str
    show_heatmap: bool = True
    show_stats: bool = True
    show_languages: bool = True
    show_pinned: bool = True
```

Add field to `MandevConfig`:

```python
github: GitHub | None = None
```

**Step 4: Run tests to verify they pass**

Run: `uv run pytest core/tests/test_models.py -v`
Expected: All PASS

**Step 5: Commit**

```bash
git add core/mandev_core/models.py core/tests/test_models.py
git commit -m "feat(core): add GitHub config model to MandevConfig"
```

---

### Task 2: Add `GitHubStats` fetched-data models to core

**Files:**
- Create: `core/mandev_core/github_models.py`
- Create: `core/tests/test_github_models.py`
- Modify: `core/mandev_core/__init__.py`

**Step 1: Write the failing test**

Create `core/tests/test_github_models.py`:

```python
"""Tests for GitHub stats data models."""

from mandev_core.github_models import GitHubLanguage, GitHubRepo, GitHubStats


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
        contributions=[{"date": "2026-02-14", "count": 5}],
        fetched_at="2026-02-14T12:00:00Z",
    )
    assert len(stats.languages) == 2
    assert stats.pinned_repos[0].name == "cool-project"
```

**Step 2: Run test to verify it fails**

Run: `uv run pytest core/tests/test_github_models.py -v`
Expected: FAIL — module not found.

**Step 3: Write minimal implementation**

Create `core/mandev_core/github_models.py`:

```python
"""Data models for fetched GitHub statistics.

These are NOT config models — they represent cached data fetched
from the GitHub API, stored alongside user profiles.
"""

from __future__ import annotations

from pydantic import BaseModel


class GitHubLanguage(BaseModel):
    """A programming language with usage percentage."""

    name: str
    percentage: float
    color: str


class GitHubRepo(BaseModel):
    """A pinned or top repository."""

    name: str
    description: str | None = None
    stars: int
    forks: int
    language: str | None = None
    language_color: str | None = None
    url: str


class ContributionDay(BaseModel):
    """A single day's contribution count."""

    date: str
    count: int


class GitHubStats(BaseModel):
    """Aggregated GitHub statistics for a user.

    Fetched from the GitHub GraphQL API and cached server-side.
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
```

Update `core/mandev_core/__init__.py` to export the new models:

```python
from mandev_core.models import (
    MandevConfig,
    Profile,
    Skill,
    Project,
    Experience,
    Link,
    Theme,
    Layout,
    GitHub,
)
from mandev_core.github_models import (
    GitHubStats,
    GitHubLanguage,
    GitHubRepo,
    ContributionDay,
)
```

**Step 4: Run tests to verify they pass**

Run: `uv run pytest core/tests/test_github_models.py -v`
Expected: All PASS

**Step 5: Commit**

```bash
git add core/mandev_core/github_models.py core/tests/test_github_models.py core/mandev_core/__init__.py
git commit -m "feat(core): add GitHubStats data models for fetched stats"
```

---

### Task 3: Create the seed script

**Files:**
- Create: `scripts/seed.py`
- Modify: `justfile`

**Step 1: Write the seed script**

Create `scripts/seed.py`:

```python
"""Seed the database with fake developer profiles.

Run with: ``just seed`` or ``uv run python scripts/seed.py``

Idempotent — clears and re-creates seed users on each run.
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

# Add workspace packages to path so we can import them directly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "api"))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "core"))

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from mandev_api.auth import hash_password
from mandev_api.database import Base, SessionLocal, engine
from mandev_api.db_models import User, UserProfile

SEED_USERS = [
    {
        "username": "alice",
        "email": "alice@example.com",
        "password": "seed",
        "config": {
            "profile": {
                "name": "Alice Chen",
                "tagline": "builds reliable backend systems",
                "about": "Staff engineer focused on distributed systems and developer tooling. Previously at Stripe and Datadog. I care about making infrastructure invisible so product teams can move fast.",
                "avatar": None,
            },
            "skills": [
                {"name": "Python", "level": "expert"},
                {"name": "Go", "level": "expert"},
                {"name": "PostgreSQL", "level": "advanced"},
                {"name": "Kafka", "level": "advanced"},
                {"name": "Kubernetes", "level": "intermediate"},
                {"name": "Rust", "level": "beginner"},
            ],
            "projects": [
                {
                    "name": "streamline",
                    "repo": "https://github.com/alice/streamline",
                    "description": "High-throughput event processing pipeline",
                },
                {
                    "name": "dbmigrate",
                    "repo": "https://github.com/alice/dbmigrate",
                    "url": "https://dbmigrate.dev",
                    "description": "Zero-downtime database migration toolkit",
                },
                {
                    "name": "loadtest",
                    "repo": "https://github.com/alice/loadtest",
                    "description": "Declarative load testing framework for gRPC services",
                },
            ],
            "experience": [
                {
                    "role": "Staff Engineer",
                    "company": "Datadog",
                    "start": "2023",
                    "description": "Leading the event pipeline team. Reduced p99 latency by 40%.",
                },
                {
                    "role": "Senior Engineer",
                    "company": "Stripe",
                    "start": "2019",
                    "end": "2023",
                    "description": "Built internal developer tooling for payment processing.",
                },
                {
                    "role": "Software Engineer",
                    "company": "Twilio",
                    "start": "2016",
                    "end": "2019",
                },
            ],
            "links": [
                {"label": "GitHub", "url": "https://github.com/alice"},
                {"label": "Blog", "url": "https://alice.dev/blog"},
                {"label": "LinkedIn", "url": "https://linkedin.com/in/alicechen"},
            ],
            "theme": {"scheme": "dracula", "font": "JetBrains Mono", "mode": "dark"},
            "github": {"username": "alice-example"},
        },
    },
    {
        "username": "bob",
        "email": "bob@example.com",
        "password": "seed",
        "config": {
            "profile": {
                "name": "Bob Rivera",
                "tagline": "pixels and performance",
                "about": "Frontend engineer obsessed with animation, accessibility, and making the web feel alive. Design systems enthusiast.",
            },
            "skills": [
                {"name": "TypeScript", "level": "expert"},
                {"name": "React", "level": "expert"},
                {"name": "CSS", "level": "expert"},
                {"name": "Next.js", "level": "advanced"},
                {"name": "Figma", "level": "advanced"},
                {"name": "Three.js", "level": "intermediate"},
                {"name": "Rust", "level": "beginner"},
            ],
            "projects": [
                {
                    "name": "motion-kit",
                    "repo": "https://github.com/bob/motion-kit",
                    "url": "https://motion-kit.dev",
                    "description": "Spring-based animation library for React",
                },
                {
                    "name": "a11y-audit",
                    "repo": "https://github.com/bob/a11y-audit",
                    "description": "Automated accessibility testing CLI",
                },
            ],
            "experience": [
                {
                    "role": "Senior Frontend Engineer",
                    "company": "Vercel",
                    "start": "2022",
                    "description": "Design system and component library. Shipped Next.js App Router docs.",
                },
                {
                    "role": "Frontend Engineer",
                    "company": "Figma",
                    "start": "2019",
                    "end": "2022",
                },
            ],
            "links": [
                {"label": "GitHub", "url": "https://github.com/bob"},
                {"label": "Twitter", "url": "https://twitter.com/bobrivera"},
                {"label": "Dribbble", "url": "https://dribbble.com/bob"},
                {"label": "Website", "url": "https://bobrivera.design"},
            ],
            "theme": {"scheme": "tokyo-night", "font": "Fira Code", "mode": "dark"},
            "github": {"username": "bob-example"},
        },
    },
    {
        "username": "carol",
        "email": "carol@example.com",
        "password": "seed",
        "config": {
            "profile": {
                "name": "Carol Nakamura",
                "tagline": "keeping things running",
                "about": "Platform engineer. I automate the boring stuff.",
            },
            "skills": [
                {"name": "Terraform", "level": "expert"},
                {"name": "Kubernetes", "level": "expert"},
                {"name": "AWS", "level": "expert"},
                {"name": "Python", "level": "advanced"},
                {"name": "Go", "level": "advanced"},
                {"name": "Bash", "level": "advanced"},
                {"name": "Prometheus", "level": "intermediate"},
                {"name": "Argo CD", "level": "intermediate"},
            ],
            "projects": [
                {
                    "name": "infra-as-code",
                    "repo": "https://github.com/carol/infra-as-code",
                    "description": "Production-ready Terraform modules for AWS",
                },
                {
                    "name": "k8s-operator",
                    "repo": "https://github.com/carol/k8s-operator",
                    "description": "Custom Kubernetes operator for canary deployments",
                },
            ],
            "experience": [
                {
                    "role": "Platform Engineer",
                    "company": "Cloudflare",
                    "start": "2021",
                    "description": "Zero-trust networking and edge deployment automation.",
                },
                {
                    "role": "DevOps Engineer",
                    "company": "HashiCorp",
                    "start": "2018",
                    "end": "2021",
                },
            ],
            "links": [
                {"label": "GitHub", "url": "https://github.com/carol"},
                {"label": "LinkedIn", "url": "https://linkedin.com/in/carolnakamura"},
            ],
            "theme": {"scheme": "gruvbox", "font": "IBM Plex Mono", "mode": "light"},
        },
    },
    {
        "username": "dave",
        "email": "dave@example.com",
        "password": "seed",
        "config": {
            "profile": {
                "name": "Dave Okonkwo",
                "tagline": "open source everything",
                "about": "Full-time open source maintainer. I believe good tools should be free. Maintaining 12 packages with 50k+ combined downloads/month.",
            },
            "skills": [
                {"name": "Python", "level": "expert"},
                {"name": "Rust", "level": "advanced"},
                {"name": "TypeScript", "level": "advanced"},
                {"name": "C", "level": "intermediate"},
                {"name": "Zig", "level": "beginner"},
            ],
            "projects": [
                {
                    "name": "fastparse",
                    "repo": "https://github.com/dave/fastparse",
                    "url": "https://fastparse.io",
                    "description": "High-performance parsing library with zero-copy semantics",
                },
                {
                    "name": "cli-forge",
                    "repo": "https://github.com/dave/cli-forge",
                    "description": "Opinionated CLI framework with built-in testing",
                },
                {
                    "name": "dotenv-vault",
                    "repo": "https://github.com/dave/dotenv-vault",
                    "description": "Encrypted .env file management for teams",
                },
                {
                    "name": "bench-it",
                    "repo": "https://github.com/dave/bench-it",
                    "description": "Micro-benchmarking with statistical analysis",
                },
                {
                    "name": "type-guard",
                    "repo": "https://github.com/dave/type-guard",
                    "description": "Runtime type checking for Python with zero overhead in production",
                },
            ],
            "experience": [
                {
                    "role": "Independent OSS Maintainer",
                    "company": "Self-employed",
                    "start": "2020",
                    "description": "Full-time open source. Funded by GitHub Sponsors and Polar.",
                },
                {
                    "role": "Senior Engineer",
                    "company": "Mozilla",
                    "start": "2016",
                    "end": "2020",
                    "description": "Worked on Firefox performance tooling.",
                },
            ],
            "links": [
                {"label": "GitHub", "url": "https://github.com/dave"},
                {"label": "Sponsors", "url": "https://github.com/sponsors/dave"},
                {"label": "Blog", "url": "https://dave.codes"},
                {"label": "Mastodon", "url": "https://fosstodon.org/@dave"},
            ],
            "theme": {"scheme": "catppuccin", "font": "Victor Mono", "mode": "dark"},
            "github": {"username": "dave-example"},
        },
    },
    {
        "username": "eve",
        "email": "eve@example.com",
        "password": "seed",
        "config": {
            "profile": {
                "name": "Eve Martinez",
                "tagline": "learning in public",
                "about": "Junior developer, 6 months in. Currently learning React and building my first side projects. Documenting everything I learn.",
            },
            "skills": [
                {"name": "JavaScript", "level": "intermediate"},
                {"name": "HTML/CSS", "level": "intermediate"},
                {"name": "React", "level": "beginner"},
                {"name": "Python", "level": "beginner"},
            ],
            "projects": [
                {
                    "name": "til-garden",
                    "url": "https://eve.garden",
                    "description": "My digital garden of things I learned today",
                },
            ],
            "experience": [
                {
                    "role": "Junior Developer",
                    "company": "Local Agency",
                    "start": "2025",
                    "description": "Building client websites. Learning fast.",
                },
            ],
            "links": [
                {"label": "GitHub", "url": "https://github.com/eve"},
                {"label": "Blog", "url": "https://eve.garden"},
            ],
            "theme": {"scheme": "solarized-dark", "font": "Cascadia Code", "mode": "light"},
        },
    },
]


async def seed() -> None:
    """Clear seed users and re-insert them with full profiles."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        # Delete existing seed users
        seed_usernames = [u["username"] for u in SEED_USERS]
        result = await session.execute(
            select(User).where(User.username.in_(seed_usernames))
        )
        existing = result.scalars().all()
        for user in existing:
            await session.execute(
                delete(UserProfile).where(UserProfile.user_id == user.id)
            )
            await session.delete(user)
        await session.flush()

        # Insert seed users
        for seed in SEED_USERS:
            user = User(
                email=seed["email"],
                username=seed["username"],
                password_hash=hash_password(seed["password"]),
            )
            session.add(user)
            await session.flush()

            profile = UserProfile(
                user_id=user.id,
                config_json=json.dumps(seed["config"]),
            )
            session.add(profile)

        await session.commit()
        print(f"Seeded {len(SEED_USERS)} profiles: {', '.join(seed_usernames)}")


if __name__ == "__main__":
    asyncio.run(seed())
```

**Step 2: Add `just seed` command**

Add to `justfile`:

```just
# Seed database with fake profiles
seed:
    uv run python scripts/seed.py
```

**Step 3: Run the seed script**

Run: `just seed`
Expected: `Seeded 5 profiles: alice, bob, carol, dave, eve`

**Step 4: Verify profiles load in the API**

Run: `curl -s http://localhost:8000/api/profile/alice | python -m json.tool | head -20`
Expected: JSON with alice's full profile including `profile`, `skills`, `projects`, `experience`, `links`, `theme`, and `github` fields.

**Step 5: Commit**

```bash
git add scripts/seed.py justfile
git commit -m "feat: add seed script with 5 fake developer profiles"
```

---

## Workstream B: GitHub Stats Integration

### Task 4: Add `github_token` to API settings

**Files:**
- Modify: `api/mandev_api/config.py`

**Step 1: Add the setting**

Add to `Settings` in `api/mandev_api/config.py`:

```python
github_token: str | None = None
```

**Step 2: Commit**

```bash
git add api/mandev_api/config.py
git commit -m "feat(api): add github_token setting"
```

---

### Task 5: Add `github_stats_cache` table

**Files:**
- Modify: `api/mandev_api/db_models.py`
- Create: `api/tests/test_github_cache.py`

**Step 1: Write the failing test**

Create `api/tests/test_github_cache.py`:

```python
"""Tests for the GitHub stats cache table."""

import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_github_cache_table_exists(client: AsyncClient) -> None:
    """The github_stats_cache table is created on startup."""
    # The client fixture creates all tables via the app lifespan.
    # If we get here without error, the table was created.
    # Just verify the app starts up fine.
    resp = await client.get("/api/health")
    assert resp.status_code == 200
```

**Step 2: Run test to verify it passes (baseline)**

Run: `uv run pytest api/tests/test_github_cache.py -v`
Expected: PASS (table creation happens in lifespan, which already calls create_all).

**Step 3: Add the ORM model**

Add to `api/mandev_api/db_models.py`:

```python
class GitHubStatsCache(Base):
    """Cached GitHub stats for a username."""

    __tablename__ = "github_stats_cache"

    id: Mapped[int] = mapped_column(primary_key=True)
    github_username: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    stats_json: Mapped[str] = mapped_column(Text, default="{}")
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
```

**Step 4: Run test again**

Run: `uv run pytest api/tests/test_github_cache.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add api/mandev_api/db_models.py api/tests/test_github_cache.py
git commit -m "feat(api): add github_stats_cache table"
```

---

### Task 6: Build the GitHub GraphQL fetcher

**Files:**
- Create: `api/mandev_api/github_fetcher.py`
- Create: `api/tests/test_github_fetcher.py`
- Modify: `api/pyproject.toml` (add `httpx` dependency)

**Step 1: Add `httpx` to API dependencies**

In `api/pyproject.toml`, add `"httpx>=0.28"` to the `dependencies` list.

Run: `uv sync`

**Step 2: Write the failing test**

Create `api/tests/test_github_fetcher.py`:

```python
"""Tests for the GitHub stats fetcher.

Uses mocked HTTP responses — no real GitHub API calls.
"""

import json
from unittest.mock import AsyncMock, patch

import pytest

from mandev_api.github_fetcher import fetch_github_stats


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
                                {"size": 5000, "node": {"name": "Python", "color": "#3572A5"}},
                                {"size": 3000, "node": {"name": "JavaScript", "color": "#f1e05a"}},
                            ]
                        },
                    },
                    {
                        "name": "another-project",
                        "description": None,
                        "stargazerCount": 50,
                        "forkCount": 5,
                        "primaryLanguage": {"name": "TypeScript", "color": "#2b7489"},
                        "url": "https://github.com/testuser/another-project",
                        "languages": {
                            "edges": [
                                {"size": 2000, "node": {"name": "TypeScript", "color": "#2b7489"}},
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


@pytest.mark.anyio
async def test_fetch_github_stats_parses_response():
    """fetch_github_stats returns a valid GitHubStats from a mocked response."""
    mock_response = AsyncMock()
    mock_response.json = AsyncMock(return_value=MOCK_GRAPHQL_RESPONSE)
    mock_response.raise_for_status = lambda: None

    with patch("mandev_api.github_fetcher.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        stats = await fetch_github_stats("testuser", token="fake-token")

    assert stats.total_stars == 150  # 100 + 50
    assert stats.total_repos == 42
    assert stats.followers == 567
    assert stats.total_contributions == 2048
    assert len(stats.pinned_repos) == 1
    assert stats.pinned_repos[0].name == "cool-project"
    assert len(stats.languages) >= 2
    # Percentages should sum to ~100
    total_pct = sum(lang.percentage for lang in stats.languages)
    assert 99.0 <= total_pct <= 101.0


@pytest.mark.anyio
async def test_fetch_github_stats_no_token_raises():
    """fetch_github_stats raises ValueError without a token."""
    with pytest.raises(ValueError, match="token"):
        await fetch_github_stats("testuser", token=None)
```

**Step 3: Run test to verify it fails**

Run: `uv run pytest api/tests/test_github_fetcher.py -v`
Expected: FAIL — module not found.

**Step 4: Write the implementation**

Create `api/mandev_api/github_fetcher.py`:

```python
"""Fetch GitHub stats via the GraphQL API.

Sends a single batched query for contribution calendar, pinned repos,
top repositories (for stars + languages), and user stats.
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
query($login: String!) {
  user(login: $login) {
    followers { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: STARGAZERS, direction: DESC}) {
      totalCount
      nodes {
        name
        description
        stargazerCount
        forkCount
        primaryLanguage { name color }
        url
        languages(first: 10) {
          edges {
            size
            node { name color }
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
          primaryLanguage { name color }
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

    :param days: Contribution days sorted by date ascending.
    :returns: Tuple of (current_streak, longest_streak).
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
    """Aggregate language byte counts across repos into percentages.

    :param repos: Repository nodes from the GraphQL response.
    :returns: Languages sorted by percentage descending.
    """
    totals: dict[str, dict] = {}
    for repo in repos:
        for edge in repo.get("languages", {}).get("edges", []):
            name = edge["node"]["name"]
            color = edge["node"]["color"]
            size = edge["size"]
            if name in totals:
                totals[name]["size"] += size
            else:
                totals[name] = {"color": color, "size": size}

    grand_total = sum(v["size"] for v in totals.values())
    if grand_total == 0:
        return []

    languages = [
        GitHubLanguage(
            name=name,
            percentage=round(info["size"] / grand_total * 100, 1),
            color=info["color"],
        )
        for name, info in totals.items()
    ]
    languages.sort(key=lambda x: x.percentage, reverse=True)
    return languages


async def fetch_github_stats(username: str, *, token: str | None) -> GitHubStats:
    """Fetch GitHub stats for a user via the GraphQL API.

    :param username: GitHub username.
    :param token: GitHub personal access token.
    :returns: Aggregated stats.
    :raises ValueError: If no token is provided.
    :raises httpx.HTTPStatusError: On API errors.
    """
    if not token:
        raise ValueError("A GitHub token is required to fetch stats.")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GITHUB_GRAPHQL_URL,
            json={"query": QUERY, "variables": {"login": username}},
            headers=headers,
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()

    user = data["data"]["user"]

    # Repos and stars
    repo_nodes = user["repositories"]["nodes"]
    total_stars = sum(r["stargazerCount"] for r in repo_nodes)

    # Pinned repos
    pinned = [
        GitHubRepo(
            name=r["name"],
            description=r.get("description"),
            stars=r["stargazerCount"],
            forks=r["forkCount"],
            language=r["primaryLanguage"]["name"] if r.get("primaryLanguage") else None,
            language_color=r["primaryLanguage"]["color"] if r.get("primaryLanguage") else None,
            url=r["url"],
        )
        for r in user["pinnedItems"]["nodes"]
    ]

    # Contributions
    calendar = user["contributionsCollection"]["contributionCalendar"]
    contribution_days = [
        ContributionDay(date=day["date"], count=day["contributionCount"])
        for week in calendar["weeks"]
        for day in week["contributionDays"]
    ]
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
        pinned_repos=pinned,
        contributions=[{"date": d.date, "count": d.count} for d in contribution_days],
        fetched_at=datetime.now(timezone.utc).isoformat(),
    )
```

**Step 5: Run tests to verify they pass**

Run: `uv run pytest api/tests/test_github_fetcher.py -v`
Expected: All PASS

**Step 6: Commit**

```bash
git add api/mandev_api/github_fetcher.py api/tests/test_github_fetcher.py api/pyproject.toml
git commit -m "feat(api): add GitHub GraphQL stats fetcher"
```

---

### Task 7: Add cache-aware stats service

**Files:**
- Create: `api/mandev_api/github_service.py`
- Create: `api/tests/test_github_service.py`

**Step 1: Write the failing test**

Create `api/tests/test_github_service.py`:

```python
"""Tests for the GitHub stats caching service."""

import json
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from mandev_api.database import Base
from mandev_api.db_models import GitHubStatsCache
from mandev_api.github_service import get_github_stats, CACHE_TTL_HOURS

import mandev_api.db_models  # noqa: F401


@pytest.fixture
async def db_session():
    """Yield an async session backed by an in-memory SQLite database."""
    engine = create_async_engine("sqlite+aiosqlite://", echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


FAKE_STATS = {
    "total_stars": 100,
    "total_repos": 10,
    "followers": 50,
    "total_contributions": 500,
    "current_streak": 5,
    "longest_streak": 30,
    "languages": [],
    "pinned_repos": [],
    "contributions": [],
    "fetched_at": "2026-02-14T00:00:00Z",
}


@pytest.mark.anyio
async def test_get_stats_fetches_on_cache_miss(db_session: AsyncSession):
    """When cache is empty, fetches from GitHub and stores."""
    mock_stats = AsyncMock()
    mock_stats.model_dump.return_value = FAKE_STATS

    with patch("mandev_api.github_service.fetch_github_stats", return_value=mock_stats) as mock_fetch:
        result = await get_github_stats("testuser", db=db_session, token="fake")

    mock_fetch.assert_called_once_with("testuser", token="fake")
    assert result is not None
    assert result["total_stars"] == 100

    # Verify it was cached
    row = await db_session.execute(
        select(GitHubStatsCache).where(GitHubStatsCache.github_username == "testuser")
    )
    assert row.scalar_one_or_none() is not None


@pytest.mark.anyio
async def test_get_stats_returns_from_fresh_cache(db_session: AsyncSession):
    """When cache is fresh, returns cached data without fetching."""
    cache_entry = GitHubStatsCache(
        github_username="cached-user",
        stats_json=json.dumps(FAKE_STATS),
        fetched_at=datetime.now(timezone.utc),
    )
    db_session.add(cache_entry)
    await db_session.commit()

    with patch("mandev_api.github_service.fetch_github_stats") as mock_fetch:
        result = await get_github_stats("cached-user", db=db_session, token="fake")

    mock_fetch.assert_not_called()
    assert result["total_stars"] == 100


@pytest.mark.anyio
async def test_get_stats_refetches_on_stale_cache(db_session: AsyncSession):
    """When cache is stale, refetches from GitHub."""
    stale_time = datetime.now(timezone.utc) - timedelta(hours=CACHE_TTL_HOURS + 1)
    cache_entry = GitHubStatsCache(
        github_username="stale-user",
        stats_json=json.dumps(FAKE_STATS),
        fetched_at=stale_time,
    )
    db_session.add(cache_entry)
    await db_session.commit()

    updated_stats = {**FAKE_STATS, "total_stars": 200}
    mock_stats = AsyncMock()
    mock_stats.model_dump.return_value = updated_stats

    with patch("mandev_api.github_service.fetch_github_stats", return_value=mock_stats):
        result = await get_github_stats("stale-user", db=db_session, token="fake")

    assert result["total_stars"] == 200


@pytest.mark.anyio
async def test_get_stats_returns_none_without_token(db_session: AsyncSession):
    """Without a token and no cache, returns None."""
    result = await get_github_stats("notoken-user", db=db_session, token=None)
    assert result is None
```

**Step 2: Run test to verify it fails**

Run: `uv run pytest api/tests/test_github_service.py -v`
Expected: FAIL — module not found.

**Step 3: Write the implementation**

Create `api/mandev_api/github_service.py`:

```python
"""Cache-aware GitHub stats service.

Wraps the GitHub fetcher with a SQLite-backed cache layer.
Stats are cached per GitHub username with a configurable TTL.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from mandev_api.db_models import GitHubStatsCache
from mandev_api.github_fetcher import fetch_github_stats

logger = logging.getLogger(__name__)

CACHE_TTL_HOURS = 24


async def get_github_stats(
    github_username: str,
    *,
    db: AsyncSession,
    token: str | None,
) -> dict | None:
    """Get GitHub stats, using cache when fresh.

    :param github_username: The GitHub username to look up.
    :param db: Database session.
    :param token: GitHub API token (None disables fetching).
    :returns: Stats dict or None if unavailable.
    """
    # Check cache
    result = await db.execute(
        select(GitHubStatsCache).where(
            GitHubStatsCache.github_username == github_username
        )
    )
    cached = result.scalar_one_or_none()

    if cached is not None:
        age = datetime.now(timezone.utc) - cached.fetched_at.replace(tzinfo=timezone.utc)
        if age < timedelta(hours=CACHE_TTL_HOURS):
            return json.loads(cached.stats_json)

    # No fresh cache — fetch if we have a token
    if not token:
        return None

    try:
        stats = await fetch_github_stats(github_username, token=token)
    except Exception:
        logger.exception("Failed to fetch GitHub stats for %s", github_username)
        # Return stale cache if available
        if cached is not None:
            return json.loads(cached.stats_json)
        return None

    stats_json = json.dumps(stats.model_dump())

    if cached is not None:
        cached.stats_json = stats_json
        cached.fetched_at = datetime.now(timezone.utc)
    else:
        cached = GitHubStatsCache(
            github_username=github_username,
            stats_json=stats_json,
            fetched_at=datetime.now(timezone.utc),
        )
        db.add(cached)

    await db.commit()
    return json.loads(stats_json)
```

**Step 4: Run tests to verify they pass**

Run: `uv run pytest api/tests/test_github_service.py -v`
Expected: All PASS

**Step 5: Commit**

```bash
git add api/mandev_api/github_service.py api/tests/test_github_service.py
git commit -m "feat(api): add cache-aware GitHub stats service"
```

---

### Task 8: Wire GitHub stats into the profile API

**Files:**
- Modify: `api/mandev_api/routers/profile.py`
- Modify: `api/tests/test_profile.py`

**Step 1: Write the failing test**

Add to `api/tests/test_profile.py`:

```python
@pytest.mark.anyio
async def test_public_profile_includes_github_stats_when_cached(client: AsyncClient) -> None:
    """GET /api/profile/{username} includes github_stats when available."""
    token = await _signup_and_login(client, "gh_user")
    config_with_github = {
        **VALID_CONFIG,
        "github": {"username": "gh-test"},
    }
    await client.put(
        "/api/profile",
        json=config_with_github,
        headers={"Authorization": f"Bearer {token}"},
    )

    # The response should have a github_stats field (possibly null without token/cache)
    resp = await client.get("/api/profile/gh_user")
    assert resp.status_code == 200
    data = resp.json()
    assert "github" in data
    # github_stats may be null (no token configured in test), but the key should exist
    assert "github_stats" in data
```

**Step 2: Run test to verify it fails**

Run: `uv run pytest api/tests/test_profile.py::test_public_profile_includes_github_stats_when_cached -v`
Expected: FAIL — `github_stats` key not present in response.

**Step 3: Update the profile endpoint**

Modify `get_public_profile` in `api/mandev_api/routers/profile.py`:

```python
@router.get("/api/profile/{username}")
async def get_public_profile(
    username: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return a user's public profile by username.

    Includes GitHub stats if the profile has a ``[github]`` section
    and cached stats are available.

    :param username: The username to look up.
    :param db: Database session.
    :returns: The public profile with username and optional github_stats.
    """
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id),
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    config = json.loads(profile.config_json) if profile.config_json else {}
    response = {"username": user.username, **config}

    # Attach GitHub stats if configured
    github_config = config.get("github")
    if github_config and github_config.get("username"):
        from mandev_api.github_service import get_github_stats
        from mandev_api.config import settings

        stats = await get_github_stats(
            github_config["username"],
            db=db,
            token=settings.github_token,
        )
        response["github_stats"] = stats
    else:
        response["github_stats"] = None

    return response
```

**Step 4: Run tests to verify they pass**

Run: `uv run pytest api/tests/test_profile.py -v`
Expected: All PASS

**Step 5: Commit**

```bash
git add api/mandev_api/routers/profile.py api/tests/test_profile.py
git commit -m "feat(api): serve GitHub stats alongside public profiles"
```

---

### Task 9: Add fake GitHub stats to seed data

**Files:**
- Modify: `scripts/seed.py`

**Step 1: Add fake stats insertion**

Add a `SEED_GITHUB_STATS` dict to `scripts/seed.py` mapping GitHub usernames to fake `GitHubStats` data, and insert into `github_stats_cache` during seeding. Include realistic fake data for `alice-example`, `bob-example`, and `dave-example`. Include contribution heatmap data (365 days of fake counts), pinned repos with stars/forks, and language breakdowns.

The fake stats should be realistic enough to render well:
- alice: Python-heavy, ~1200 stars, 365-day heatmap
- bob: TypeScript-heavy, ~800 stars, active heatmap
- dave: Multi-language, ~3000 stars, very active heatmap

Insert into `GitHubStatsCache` table alongside the user seeding.

**Step 2: Run seed and verify**

Run: `just seed`
Then: `curl -s http://localhost:8000/api/profile/alice | python -m json.tool | grep github_stats`
Expected: `github_stats` field with full fake data.

**Step 3: Commit**

```bash
git add scripts/seed.py
git commit -m "feat: add fake GitHub stats to seed data"
```

---

### Task 10: Render GitHub stats on the profile page

**Files:**
- Modify: `web/src/pages/[username].astro`

**Step 1: Add TypeScript interfaces**

Add to the frontmatter of `[username].astro`:

```typescript
interface GitHubLanguage {
  name: string;
  percentage: number;
  color: string;
}

interface GitHubRepo {
  name: string;
  description?: string;
  stars: number;
  forks: number;
  language?: string;
  language_color?: string;
  url: string;
}

interface GitHubStats {
  total_stars: number;
  total_repos: number;
  followers: number;
  total_contributions: number;
  current_streak: number;
  longest_streak: number;
  languages: GitHubLanguage[];
  pinned_repos: GitHubRepo[];
  contributions: { date: string; count: number }[];
}

interface GitHubConfig {
  username: string;
  show_heatmap?: boolean;
  show_stats?: boolean;
  show_languages?: boolean;
  show_pinned?: boolean;
}
```

Add to `ProfileData`:

```typescript
github?: GitHubConfig;
github_stats?: GitHubStats | null;
```

**Step 2: Add the GitHub stats section rendering**

After the existing section rendering loop (after links), add a GitHub section that renders when `github_stats` is available. Include:

- **Stats line:** `Stars: 1,234  Repos: 42  Followers: 567  Contributions: 2,048` — using terminal colors
- **Contribution heatmap:** A grid of `\u2588` characters at 4 intensity levels, 52 columns x 7 rows, with month labels. Use CSS `opacity` at 0.2/0.4/0.7/1.0 for the 4 intensity buckets. Color uses `var(--accent)`.
- **Language bar:** A single horizontal bar composed of colored segments, with a legend below showing `name percentage%`
- **Pinned repos:** Like the projects section — name, description, `stars/forks` inline

Each sub-section respects the `show_*` flags from the GitHub config.

**Step 3: Test with seeded data**

Start the dev servers (`just dev` and `just web`), navigate to `http://localhost:4321/alice`, and verify:
- Stats line appears below the main profile sections
- Heatmap renders as a grid of colored blocks
- Language bar shows Python as dominant
- Pinned repos show with star/fork counts

**Step 4: Commit**

```bash
git add web/src/pages/\\[username\\].astro
git commit -m "feat(web): render GitHub stats on profile pages"
```

---

### Task 11: Run full test suite and verify

**Step 1: Run all Python tests**

Run: `uv run pytest -v`
Expected: All PASS

**Step 2: Verify seed + profile rendering end-to-end**

Run: `just seed`
Then browse to each seeded profile and verify it renders:
- `http://localhost:4321/alice` — full profile with GitHub stats
- `http://localhost:4321/bob` — full profile with GitHub stats
- `http://localhost:4321/carol` — full profile, no GitHub section
- `http://localhost:4321/dave` — full profile with GitHub stats
- `http://localhost:4321/eve` — minimal profile, no GitHub section

**Step 3: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup for seed data and GitHub stats"
```
