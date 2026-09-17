import json
import base64
import pytest
import httpx

from app.github.client import (
    GitHubClient,
    GitHubAuthError,
    GitHubResourceNotFoundError,
    LineNumberOutOfRangeError
)
from app.models import ApplyPRRequest


# -----------------------------------------------------------------------------
# Unit Tests for Step 4: Line-Index Splicing (never raw string replacement)
# -----------------------------------------------------------------------------
def test_modify_file_by_line_single_line():
    original_code = (
        "const express = require('express');\n"
        "const id = req.params.id;\n"
        'db.query("SELECT * FROM users WHERE id=" + id);\n'
        "res.json({ success: true });\n"
    )
    fixed_line = 'db.query("SELECT * FROM users WHERE id = ?", [id]);'

    # Modify line 3
    result = GitHubClient.modify_file_by_line(original_code, line_number=3, new_line_content=fixed_line)

    lines = result.splitlines()
    assert lines[2] == fixed_line
    assert lines[0] == "const express = require('express');"
    assert lines[1] == "const id = req.params.id;"
    assert lines[3] == "res.json({ success: true });"
    assert result.endswith("\n")


def test_modify_file_by_line_hero_exact_match():
    """Verify exact line 42 modification on real api/users.js code structure."""
    file_content = (
        "router.get('/:id', (req, res) => {\n"
        "  const id = req.params.id;\n"
        '  db.query("SELECT * FROM users WHERE id=" + id);\n'
        '  res.json({ message: "User query executed", id: id });\n'
        "});\n"
    )
    fixed = 'db.query("SELECT * FROM users WHERE id = ?", [id]);'

    # Line 3 in this snippet is the vulnerable line
    patched = GitHubClient.modify_file_by_line(file_content, line_number=3, new_line_content=fixed)
    lines = patched.splitlines()

    # Indentation preserved
    assert lines[2] == '  db.query("SELECT * FROM users WHERE id = ?", [id]);'
    assert 'db.query("SELECT * FROM users WHERE id=" + id);' not in patched


def test_modify_file_by_line_duplicate_lines_safety():
    """Ensure line-indexing targets only the specific line when identical lines exist."""
    content = (
        "const x = 1;\n"
        "foo();\n"
        "const x = 1;\n"
    )
    # Replace line 3 only, not line 1
    result = GitHubClient.modify_file_by_line(content, line_number=3, new_line_content="const x = 99;")
    lines = result.splitlines()
    assert lines[0] == "const x = 1;"
    assert lines[1] == "foo();"
    assert lines[2] == "const x = 99;"


def test_modify_file_by_line_out_of_range():
    content = "line1\nline2\n"
    with pytest.raises(LineNumberOutOfRangeError):
        GitHubClient.modify_file_by_line(content, line_number=10, new_line_content="line10")

    with pytest.raises(LineNumberOutOfRangeError):
        GitHubClient.modify_file_by_line(content, line_number=0, new_line_content="line0")


# -----------------------------------------------------------------------------
# Unit Tests for Step 7: PR Markdown Body Formatting
# -----------------------------------------------------------------------------
def test_format_pr_body():
    body = GitHubClient.format_pr_body(
        severity="CRITICAL",
        cwe="CWE-89: SQL Injection",
        path="api/users.js",
        line_number=42,
        original_code='db.query("SELECT * FROM users WHERE id=" + id);',
        fixed_code='db.query("SELECT * FROM users WHERE id = ?", [id]);',
        explanation="SQL injection via direct string concatenation.",
        impact="Allows unauthenticated database exfiltration."
    )

    assert "CRITICAL" in body
    assert "CWE-89" in body
    assert "api/users.js:42" in body
    assert "- Line 42: db.query(\"SELECT * FROM users WHERE id=\" + id);" in body
    assert "+ Line 42: db.query(\"SELECT * FROM users WHERE id = ?\", [id]);" in body
    assert "Detected by AI Code Review Agent" in body


# -----------------------------------------------------------------------------
# End-to-End Workflow with Mock Transport
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_apply_fix_and_create_pr_mock_flow():
    owner = "demo-org"
    repo = "demo-repo"
    target_path = "api/users.js"
    base_sha = "1111111111111111111111111111111111111111"
    file_blob_sha = "2222222222222222222222222222222222222222"
    commit_sha = "3333333333333333333333333333333333333333"

    sample_file_text = (
        "const express = require('express');\n"
        "const router = express.Router();\n"
        "router.get('/:id', (req, res) => {\n"
        "  const id = req.params.id;\n"
        '  db.query("SELECT * FROM users WHERE id=" + id);\n'
        "  res.json({ id });\n"
        "});\n"
    )
    b64_content = base64.b64encode(sample_file_text.encode("utf-8")).decode("utf-8")

    def mock_handler(request: httpx.Request) -> httpx.Response:
        url_path = request.url.path

        # Step 1: Base branch SHA
        if url_path == f"/repos/{owner}/{repo}/git/ref/heads/main":
            return httpx.Response(200, json={"object": {"sha": base_sha}})

        # Step 2: Create branch
        if url_path == f"/repos/{owner}/{repo}/git/refs":
            req_json = json.loads(request.content)
            assert req_json["sha"] == base_sha
            return httpx.Response(201, json={"ref": req_json["ref"]})

        # Step 3: Get target file
        if url_path == f"/repos/{owner}/{repo}/contents/{target_path}":
            if request.method == "GET":
                return httpx.Response(200, json={
                    "sha": file_blob_sha,
                    "content": b64_content,
                    "encoding": "base64"
                })
            # Step 6: Commit modified file
            if request.method == "PUT":
                req_json = json.loads(request.content)
                assert req_json["sha"] == file_blob_sha
                # verify modified line was base64 encoded
                decoded = base64.b64decode(req_json["content"]).decode("utf-8")
                assert 'db.query("SELECT * FROM users WHERE id = ?", [id]);' in decoded
                return httpx.Response(200, json={"commit": {"sha": commit_sha}})

        # Step 7: Create PR
        if url_path == f"/repos/{owner}/{repo}/pulls" and request.method == "POST":
            req_json = json.loads(request.content)
            assert "fix:" in req_json["title"]
            assert "Detected by AI Code Review Agent" in req_json["body"]
            return httpx.Response(201, json={
                "number": 7,
                "html_url": f"https://github.com/{owner}/{repo}/pull/7"
            })

        return httpx.Response(404, json={"message": "Not Found"})

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(mock_handler))
    client = GitHubClient(token="mock-valid-pat-12345", http_client=mock_client)

    req = ApplyPRRequest(
        owner=owner,
        repo=repo,
        file_path=target_path,
        line_number=5,
        fixed_code='db.query("SELECT * FROM users WHERE id = ?", [id]);',
        rule_id="sqli",
        finding_id="f001",
        severity="CRITICAL",
        cwe="CWE-89: SQL Injection"
    )

    response = await client.apply_fix_and_create_pr(req)

    assert response.pr_number == 7
    assert response.commit_sha == commit_sha
    assert response.pr_url == f"https://github.com/{owner}/{repo}/pull/7"
    assert response.branch.startswith("patch/sqli-f001-")
    assert response.files_changed == 1
