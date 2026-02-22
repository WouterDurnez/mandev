"""Seed the database with fake developer profiles.

Idempotent: deletes existing seed users by username and re-inserts them
on every run. Uses the ORM directly -- no HTTP calls required.
"""

import asyncio
import base64
import json
import struct
import sys
import zlib
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# sys.path setup -- this script lives outside the installable packages, so we
# need to make ``mandev_api`` and ``mandev_core`` importable.
# ---------------------------------------------------------------------------
_repo_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_repo_root / "api"))
sys.path.insert(0, str(_repo_root / "core"))


from mandev_api.auth import hash_password  # noqa: E402
from mandev_api.tables import GitHubStatsCache, IntegrationCache, User, UserProfile  # noqa: E402

# ---------------------------------------------------------------------------
# Avatar generation (pure Python PNG identicons)
# ---------------------------------------------------------------------------


def _make_png(pixels: list[list[tuple[int, int, int]]], size: int) -> bytes:
    """Create a minimal RGB PNG from a pixel grid.

    :param pixels: 2D grid of (r, g, b) tuples.
    :param size: Width/height of the square image.
    :returns: Raw PNG bytes.
    """
    def _chunk(chunk_type: bytes, data: bytes) -> bytes:
        c = chunk_type + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    header = b"\x89PNG\r\n\x1a\n"
    ihdr = _chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))

    raw = b""
    for row in pixels:
        raw += b"\x00"  # filter: none
        for r, g, b in row:
            raw += struct.pack("BBB", r, g, b)

    idat = _chunk(b"IDAT", zlib.compress(raw))
    iend = _chunk(b"IEND", b"")
    return header + ihdr + idat + iend


