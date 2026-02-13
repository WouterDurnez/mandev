"""Tests for the preview and validate commands."""

from __future__ import annotations

from pathlib import Path

from typer.testing import CliRunner

from mandev_cli.main import app

runner = CliRunner()

# ---------------------------------------------------------------------------
# A complete fixture config
# ---------------------------------------------------------------------------

_VALID_CONFIG = """\
[profile]
name = "Alice"
tagline = "Hacker"

[[skills]]
name = "Python"
level = "expert"

[[skills]]
name = "Rust"
level = "intermediate"
"""

_INVALID_CONFIG = """\
[profile]
tagline = "oops, no name"
"""


# ---------------------------------------------------------------------------
# preview
# ---------------------------------------------------------------------------

def test_preview_renders_name_and_skills(tmp_path: Path, monkeypatch: object) -> None:
    """``mandev preview`` outputs the name and skills from the config."""
    monkeypatch.chdir(tmp_path)
    (tmp_path / ".mandev.toml").write_text(_VALID_CONFIG)

    result = runner.invoke(app, ["preview"])
    assert result.exit_code == 0
    assert "Alice" in result.output
    assert "Python" in result.output
    assert "expert" in result.output
    assert "Rust" in result.output
    assert "intermediate" in result.output


def test_preview_fails_with_no_config(tmp_path: Path, monkeypatch: object) -> None:
    """``mandev preview`` exits with code 1 when no config file exists."""
    monkeypatch.chdir(tmp_path)
    result = runner.invoke(app, ["preview"])
    assert result.exit_code == 1


# ---------------------------------------------------------------------------
# validate
# ---------------------------------------------------------------------------

def test_validate_succeeds_on_valid_config(tmp_path: Path, monkeypatch: object) -> None:
    """``mandev validate`` reports success for a well-formed config."""
    monkeypatch.chdir(tmp_path)
    (tmp_path / ".mandev.toml").write_text(_VALID_CONFIG)

    result = runner.invoke(app, ["validate"])
    assert result.exit_code == 0
    assert "valid" in result.output.lower()


def test_validate_fails_on_invalid_config(tmp_path: Path, monkeypatch: object) -> None:
    """``mandev validate`` exits with code 1 for an invalid config."""
    monkeypatch.chdir(tmp_path)
    (tmp_path / ".mandev.toml").write_text(_INVALID_CONFIG)

    result = runner.invoke(app, ["validate"])
    assert result.exit_code == 1
