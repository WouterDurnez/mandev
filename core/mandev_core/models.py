"""Pydantic models for the mandev config spec.

These models define the schema for ``.mandev.toml`` / ``.mandev.yaml``
config files. They are shared by the CLI, API, and web frontend.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class Profile(BaseModel):
    """Developer identity: name, tagline, bio, avatar."""

    name: str
    tagline: str | None = None
    about: str | None = None
    avatar: str | None = None


class Skill(BaseModel):
    """A skill with a proficiency level."""

    name: str
    level: Literal["beginner", "intermediate", "advanced", "expert"]
    domain: str | None = None


class Project(BaseModel):
    """A project to showcase."""

    name: str
    repo: str | None = None
    url: str | None = None
    description: str | None = None


class Experience(BaseModel):
    """A work experience entry."""

    role: str
    company: str
    start: str
    end: str | None = None
    description: str | None = None


class Link(BaseModel):
    """An external link (GitHub, Twitter, website, etc.)."""

    label: str
    url: str
    icon: str | None = None


class Theme(BaseModel):
    """Visual theme configuration for the web profile."""

    scheme: str = "dracula"
    font: str = "JetBrains Mono"
    mode: Literal["dark", "light"] = "dark"
    accent: str | None = None


class Layout(BaseModel):
    """Controls which sections appear and in what order."""

    sections: list[str] = [
        "bio",
        "skills",
        "projects",
        "experience",
        "links",
    ]


class GitHub(BaseModel):
    """GitHub integration config.

    Controls which GitHub stats sections appear on the public profile.
    Only ``username`` is required; all display flags default to enabled.
    """

    username: str
    show_heatmap: bool = True
    show_stats: bool = True
    show_languages: bool = True
    show_pinned: bool = True


class Npm(BaseModel):
    """npm integration config.

    :param username: npm registry username.
    :param show_packages: Whether to display the package list.
    :param show_downloads: Whether to display download counts.
    :param max_packages: Maximum number of packages to show.
    """

    username: str
    show_packages: bool = True
    show_downloads: bool = True
    max_packages: int = 10


class PyPI(BaseModel):
    """PyPI integration config.

    Uses an explicit package list because PyPI has no per-user API.

    :param packages: List of package names to display.
    :param show_downloads: Whether to display download counts.
    :param max_packages: Maximum number of packages to show.
    """

    packages: list[str]
    show_downloads: bool = True
    max_packages: int = 10


class DevTo(BaseModel):
    """Dev.to integration config.

    :param username: Dev.to username.
    :param show_articles: Whether to display articles.
    :param show_stats: Whether to display aggregate stats.
    :param max_articles: Maximum number of articles to show.
    """

    username: str
    show_articles: bool = True
    show_stats: bool = True
    max_articles: int = 5


class Hashnode(BaseModel):
    """Hashnode integration config.

    :param username: Hashnode username (blog host).
    :param show_articles: Whether to display articles.
    :param max_articles: Maximum number of articles to show.
    """

    username: str
    show_articles: bool = True
    max_articles: int = 5


class MandevConfig(BaseModel):
    """Root config model -- the single source of truth.

    Represents the full contents of a ``.mandev.toml`` or
    ``.mandev.yaml`` file.
    """

    profile: Profile
    theme: Theme = Theme()
    layout: Layout = Layout()
    skills: list[Skill] = []
    projects: list[Project] = []
    experience: list[Experience] = []
    links: list[Link] = []
    github: GitHub | None = None
    npm: Npm | None = None
    pypi: PyPI | None = None
    devto: DevTo | None = None
    hashnode: Hashnode | None = None