def _generate_identicon(seed_str: str, grid: int = 8, px_size: int = 4) -> str:
    """Generate a symmetric identicon as a data URL.

    :param seed_str: String to derive the pattern from (e.g. username).
    :param grid: Grid size (half is mirrored for symmetry).
    :param px_size: Pixels per grid cell in the output image.
    :returns: A ``data:image/png;base64,...`` URL.
    """
    h = hash(seed_str + "identicon")
    # Pick a foreground color from the hash
    r = (h >> 16) & 0xFF
    g = (h >> 8) & 0xFF
    b = h & 0xFF
    # Ensure decent contrast: boost saturation
    mx = max(r, g, b)
    if mx < 100:
        r, g, b = min(r + 100, 255), min(g + 80, 255), min(b + 120, 255)

    bg = (40, 42, 54)  # dark background
    fg = (r, g, b)

    half = (grid + 1) // 2
    img_size = grid * px_size
    pixels: list[list[tuple[int, int, int]]] = []

    for row_i in range(grid):
        pixel_row: list[tuple[int, int, int]] = []
        for col_i in range(grid):
            # Mirror horizontally
            mi = col_i if col_i < half else grid - 1 - col_i
            bit = hash((seed_str, row_i, mi)) % 3  # ~66% fill
            cell_color = fg if bit > 0 else bg
            pixel_row.extend([cell_color] * px_size)
        for _ in range(px_size):
            pixels.append(pixel_row)

    png_bytes = _make_png(pixels, img_size)
    b64 = base64.b64encode(png_bytes).decode()
    return f"data:image/png;base64,{b64}"


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

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
                "avatar": _generate_identicon("alice"),
            },
            "skills": [
                {"name": "Python", "level": "expert", "domain": "Backend"},
                {"name": "Go", "level": "expert", "domain": "Backend"},
                {"name": "PostgreSQL", "level": "advanced", "domain": "Data"},
                {"name": "Kafka", "level": "advanced", "domain": "Data"},
                {"name": "Kubernetes", "level": "intermediate", "domain": "Infrastructure"},
                {"name": "Rust", "level": "beginner", "domain": "Systems"},
            ],
            "projects": [
                {"name": "streamline", "repo": "https://github.com/alice/streamline", "description": "High-throughput event processing pipeline"},
                {"name": "dbmigrate", "repo": "https://github.com/alice/dbmigrate", "url": "https://dbmigrate.dev", "description": "Zero-downtime database migration toolkit"},
                {"name": "loadtest", "repo": "https://github.com/alice/loadtest", "description": "Declarative load testing framework for gRPC services"},
            ],
            "experience": [
                {"role": "Staff Engineer", "company": "Datadog", "start": "2023", "description": "Leading the event pipeline team. Reduced p99 latency by 40%."},
                {"role": "Senior Engineer", "company": "Stripe", "start": "2019", "end": "2023", "description": "Built internal developer tooling for payment processing."},
                {"role": "Software Engineer", "company": "Twilio", "start": "2016", "end": "2019"},
            ],
            "links": [
                {"label": "GitHub", "url": "https://github.com/alice"},
                {"label": "Blog", "url": "https://alice.dev/blog"},
                {"label": "LinkedIn", "url": "https://linkedin.com/in/alicechen"},
            ],
            "theme": {"scheme": "dracula", "font": "JetBrains Mono", "mode": "dark"},
            "github": {"username": "alice-example"},
            "pypi": {"packages": ["streamline", "dbmigrate", "loadtest"], "show_downloads": True, "max_packages": 10},
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
                "avatar": _generate_identicon("bob"),
            },
            "skills": [
                {"name": "TypeScript", "level": "expert", "domain": "Frontend"},
                {"name": "React", "level": "expert", "domain": "Frontend"},
                {"name": "CSS", "level": "expert", "domain": "Design"},
                {"name": "Next.js", "level": "advanced", "domain": "Frontend"},
                {"name": "Figma", "level": "advanced", "domain": "Design"},
                {"name": "Three.js", "level": "intermediate", "domain": "Graphics"},
                {"name": "Rust", "level": "beginner", "domain": "Systems"},
            ],
            "projects": [
                {"name": "motion-kit", "repo": "https://github.com/bob/motion-kit", "url": "https://motion-kit.dev", "description": "Spring-based animation library for React"},
                {"name": "a11y-audit", "repo": "https://github.com/bob/a11y-audit", "description": "Automated accessibility testing CLI"},
            ],
            "experience": [
                {"role": "Senior Frontend Engineer", "company": "Vercel", "start": "2022", "description": "Design system and component library. Shipped Next.js App Router docs."},
                {"role": "Frontend Engineer", "company": "Figma", "start": "2019", "end": "2022"},
            ],
            "links": [
                {"label": "GitHub", "url": "https://github.com/bob"},
                {"label": "Twitter", "url": "https://twitter.com/bobrivera"},
                {"label": "Dribbble", "url": "https://dribbble.com/bob"},
                {"label": "Website", "url": "https://bobrivera.design"},
            ],
            "theme": {"scheme": "tokyo-night", "font": "Fira Code", "mode": "dark"},
            "github": {"username": "bob-example"},
            "devto": {"username": "bob-example", "show_articles": True, "show_stats": True, "max_articles": 5},
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
                "avatar": _generate_identicon("carol"),
            },
            "skills": [
                {"name": "Terraform", "level": "expert", "domain": "IaC"},
                {"name": "Kubernetes", "level": "expert", "domain": "Platform"},
                {"name": "AWS", "level": "expert", "domain": "Cloud"},
                {"name": "Python", "level": "advanced", "domain": "Languages"},
                {"name": "Go", "level": "advanced", "domain": "Languages"},
                {"name": "Bash", "level": "advanced", "domain": "Languages"},
                {"name": "Prometheus", "level": "intermediate", "domain": "Observability"},
                {"name": "Argo CD", "level": "intermediate", "domain": "Platform"},
            ],
            "projects": [
                {"name": "infra-as-code", "repo": "https://github.com/carol/infra-as-code", "description": "Production-ready Terraform modules for AWS"},
                {"name": "k8s-operator", "repo": "https://github.com/carol/k8s-operator", "description": "Custom Kubernetes operator for canary deployments"},
            ],
            "experience": [
                {"role": "Platform Engineer", "company": "Cloudflare", "start": "2021", "description": "Zero-trust networking and edge deployment automation."},
                {"role": "DevOps Engineer", "company": "HashiCorp", "start": "2018", "end": "2021"},
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
                "avatar": _generate_identicon("dave"),
            },
            "skills": [
                {"name": "Python", "level": "expert", "domain": "Languages"},
                {"name": "Rust", "level": "advanced", "domain": "Systems"},
                {"name": "TypeScript", "level": "advanced", "domain": "Languages"},
                {"name": "C", "level": "intermediate", "domain": "Systems"},
                {"name": "Zig", "level": "beginner", "domain": "Systems"},
            ],
            "projects": [
                {"name": "fastparse", "repo": "https://github.com/dave/fastparse", "url": "https://fastparse.io", "description": "High-performance parsing library with zero-copy semantics"},
                {"name": "cli-forge", "repo": "https://github.com/dave/cli-forge", "description": "Opinionated CLI framework with built-in testing"},
                {"name": "dotenv-vault", "repo": "https://github.com/dave/dotenv-vault", "description": "Encrypted .env file management for teams"},
                {"name": "bench-it", "repo": "https://github.com/dave/bench-it", "description": "Micro-benchmarking with statistical analysis"},
                {"name": "type-guard", "repo": "https://github.com/dave/type-guard", "description": "Runtime type checking for Python with zero overhead in production"},
            ],
            "experience": [
                {"role": "Independent OSS Maintainer", "company": "Self-employed", "start": "2020", "description": "Full-time open source. Funded by GitHub Sponsors and Polar."},
                {"role": "Senior Engineer", "company": "Mozilla", "start": "2016", "end": "2020", "description": "Worked on Firefox performance tooling."},
            ],
            "links": [
                {"label": "GitHub", "url": "https://github.com/dave"},
                {"label": "Sponsors", "url": "https://github.com/sponsors/dave"},
                {"label": "Blog", "url": "https://dave.codes"},
                {"label": "Mastodon", "url": "https://fosstodon.org/@dave"},
            ],
            "theme": {"scheme": "catppuccin", "font": "Victor Mono", "mode": "dark"},
            "github": {"username": "dave-example"},
            "npm": {"username": "dave-example", "show_packages": True, "show_downloads": True, "max_packages": 10},
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
                "avatar": _generate_identicon("eve"),
            },
            "skills": [
                {"name": "JavaScript", "level": "intermediate"},
                {"name": "HTML/CSS", "level": "intermediate"},
                {"name": "React", "level": "beginner"},
                {"name": "Python", "level": "beginner"},
            ],
            "projects": [
                {"name": "til-garden", "url": "https://eve.garden", "description": "My digital garden of things I learned today"},
            ],
            "experience": [
                {"role": "Junior Developer", "company": "Local Agency", "start": "2025", "description": "Building client websites. Learning fast."},
            ],
            "links": [
                {"label": "GitHub", "url": "https://github.com/eve"},
                {"label": "Blog", "url": "https://eve.garden"},
            ],
            "theme": {"scheme": "solarized-dark", "font": "Cascadia Code", "mode": "light"},
        },
    },
    {
        "username": "wouter",
        "email": "wouter@rugvin.be",
        "password": "darksoul",
        "config": {
            "profile": {
                "name": "Wouter",
                "tagline": "",
                "about": "",
                "avatar": _generate_identicon("wouter"),
            },
            "theme": {"scheme": "dracula", "font": "JetBrains Mono", "mode": "dark"},
            "skills": [],
            "projects": [],
            "experience": [],
            "links": [],
        },
    },
]

