"""Piccolo ORM table definitions for the mandev API."""

from piccolo.columns import (
    ForeignKey,
    Integer,
    Text,
    Timestamptz,
    Varchar,
)
from piccolo.columns.defaults.timestamptz import TimestamptzNow
from piccolo.table import Table


class User(Table, tablename="users"):
    """A registered user."""

    email = Varchar(length=255, unique=True, index=True)
    username = Varchar(length=63, unique=True, index=True)
    password_hash = Varchar(length=255)
    github_username = Varchar(length=255, null=True, default=None)
    github_token = Varchar(length=255, null=True, default=None)
    created_at = Timestamptz(default=TimestamptzNow())


class UserProfile(Table, tablename="user_profiles"):
    """Stores a user's mandev config as JSON text."""

    user_id = ForeignKey(references=User, unique=True)
    config_json = Text(default="{}")
    updated_at = Timestamptz(default=TimestamptzNow())


class GitHubStatsCache(Table, tablename="github_stats_cache"):
    """Cached GitHub stats for a username."""

    github_username = Varchar(length=255, unique=True, index=True)
    stats_json = Text(default="{}")
    fetched_at = Timestamptz(default=TimestamptzNow())


class ProfileView(Table, tablename="profile_views"):
    """Daily aggregated profile view counts."""

    username = Varchar(length=63, index=True)
    date = Varchar(length=10)  # YYYY-MM-DD
    count = Integer(default=0)


class IntegrationCache(Table, tablename="integration_cache"):
    """Generic cache for integration stats (npm, PyPI, Dev.to, etc.).

    Uses ``(service, lookup_key)`` as logical composite key so adding
    new integrations requires no schema changes.
    """

    service = Varchar(length=32, index=True)
    lookup_key = Varchar(length=255, index=True)
    stats_json = Text(default="{}")
    fetched_at = Timestamptz(default=TimestamptzNow())
