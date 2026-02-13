"""Config file parser for mandev.

Supports auto-detection of ``.mandev.toml`` and ``.mandev.yaml`` files.
"""

from __future__ import annotations

import tomllib
from pathlib import Path

import yaml

from mandev_core.models import MandevConfig

CONFIG_FILENAMES = [".mandev.toml", ".mandev.yaml", ".mandev.yml"]


def parse_toml(path: Path) -> MandevConfig:
    """Parse a TOML config file into a :class:`MandevConfig`.

    :param path: Path to the TOML file.
    :returns: Parsed config.
    :raises FileNotFoundError: If the file does not exist.
    :raises pydantic.ValidationError: If the config is invalid.
    """
    with open(path, "rb") as f:
        data = tomllib.load(f)
    return MandevConfig.model_validate(data)


def parse_yaml(path: Path) -> MandevConfig:
    """Parse a YAML config file into a :class:`MandevConfig`.

    :param path: Path to the YAML file.
    :returns: Parsed config.
    :raises FileNotFoundError: If the file does not exist.
    :raises pydantic.ValidationError: If the config is invalid.
    """
    with open(path) as f:
        data = yaml.safe_load(f)
    return MandevConfig.model_validate(data)


def load_config(directory: Path) -> MandevConfig:
    """Auto-detect and load a config file from *directory*.

    Looks for ``.mandev.toml``, ``.mandev.yaml``, or ``.mandev.yml``
    (in that order). Returns the first match.

    :param directory: Directory to search in.
    :returns: Parsed config.
    :raises FileNotFoundError: If no config file is found.
    """
    for filename in CONFIG_FILENAMES:
        path = directory / filename
        if path.exists():
            if path.suffix == ".toml":
                return parse_toml(path)
            return parse_yaml(path)
    raise FileNotFoundError(
        f"No config file found in {directory}. "
        f"Expected one of: {', '.join(CONFIG_FILENAMES)}"
    )