SEED_USERNAMES = [u["username"] for u in SEED_USERS]


def _fake_contributions(seed: int, activity_level: float = 0.7) -> list[dict]:
    """Generate 365 days of fake contribution data.

    :param seed: Seed for reproducible randomness.
    :param activity_level: Probability of having contributions on a given day.
    :returns: List of ``{date, count}`` dicts.
    """
    days: list[dict] = []
    today = date.today()
    base = today - timedelta(days=364)
    for i in range(365):
        d = base + timedelta(days=i)
        # Simple hash-based deterministic "random"
        h = hash((seed, d.isoformat())) % 100
        if h < activity_level * 100:
            count = (h % 7) + 1  # 1-7 contributions
        else:
            count = 0
        days.append({"date": d.isoformat(), "count": count})
    return days


SEED_GITHUB_STATS: dict[str, dict] = {
    "alice-example": {
        "total_stars": 1247,
        "total_repos": 38,
        "followers": 892,
        "total_contributions": 1653,
        "current_streak": 12,
        "longest_streak": 47,
        "languages": [
            {"name": "Python", "percentage": 52.3},
            {"name": "Go", "percentage": 28.1},
            {"name": "Shell", "percentage": 8.4},
            {"name": "Dockerfile", "percentage": 5.2},
            {"name": "SQL", "percentage": 3.8},
            {"name": "Other", "percentage": 2.2},
        ],
        "pinned_repos": [
            {"name": "streamline", "stars": 342, "forks": 45, "language": "Go"},
            {"name": "dbmigrate", "stars": 567, "forks": 89, "language": "Python"},
            {"name": "loadtest", "stars": 178, "forks": 23, "language": "Python"},
        ],
        "contributions": _fake_contributions(seed=42, activity_level=0.7),
    },
    "bob-example": {
        "total_stars": 823,
        "total_repos": 24,
        "followers": 1456,
        "total_contributions": 987,
        "current_streak": 5,
        "longest_streak": 31,
        "languages": [
            {"name": "TypeScript", "percentage": 48.7},
            {"name": "CSS", "percentage": 22.3},
            {"name": "JavaScript", "percentage": 15.1},
            {"name": "HTML", "percentage": 8.9},
            {"name": "MDX", "percentage": 5.0},
        ],
        "pinned_repos": [
            {"name": "motion-kit", "stars": 612, "forks": 78, "language": "TypeScript"},
            {"name": "a11y-audit", "stars": 211, "forks": 34, "language": "TypeScript"},
        ],
        "contributions": _fake_contributions(seed=99, activity_level=0.55),
    },
    "dave-example": {
        "total_stars": 3421,
        "total_repos": 67,
        "followers": 2103,
        "total_contributions": 2847,
        "current_streak": 34,
        "longest_streak": 92,
        "languages": [
            {"name": "Python", "percentage": 35.2},
            {"name": "Rust", "percentage": 25.8},
            {"name": "TypeScript", "percentage": 18.4},
            {"name": "C", "percentage": 12.1},
            {"name": "Zig", "percentage": 5.3},
            {"name": "Shell", "percentage": 3.2},
        ],
        "pinned_repos": [
            {"name": "fastparse", "stars": 1234, "forks": 167, "language": "Rust"},
            {"name": "cli-forge", "stars": 876, "forks": 112, "language": "Python"},
            {"name": "dotenv-vault", "stars": 543, "forks": 67, "language": "Python"},
            {"name": "bench-it", "stars": 432, "forks": 34, "language": "Rust"},
            {"name": "type-guard", "stars": 336, "forks": 28, "language": "Python"},
        ],
        "contributions": _fake_contributions(seed=7, activity_level=0.85),
    },
}

