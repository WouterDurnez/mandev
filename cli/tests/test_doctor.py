"""Tests for the doctor command."""

from __future__ import annotations

from pathlib import Path

from typer.testing import CliRunner

from mandev_cli.main import app

runner = CliRunner()

_GOOD_CONFIG = """\
[profile]
name = "Alice"
tagline = "Backend engineer"
about = "Backend engineer focused on resilient APIs, data systems, and measurable product outcomes."

[[skills]]
name = "Python"
level = "expert"

[[projects]]
name = "man.dev"
description = "Built terminal-first developer profile tooling and shipped it to production."

[[links]]
label = "GitHub"
url = "https://github.com/alice"

[[experience]]
role = "Engineer"
company = "Acme"
start = "2024-01"
end = "2025-02"
"""

_BAD_CONFIG = """\
[profile]
name = "Alice"
tagline = "Backend engineer"

[[projects]]
name = "man.dev"

[[experience]]
role = "Engineer"
company = "Acme"
start = "2024"
end = "2025"
"""


def test_doctor_passes_on_good_profile(tmp_path: Path, monkeypatch: object) -> None:
    """`mandev doctor` should pass for a complete profile."""
    monkeypatch.chdir(tmp_path)
    (tmp_path / ".mandev.toml").write_text(_GOOD_CONFIG)

    result = runner.invoke(app, ["doctor"])

    assert result.exit_code == 0
    assert "passed" in result.output.lower()


def test_doctor_fails_on_profile_issues(tmp_path: Path, monkeypatch: object) -> None:
    """`mandev doctor` should report findings for incomplete profiles."""
    monkeypatch.chdir(tmp_path)
    (tmp_path / ".mandev.toml").write_text(_BAD_CONFIG)

    result = runner.invoke(app, ["doctor"])

    assert result.exit_code == 1
    assert "missing profile.about" in result.output.lower()
    assert "no skills listed" in result.output.lower()
    assert "missing descriptions" in result.output.lower()
    assert "not yyyy-mm" in result.output.lower()
