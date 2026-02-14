"""Seed the database with fake developer profiles.

Idempotent: deletes existing seed users by username and re-inserts them
on every run. Uses the ORM directly -- no HTTP calls required.
"""

import asyncio
import json
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# sys.path setup -- this script lives outside the installable packages, so we
# need to make ``mandev_api`` and ``mandev_core`` importable.
# ---------------------------------------------------------------------------
_repo_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_repo_root / "api"))
sys.path.insert(0, str(_repo_root / "core"))

from sqlalchemy import select  # noqa: E402

from mandev_api.auth import hash_password  # noqa: E402
from mandev_api.database import Base, SessionLocal, engine  # noqa: E402
from mandev_api.db_models import User, UserProfile  # noqa: E402

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
            },
            "skills": [
                {"name": "Python", "level": "expert"},
                {"name": "Rust", "level": "advanced"},
                {"name": "TypeScript", "level": "advanced"},
                {"name": "C", "level": "intermediate"},
                {"name": "Zig", "level": "beginner"},
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
]

SEED_USERNAMES = [u["username"] for u in SEED_USERS]


async def seed() -> None:
    """Clear existing seed users and re-insert all seed profiles."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        # Delete existing seed users and their profiles
        result = await session.execute(
            select(User).where(User.username.in_(SEED_USERNAMES))
        )
        existing = result.scalars().all()
        for user in existing:
            # Delete profile first (no FK cascade configured)
            profile_result = await session.execute(
                select(UserProfile).where(UserProfile.user_id == user.id)
            )
            existing_profile = profile_result.scalar_one_or_none()
            if existing_profile:
                await session.delete(existing_profile)
            await session.delete(user)
        await session.flush()

        # Insert fresh seed data
        for entry in SEED_USERS:
            user = User(
                username=entry["username"],
                email=entry["email"],
                password_hash=hash_password(entry["password"]),
            )
            session.add(user)
            await session.flush()  # populate user.id

            profile = UserProfile(
                user_id=user.id,
                config_json=json.dumps(entry["config"]),
            )
            session.add(profile)

        await session.commit()

    print(f"Seeded {len(SEED_USERS)} users: {', '.join(SEED_USERNAMES)}")


if __name__ == "__main__":
    asyncio.run(seed())