_SEED_GITHUB_USERNAMES = list(SEED_GITHUB_STATS.keys())


# ---------------------------------------------------------------------------
# Integration seed data
# ---------------------------------------------------------------------------

SEED_INTEGRATION_CACHE: list[dict] = [
    {
        "service": "npm",
        "lookup_key": "dave-example",
        "stats": {
            "total_packages": 5,
            "total_weekly_downloads": 45231,
            "packages": [
                {"name": "fastparse", "version": "2.1.0", "description": "High-performance parsing library", "weekly_downloads": 12340, "url": "https://www.npmjs.com/package/fastparse"},
                {"name": "cli-forge", "version": "1.3.2", "description": "Opinionated CLI framework", "weekly_downloads": 8901, "url": "https://www.npmjs.com/package/cli-forge"},
                {"name": "dotenv-vault", "version": "3.0.1", "description": "Encrypted .env management", "weekly_downloads": 11200, "url": "https://www.npmjs.com/package/dotenv-vault"},
                {"name": "bench-it", "version": "0.9.4", "description": "Micro-benchmarking toolkit", "weekly_downloads": 7450, "url": "https://www.npmjs.com/package/bench-it"},
                {"name": "type-guard", "version": "1.1.0", "description": "Runtime type checking", "weekly_downloads": 5340, "url": "https://www.npmjs.com/package/type-guard"},
            ],
            "fetched_at": "2026-02-21T00:00:00+00:00",
        },
    },
    {
        "service": "pypi",
        "lookup_key": "ab95f7098f30dfbb",
        "stats": {
            "total_packages": 3,
            "total_monthly_downloads": 128450,
            "packages": [
                {"name": "streamline", "version": "4.2.1", "description": "High-throughput event processing pipeline", "monthly_downloads": 67200, "url": "https://pypi.org/project/streamline/"},
                {"name": "dbmigrate", "version": "2.8.0", "description": "Zero-downtime database migration toolkit", "monthly_downloads": 45100, "url": "https://pypi.org/project/dbmigrate/"},
                {"name": "loadtest", "version": "1.5.3", "description": "Declarative load testing for gRPC", "monthly_downloads": 16150, "url": "https://pypi.org/project/loadtest/"},
            ],
            "fetched_at": "2026-02-21T00:00:00+00:00",
        },
    },
    {
        "service": "devto",
        "lookup_key": "bob-example",
        "stats": {
            "total_articles": 23,
            "total_reactions": 1842,
            "total_comments": 312,
            "articles": [
                {"title": "Building Accessible Design Systems from Scratch", "url": "https://dev.to/bob/design-systems-a11y", "published_at": "2025-11-15T10:00:00Z", "reactions": 423, "comments": 67, "reading_time": 12, "tags": ["a11y", "react", "design"]},
                {"title": "Spring Animations in React: A Deep Dive", "url": "https://dev.to/bob/spring-animations-react", "published_at": "2025-09-22T08:00:00Z", "reactions": 356, "comments": 45, "reading_time": 8, "tags": ["react", "animation", "css"]},
                {"title": "CSS Container Queries Changed Everything", "url": "https://dev.to/bob/css-container-queries", "published_at": "2025-07-10T12:00:00Z", "reactions": 298, "comments": 34, "reading_time": 6, "tags": ["css", "frontend"]},
                {"title": "Why I Switched from Next.js to Astro", "url": "https://dev.to/bob/nextjs-to-astro", "published_at": "2025-05-03T09:00:00Z", "reactions": 512, "comments": 89, "reading_time": 10, "tags": ["astro", "nextjs", "webdev"]},
                {"title": "The State of TypeScript in 2025", "url": "https://dev.to/bob/typescript-2025", "published_at": "2025-01-20T14:00:00Z", "reactions": 253, "comments": 77, "reading_time": 15, "tags": ["typescript", "javascript"]},
            ],
            "fetched_at": "2026-02-21T00:00:00+00:00",
        },
    },
]


