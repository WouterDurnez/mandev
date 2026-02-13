"""Tests for login, whoami, and push commands."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

from typer.testing import CliRunner

from mandev_cli.main import app

runner = CliRunner()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mock_response(status_code: int = 200, json_data: dict | None = None) -> MagicMock:
    """Build a mock httpx response.

    :param status_code: HTTP status code.
    :param json_data: JSON body to return.
    :returns: A mock with ``.status_code`` and ``.json()`` attributes.
    """
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = json_data or {}
    return resp


# ---------------------------------------------------------------------------
# login
# ---------------------------------------------------------------------------

@patch("mandev_cli.main.httpx.post")
def test_login_saves_token(mock_post: MagicMock, tmp_path: Path, monkeypatch: object) -> None:
    """``mandev login`` stores the JWT in the auth file."""
    auth_file = tmp_path / "auth.json"
    monkeypatch.setattr("mandev_cli.main.AUTH_FILE", auth_file)

    mock_post.return_value = _mock_response(
        200, {"access_token": "tok123", "token_type": "bearer"}
    )

    result = runner.invoke(
        app,
        ["login", "--email", "a@b.com", "--password", "secret"],
    )
    assert result.exit_code == 0
    assert auth_file.exists()
    data = json.loads(auth_file.read_text())
    assert data["access_token"] == "tok123"


# ---------------------------------------------------------------------------
# whoami
# ---------------------------------------------------------------------------

@patch("mandev_cli.main.httpx.get")
def test_whoami_displays_username(mock_get: MagicMock, tmp_path: Path, monkeypatch: object) -> None:
    """``mandev whoami`` reads the token and prints username/email."""
    auth_file = tmp_path / "auth.json"
    auth_file.write_text(json.dumps({"access_token": "tok123"}))
    monkeypatch.setattr("mandev_cli.main.AUTH_FILE", auth_file)

    mock_get.return_value = _mock_response(
        200, {"id": 1, "username": "alice", "email": "a@b.com"}
    )

    result = runner.invoke(app, ["whoami"])
    assert result.exit_code == 0
    assert "alice" in result.output
    assert "a@b.com" in result.output


# ---------------------------------------------------------------------------
# push
# ---------------------------------------------------------------------------

@patch("mandev_cli.main.httpx.put")
def test_push_sends_config(mock_put: MagicMock, tmp_path: Path, monkeypatch: object) -> None:
    """``mandev push`` loads the local config and PUTs it to the API."""
    monkeypatch.chdir(tmp_path)

    auth_file = tmp_path / "auth.json"
    auth_file.write_text(json.dumps({"access_token": "tok123"}))
    monkeypatch.setattr("mandev_cli.main.AUTH_FILE", auth_file)

    config_content = """\
[profile]
name = "Alice"
tagline = "Hacker"
"""
    (tmp_path / ".mandev.toml").write_text(config_content)

    mock_put.return_value = _mock_response(200, {})

    result = runner.invoke(app, ["push"])
    assert result.exit_code == 0
    mock_put.assert_called_once()
