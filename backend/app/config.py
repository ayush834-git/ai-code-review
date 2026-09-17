"""
Configuration management and validation for AI Code Review Agent backend.
Safely validates environment variables without exposing secret values.
"""

from __future__ import annotations

import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure environment variables are loaded from backend/.env
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

REQUIRED_VARS = [
    "GROQ_API_KEY",
    "GROQ_MODEL",
    "GROQ_BASE_URL",
    "GITHUB_TOKEN",
    "GITHUB_OWNER",
    "GITHUB_REPO",
    "DEFAULT_BRANCH",
]


def get_config_status() -> dict[str, bool]:
    """
    Returns a dictionary mapping configuration variable names
    to a boolean indicating whether the variable is present and non-empty.
    NEVER returns the actual values.
    """
    load_dotenv(dotenv_path=ENV_PATH, override=True)
    return {
        var: bool(os.getenv(var, "").strip())
        for var in REQUIRED_VARS
    }


def print_config_status() -> None:
    """Safely prints configuration status (True/False only)."""
    status = get_config_status()
    print("AI Code Review Agent - Configuration Status:")
    for key, present in status.items():
        print(f"  {key}: {'Configured' if present else 'Missing'} ({present})")


if __name__ == "__main__":
    print_config_status()
