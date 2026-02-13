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
    avatar_url: str | None = None


class Skill(BaseModel):
    """A skill with a proficiency level."""

    name: str
    level: Literal["beginner", "intermediate", "advanced", "expert"]


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
