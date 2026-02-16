"""SQLAlchemy ORM models for the mandev API."""

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from mandev_api.database import Base


class User(Base):
    """A registered user."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(63), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    github_username: Mapped[str | None] = mapped_column(String(255), nullable=True, default=None)
    github_token: Mapped[str | None] = mapped_column(String(255), nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    profile: Mapped["UserProfile"] = relationship(back_populates="user")


class UserProfile(Base):
    """Stores a user's mandev config as JSON text."""

    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        unique=True,
    )
    config_json: Mapped[str] = mapped_column(Text, default="{}")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    user: Mapped["User"] = relationship(back_populates="profile")


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


class ProfileView(Base):
    """Daily aggregated profile view counts."""

    __tablename__ = "profile_views"
    __table_args__ = (
        Index("ix_profile_views_username_date", "username", "date", unique=True),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(63), index=True)
    date: Mapped[str] = mapped_column(String(10))  # YYYY-MM-DD
    count: Mapped[int] = mapped_column(default=0)
