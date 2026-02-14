"""Tests for the diff command."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

from typer.testing import CliRunner

from mandev_cli.main import app

runner = CliRunner()


def _mock_response(status_code: int = 200, json_data: dict | None = None) -> MagicMock:
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = json_data or {}
    return resp


@patch("mandev_cli.main.httpx.get")
def test_diff_shows_changes(mock_get: MagicMock, tmp_path: Path, monkeypatch: object) -> None:
    """`mandev diff` prints a unified diff when local and remote differ."""
    monkeypatch.chdir(tmp_path)

    auth_file = tmp_path / "auth.json"
    auth_file.write_text(json.dumps({"access_token": "tok123"}))
    monkeypatch.setattr("mandev_cli.main.AUTH_FILE", auth_file)

    (tmp_path / ".mandev.toml").write_text('[profile]\nname = "Alice"\ntagline = "Builder"\n')

    mock_get.return_value = _mock_response(
        200,
        {
            "profile": {
                "name": "Alice",
                "tagline": "Engineer",
            }
        },
    )

    result = runner.invoke(app, ["diff"])

    assert result.exit_code == 0
    assert "Differences found" in result.output
    assert "-    \"tagline\": \"Engineer\"" in result.output
    assert "+    \"tagline\": \"Builder\"" in result.output


@patch("mandev_cli.main.httpx.get")
def test_diff_shows_no_changes(mock_get: MagicMock, tmp_path: Path, monkeypatch: object) -> None:
    """`mandev diff` reports no differences when content matches."""
    monkeypatch.chdir(tmp_path)

    auth_file = tmp_path / "auth.json"
    auth_file.write_text(json.dumps({"access_token": "tok123"}))
    monkeypatch.setattr("mandev_cli.main.AUTH_FILE", auth_file)

    payload = {"profile": {"name": "Alice", "tagline": "Builder"}}
    (tmp_path / ".mandev.toml").write_text('[profile]\nname = "Alice"\ntagline = "Builder"\n')
    mock_get.return_value = _mock_response(200, payload)

    result = runner.invoke(app, ["diff"])

    assert result.exit_code == 0
    assert "No differences" in result.output


@patch("mandev_cli.main.httpx.get")
def test_diff_fails_when_remote_unavailable(mock_get: MagicMock, tmp_path: Path, monkeypatch: object) -> None:
    """`mandev diff` exits with code 1 when remote fetch fails."""
    monkeypatch.chdir(tmp_path)

    auth_file = tmp_path / "auth.json"
    auth_file.write_text(json.dumps({"access_token": "tok123"}))
    monkeypatch.setattr("mandev_cli.main.AUTH_FILE", auth_file)

    (tmp_path / ".mandev.toml").write_text('[profile]\nname = "Alice"\n')
    mock_get.return_value = _mock_response(500, {})

    result = runner.invoke(app, ["diff"])

    assert result.exit_code == 1
    assert "Failed to fetch remote profile" in result.output
