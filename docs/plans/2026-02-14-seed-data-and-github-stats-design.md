# Seed Data & GitHub Stats Integration

**Date:** 2026-02-14
**Status:** Approved

## Goal

Two things: (1) populate the database with realistic fake profiles that exercise every field in the data model, and (2) add GitHub stats integration so profiles can display contribution data, pinned repos, and language breakdowns.

## Workstream A: Seed Data

### What

A Python seed script that inserts 4-5 fake developer profiles into SQLite, each using every field in `MandevConfig`.

### Personas

| # | Username | Archetype | Theme | Notable coverage |
|---|----------|-----------|-------|------------------|
| 1 | `alice` | Backend engineer | dracula / JetBrains Mono / dark | Long career, expert Python/Go, multiple projects with repos |
| 2 | `bob` | Frontend dev | tokyo-night / Fira Code / dark | Creative tagline, many links, advanced React/TS |
| 3 | `carol` | DevOps/SRE | gruvbox / IBM Plex Mono / light | Many skills at varied levels, minimal about |
| 4 | `dave` | OSS maintainer | catppuccin / Victor Mono / dark | Many projects with repos+URLs+descriptions, varied skill levels |
| 5 | `eve` | Junior dev | solarized / Cascadia Code / light | Few skills (beginner/intermediate), one experience entry |

Each profile fills: `profile` (name, tagline, about, avatar), `skills` (mix of all 4 levels), `projects` (with repo, url, description), `experience` (multiple entries, with and without end dates), `links` (GitHub, Twitter, website, etc.), `theme` (distinct scheme, font, mode), and `layout` (default section order).

### Implementation

- Script at `scripts/seed.py`
- `just seed` command to run it
- Inserts via the API's database layer directly (not HTTP calls)
- Idempotent: clears and re-seeds on each run

## Workstream B: GitHub Stats Integration

### Architecture

```
.mandev.toml          API server              GitHub GraphQL API
[github]        -->   fetcher + cache    -->   contribution calendar
username = "x"        (SQLite table)           pinned repos
show_heatmap          daily TTL                repo languages
show_stats                                     user stats
show_languages
show_pinned
```

**Auth model:** Single server-side GitHub token (env var `GITHUB_TOKEN`). All data fetched is public; the token exists solely for rate limits (5,000 req/hr vs 60/hr unauthenticated). No per-user OAuth.

### TOML spec addition

```toml
[github]
username = "janedoe"
show_heatmap = true      # contribution calendar grid
show_stats = true        # stars, repos, followers, contributions
show_languages = true    # language breakdown bar
show_pinned = true       # pinned/top repositories
```

All `show_*` fields default to `true` when a `[github]` section is present.

### Data models

**Config model** (in `core/mandev_core/models.py`):

```python
class GitHub(BaseModel):
    username: str
    show_heatmap: bool = True
    show_stats: bool = True
    show_languages: bool = True
    show_pinned: bool = True
```

Added as `github: GitHub | None = None` on `MandevConfig`.

**Fetched data model** (new, in `core/mandev_core/models.py` or a separate `github.py`):

```python
class GitHubLanguage(BaseModel):
    name: str
    percentage: float
    color: str

class GitHubRepo(BaseModel):
    name: str
    description: str | None = None
    stars: int
    forks: int
    language: str | None = None
    language_color: str | None = None
    url: str

class GitHubStats(BaseModel):
    total_stars: int
    total_repos: int
    followers: int
    total_contributions: int
    current_streak: int
    longest_streak: int
    languages: list[GitHubLanguage]
    pinned_repos: list[GitHubRepo]
    contributions: list[dict]  # [{date: str, count: int}, ...]
    fetched_at: str  # ISO timestamp
```

### Fetcher

Located in `api/` package. Single module that:

1. Takes a GitHub username
2. Sends one GraphQL query batching: contribution calendar, pinned repos, top repos (for stars + languages)
3. Computes derived stats: total stars, language percentages, streak data
4. Returns a `GitHubStats` instance

### Caching

- SQLite table `github_stats_cache` with columns: `username`, `stats_json`, `fetched_at`
- TTL: 24 hours
- On profile request: serve from cache if fresh, otherwise fetch + update
- Background refresh not needed for MVP; blocking fetch on cache miss is fine

### API changes

The existing `/api/profile/{username}` endpoint gains an optional `github_stats` field in its response when the profile has a `[github]` section and cached stats exist.

### Profile page rendering

All rendered in the terminal aesthetic of the profile:

- **Stats bar:** `Stars: 1,234  Repos: 42  Followers: 567  Contributions: 2,048` -- single line, dimmed labels, bright values
- **Contribution heatmap:** ASCII grid using `U+2588` (full block) at varying opacity/color intensity, 52 columns x 7 rows, labeled with month abbreviations
- **Pinned repos:** Similar to existing projects section but with `stars/forks` counts inline
- **Language breakdown:** Horizontal segmented bar using block characters + legend with percentages

### Seed data for GitHub stats

The seed script includes fake `GitHubStats` for each profile that has a `[github]` section (alice, bob, dave). This lets the UI be developed and tested without live API calls. Carol and eve don't have GitHub sections to test that the page renders cleanly without stats.

## Out of scope

- Per-user OAuth (server token only)
- Landing page changes
- Dashboard UI for GitHub settings (TOML config only)
- Real-time/webhook-based updates (daily cache is fine)
- Private contribution data
