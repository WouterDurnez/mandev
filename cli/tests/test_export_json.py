"""Tests for the export-json CLI command."""

from __future__ import annotations

import json
from pathlib import Path

from typer.testing import CliRunner

from mandev_cli.main import app

runner = CliRunner()

_VALID_CONFIG = """\
[profile]
name = "Alice"
tagline = "Hacker"
"""


def test_export_json_prints_to_stdout(tmp_path: Path, monkeypatch: object) -> None:
    """``mandev export-json`` prints valid JSON to stdout."""
    monkeypatch.chdir(tmp_path)
    (tmp_path / ".mandev.toml").write_text(_VALID_CONFIG)

    result = runner.invoke(app, ["export-json"])

    assert result.exit_code == 0
    payload = json.loads(result.output)
    assert payload["profile"]["name"] == "Alice"


def test_export_json_writes_to_file(tmp_path: Path, monkeypatch: object) -> None:
    """``mandev export-json --output`` writes JSON to the specified file."""
    monkeypatch.chdir(tmp_path)
    (tmp_path / ".mandev.toml").write_text(_VALID_CONFIG)
    output = tmp_path / "out" / "profile.json"

    result = runner.invoke(app, ["export-json", "--output", str(output)])

    assert result.exit_code == 0
    assert output.exists()
    payload = json.loads(output.read_text())
    assert payload["profile"]["tagline"] == "Hacker"
