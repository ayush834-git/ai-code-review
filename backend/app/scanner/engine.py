import os
import re
import time
import uuid
from pathlib import Path

from app.models import Finding
from app.scanner.rules import RULES


# Directories we never scan
SKIP_DIRECTORIES = {
    ".git",
    "node_modules",
    "dist",
    "build",
    ".next",
}

# Files we never scan
SKIP_FILES = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
}

# Maximum file size: 500 KB
MAX_FILE_SIZE = 500 * 1024

# Files we currently support
SUPPORTED_EXTENSIONS = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
}


def should_scan_file(file_path: Path) -> bool:
    """Return True if the file should be scanned."""

    if file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        return False

    if file_path.name in SKIP_FILES:
        return False

    try:
        if file_path.stat().st_size > MAX_FILE_SIZE:
            return False
    except OSError:
        return False

    return True


def get_context(lines: list[str], line_number: int, radius: int = 4) -> str:
    """
    Get surrounding code context.

    line_number is 1-indexed.
    """

    start = max(0, line_number - 1 - radius)
    end = min(len(lines), line_number + radius)

    context_lines = []

    for index in range(start, end):
        context_lines.append(f"{index + 1}: {lines[index]}")

    return "\n".join(context_lines)


def scan_file(file_path: Path, repo_path: Path, finding_counter: int) -> tuple[list[Finding], int]:
    """Scan one source file against all vulnerability rules."""

    findings = []

    try:
        content = file_path.read_text(
            encoding="utf-8",
            errors="ignore",
        )
    except (OSError, UnicodeError):
        return findings, finding_counter

    lines = content.splitlines()

    relative_path = file_path.relative_to(repo_path).as_posix()

    for line_number, line in enumerate(lines, start=1):
        stripped_line = line.strip()
        if stripped_line.startswith(("//", "*", "/*", "<!--")):
            continue

        for rule in RULES:

            # Skip rules that don't support this extension
            if file_path.suffix.lower() not in rule["file_extensions"]:
                continue

            match = rule["pattern"].search(line)

            if not match:
                continue

            finding_counter += 1

            finding = Finding(
                id=f"f_{finding_counter:03d}",
                rule_id=rule["id"],
                title=rule["title"],
                severity=rule["severity"],
                category=rule["category"],
                cwe=rule["cwe"],
                file_path=relative_path,
                line_start=line_number,
                line_end=line_number,
                snippet=line,
                context=get_context(lines, line_number),
                matched_text=match.group(0),
            )

            findings.append(finding)

    return findings, finding_counter


def scan_repository(repo_path: str) -> tuple[list[Finding], int, int]:
    """
    Scan an entire repository.

    Returns:
        findings
        number of files scanned
        duration in milliseconds
    """

    start_time = time.perf_counter()

    repo = Path(repo_path)

    if not repo.exists():
        raise FileNotFoundError(f"Repository not found: {repo_path}")

    findings = []
    files_scanned = 0
    finding_counter = 0

    for root, directories, files in os.walk(repo):

        # Modify directories in-place so os.walk doesn't enter them
        directories[:] = [
            directory
            for directory in directories
            if directory not in SKIP_DIRECTORIES
        ]

        for filename in files:

            file_path = Path(root) / filename

            if not should_scan_file(file_path):
                continue

            files_scanned += 1

            file_findings, finding_counter = scan_file(
                file_path,
                repo,
                finding_counter,
            )

            findings.extend(file_findings)

    duration_ms = int(
        (time.perf_counter() - start_time) * 1000
    )

    return findings, files_scanned, duration_ms