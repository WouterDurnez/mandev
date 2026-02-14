"""Tests for mandev_core.models."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from mandev_core.models import (
    Experience,
    GitHub,
    Layout,
    Link,
    MandevConfig,
    Profile,
    Project,
    Skill,
    Theme,
)


# --- Profile ---


class TestProfile:
    """Tests for the :class:`Profile` model."""

    def test_minimal(self) -> None:
        """Only *name* is required."""
        p = Profile(name="Ada")
        assert p.name == "Ada"
        assert p.tagline is None
        assert p.about is None
        assert p.avatar is None

    def test_full(self) -> None:
        """All fields populated."""
        p = Profile(
            name="Ada Lovelace",
            tagline="Analytical engine whisperer",
            about="Pioneering algorithms since 1843.",
            avatar="data:image/png;base64,iVBORw0KGgo=",
        )
        assert p.name == "Ada Lovelace"
        assert p.tagline == "Analytical engine whisperer"
        assert p.about == "Pioneering algorithms since 1843."
        assert p.avatar == "data:image/png;base64,iVBORw0KGgo="

    def test_name_required(self) -> None:
        """Omitting *name* raises a validation error."""
        with pytest.raises(ValidationError):
            Profile()  # type: ignore[call-arg]


# --- Skill ---


class TestSkill:
    """Tests for the :class:`Skill` model."""

    @pytest.mark.parametrize(
        "level", ["beginner", "intermediate", "advanced", "expert"]
    )
    def test_valid_levels(self, level: str) -> None:
        """All four proficiency levels are accepted."""
        s = Skill(name="Python", level=level)  # type: ignore[arg-type]
        assert s.level == level

    def test_invalid_level(self) -> None:
        """An unrecognised level is rejected."""
        with pytest.raises(ValidationError):
            Skill(name="Python", level="master")  # type: ignore[arg-type]


# --- Project ---


class TestProject:
    """Tests for the :class:`Project` model."""

    def test_minimal(self) -> None:
        """Only *name* is required."""
        p = Project(name="man.dev")
        assert p.name == "man.dev"
        assert p.repo is None
        assert p.url is None
        assert p.description is None


# --- Experience ---


class TestExperience:
    """Tests for the :class:`Experience` model."""

    def test_current_job(self) -> None:
        """A current position has no *end* date."""
        e = Experience(role="Engineer", company="Acme", start="2024-01")
        assert e.role == "Engineer"
        assert e.company == "Acme"
        assert e.start == "2024-01"
        assert e.end is None
        assert e.description is None

    def test_past_job(self) -> None:
        """A past position has both *start* and *end*."""
        e = Experience(
            role="Intern",
            company="Widgets Inc.",
            start="2022-06",
            end="2022-09",
            description="Built dashboards.",
        )
        assert e.end == "2022-09"
        assert e.description == "Built dashboards."


# --- Link ---


class TestLink:
    """Tests for the :class:`Link` model."""

    def test_without_icon(self) -> None:
        """A link without an explicit icon."""
        lnk = Link(label="Website", url="https://example.com")
        assert lnk.label == "Website"
        assert lnk.url == "https://example.com"
        assert lnk.icon is None

    def test_with_icon(self) -> None:
        """A link with an explicit icon."""
        lnk = Link(label="GitHub", url="https://github.com/ada", icon="github")
        assert lnk.icon == "github"


# --- Theme ---


class TestTheme:
    """Tests for the :class:`Theme` model."""

    def test_defaults(self) -> None:
        """Default theme values."""
        t = Theme()
        assert t.scheme == "dracula"
        assert t.font == "JetBrains Mono"
        assert t.mode == "dark"
        assert t.accent is None

    def test_invalid_mode(self) -> None:
        """Only *dark* and *light* are valid modes."""
        with pytest.raises(ValidationError):
            Theme(mode="solarized")  # type: ignore[arg-type]


# --- Layout ---


class TestLayout:
    """Tests for the :class:`Layout` model."""

    def test_defaults(self) -> None:
        """Default section order."""
        lay = Layout()
        assert lay.sections == ["bio", "skills", "projects", "experience", "links"]

    def test_custom_sections(self) -> None:
        """Custom section list overrides defaults."""
        lay = Layout(sections=["bio", "links"])
        assert lay.sections == ["bio", "links"]


# --- GitHub ---


class TestGitHub:
    """Tests for the :class:`GitHub` model."""

    def test_defaults(self) -> None:
        """Only *username* is required; booleans default to True."""
        gh = GitHub(username="testuser")
        assert gh.username == "testuser"
        assert gh.show_heatmap is True
        assert gh.show_stats is True
        assert gh.show_languages is True
        assert gh.show_pinned is True

    def test_overrides(self) -> None:
        """All boolean flags can be turned off."""
        gh = GitHub(
            username="testuser",
            show_heatmap=False,
            show_stats=False,
            show_languages=False,
            show_pinned=False,
        )
        assert gh.show_heatmap is False
        assert gh.show_stats is False
        assert gh.show_languages is False
        assert gh.show_pinned is False

    def test_username_required(self) -> None:
        """Omitting *username* raises a validation error."""
        with pytest.raises(ValidationError):
            GitHub()  # type: ignore[call-arg]


# --- MandevConfig ---


class TestMandevConfig:
    """Tests for the :class:`MandevConfig` root model."""

    def test_minimal(self) -> None:
        """Only a profile is required."""
        cfg = MandevConfig(profile=Profile(name="Ada"))
        assert cfg.profile.name == "Ada"
        assert cfg.theme.scheme == "dracula"
        assert cfg.layout.sections == [
            "bio",
            "skills",
            "projects",
            "experience",
            "links",
        ]
        assert cfg.skills == []
        assert cfg.projects == []
        assert cfg.experience == []
        assert cfg.links == []

    def test_full(self) -> None:
        """All fields populated."""
        cfg = MandevConfig(
            profile=Profile(
                name="Ada Lovelace",
                tagline="Analytical engine whisperer",
                about="Pioneering algorithms since 1843.",
            ),
            theme=Theme(scheme="monokai", mode="light"),
            layout=Layout(sections=["bio", "skills"]),
            skills=[Skill(name="Python", level="expert")],
            projects=[Project(name="man.dev", description="Dev identity.")],
            experience=[
                Experience(role="Engineer", company="Acme", start="2024-01")
            ],
            links=[
                Link(
                    label="GitHub",
                    url="https://github.com/ada",
                    icon="github",
                )
            ],
        )
        assert cfg.theme.scheme == "monokai"
        assert cfg.theme.mode == "light"
        assert len(cfg.skills) == 1
        assert cfg.skills[0].name == "Python"
        assert len(cfg.projects) == 1
        assert len(cfg.experience) == 1
        assert len(cfg.links) == 1

    def test_config_with_github_section(self) -> None:
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

    def test_config_without_github_section(self) -> None:
        """Config without [github] still works."""
        data = {"profile": {"name": "Test"}}
        config = MandevConfig.model_validate(data)
        assert config.github is None
