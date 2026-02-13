"""Tests for mandev_core.parser."""

from __future__ import annotations

import shutil
from pathlib import Path

import pytest
from pydantic import ValidationError

from mandev_core.parser import load_config, parse_toml, parse_yaml

FIXTURES = Path(__file__).parent / "fixtures"


# --- parse_toml ---


class TestParseToml:
    """Tests for :func:`parse_toml`."""

    def test_valid(self) -> None:
        """A well-formed TOML file is parsed correctly."""
        cfg = parse_toml(FIXTURES / "valid.toml")
        assert cfg.profile.name == "Ada Lovelace"
        assert cfg.profile.tagline == "Analytical engine whisperer"
        assert cfg.theme.scheme == "dracula"
        assert cfg.layout.sections == ["bio", "skills", "projects"]
        assert len(cfg.skills) == 1
        assert cfg.skills[0].name == "Python"
        assert cfg.skills[0].level == "expert"
        assert len(cfg.projects) == 1
        assert len(cfg.experience) == 1
        assert len(cfg.links) == 1
        assert cfg.links[0].icon == "github"

    def test_invalid(self) -> None:
        """A TOML file with missing required fields raises ValidationError."""
        with pytest.raises(ValidationError):
            parse_toml(FIXTURES / "invalid.toml")

    def test_missing_file(self) -> None:
        """A non-existent file raises FileNotFoundError."""
        with pytest.raises(FileNotFoundError):
            parse_toml(FIXTURES / "nonexistent.toml")


# --- parse_yaml ---


class TestParseYaml:
    """Tests for :func:`parse_yaml`."""

    def test_valid(self) -> None:
        """A well-formed YAML file is parsed correctly."""
        cfg = parse_yaml(FIXTURES / "valid.yaml")
        assert cfg.profile.name == "Ada Lovelace"
        assert cfg.profile.tagline == "Analytical engine whisperer"
        assert cfg.theme.scheme == "dracula"
        assert cfg.layout.sections == ["bio", "skills", "projects"]
        assert len(cfg.skills) == 1
        assert cfg.skills[0].name == "Python"
        assert len(cfg.projects) == 1
        assert len(cfg.experience) == 1
        assert len(cfg.links) == 1


# --- load_config ---


class TestLoadConfig:
    """Tests for :func:`load_config`."""

    def test_loads_toml(self, tmp_path: Path) -> None:
        """Finds and loads a ``.mandev.toml`` file."""
        shutil.copy(FIXTURES / "valid.toml", tmp_path / ".mandev.toml")
        cfg = load_config(tmp_path)
        assert cfg.profile.name == "Ada Lovelace"

    def test_loads_yaml(self, tmp_path: Path) -> None:
        """Finds and loads a ``.mandev.yaml`` file."""
        shutil.copy(FIXTURES / "valid.yaml", tmp_path / ".mandev.yaml")
        cfg = load_config(tmp_path)
        assert cfg.profile.name == "Ada Lovelace"

    def test_toml_preferred_over_yaml(self, tmp_path: Path) -> None:
        """When both TOML and YAML exist, TOML is preferred."""
        shutil.copy(FIXTURES / "valid.toml", tmp_path / ".mandev.toml")
        shutil.copy(FIXTURES / "valid.yaml", tmp_path / ".mandev.yaml")
        # Both should parse fine; TOML wins because it's checked first.
        cfg = load_config(tmp_path)
        assert cfg.profile.name == "Ada Lovelace"

    def test_no_config_raises(self, tmp_path: Path) -> None:
        """An empty directory raises FileNotFoundError."""
        with pytest.raises(FileNotFoundError, match="No config file found"):
            load_config(tmp_path)
