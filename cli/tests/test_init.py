"""Tests for the ``mandev init`` command."""

from __future__ import annotations

from pathlib import Path

from typer.testing import CliRunner

from mandev_cli.main import app

runner = CliRunner()


def test_init_creates_file(tmp_path: Path, monkeypatch: object) -> None:
    """``mandev init`` creates a ``.mandev.toml`` file."""
    monkeypatch.chdir(tmp_path)
    result = runner.invoke(app, ["init", "--name", "Alice", "--tagline", "Hacker"])
    assert result.exit_code == 0
    assert (tmp_path / ".mandev.toml").exists()


def test_init_content(tmp_path: Path, monkeypatch: object) -> None:
    """The generated file contains the provided name and tagline."""
    monkeypatch.chdir(tmp_path)
    runner.invoke(app, ["init", "--name", "Bob", "--tagline", "Builder"])
    content = (tmp_path / ".mandev.toml").read_text()
    assert 'name = "Bob"' in content
    assert 'tagline = "Builder"' in content


def test_init_no_overwrite(tmp_path: Path, monkeypatch: object) -> None:
    """``mandev init`` refuses to overwrite an existing file."""
    monkeypatch.chdir(tmp_path)
    (tmp_path / ".mandev.toml").write_text("existing")
    result = runner.invoke(app, ["init", "--name", "Eve", "--tagline", "x"])
    assert result.exit_code == 1
    assert (tmp_path / ".mandev.toml").read_text() == "existing"