async def seed() -> None:
    """Clear existing seed users and re-insert all seed profiles.

    Assumes migrations have already been run.
    """
    # Delete existing seed users' profiles, then the users themselves
    existing_users = (
        await User.objects()
        .where(User.username.is_in(SEED_USERNAMES))
        .run()
    )
    for user in existing_users:
        await UserProfile.delete().where(UserProfile.user_id == user.id).run()
    await User.delete().where(User.username.is_in(SEED_USERNAMES)).run()

    # Insert fresh seed data
    for entry in SEED_USERS:
        user = User(
            username=entry["username"],
            email=entry["email"],
            password_hash=hash_password(entry["password"]),
        )
        await user.save().run()

        profile = UserProfile(
            user_id=user.id,
            config_json=json.dumps(entry["config"]),
        )
        await profile.save().run()

    # Delete existing GitHub stats cache entries for seed users
    await GitHubStatsCache.delete().where(
        GitHubStatsCache.github_username.is_in(_SEED_GITHUB_USERNAMES)
    ).run()

    # Insert fake GitHub stats
    now = datetime.now(timezone.utc)
    for github_username, stats in SEED_GITHUB_STATS.items():
        cache = GitHubStatsCache(
            github_username=github_username,
            stats_json=json.dumps(stats),
            fetched_at=now,
        )
        await cache.save().run()

    # Delete existing integration cache entries for seed data
    seed_lookup_keys = [entry["lookup_key"] for entry in SEED_INTEGRATION_CACHE]
    await IntegrationCache.delete().where(
        IntegrationCache.lookup_key.is_in(seed_lookup_keys)
    ).run()

    # Insert fake integration stats
    for entry in SEED_INTEGRATION_CACHE:
        ic = IntegrationCache(
            service=entry["service"],
            lookup_key=entry["lookup_key"],
            stats_json=json.dumps(entry["stats"]),
            fetched_at=now,
        )
        await ic.save().run()

    print(f"Seeded {len(SEED_USERS)} users: {', '.join(SEED_USERNAMES)}")
    print(
        f"Seeded GitHub stats for: {', '.join(_SEED_GITHUB_USERNAMES)}"
    )
    print(
        f"Seeded integration cache: {len(SEED_INTEGRATION_CACHE)} entries"
    )


if __name__ == "__main__":
    asyncio.run(seed())
