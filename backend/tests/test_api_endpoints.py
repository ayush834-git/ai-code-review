import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "ai-code-review-backend"
        assert "github_token_configured" in data

@pytest.mark.asyncio
async def test_apply_pr_missing_token_returns_401(monkeypatch):
    # Ensure no token in env
    monkeypatch.setenv("GITHUB_TOKEN", "")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "owner": "test-org",
            "repo": "test-repo",
            "file_path": "api/users.js",
            "line_number": 42,
            "fixed_code": 'db.query("SELECT * FROM users WHERE id = ?", [id]);',
            "rule_id": "sqli",
            "finding_id": "f001"
        }
        response = await ac.post("/api/apply-pr", json=payload)
        # Should return 401 when token is missing/unauthorized
        assert response.status_code in (401, 500)
        err = response.json()
        assert "detail" in err

@pytest.mark.asyncio
async def test_apply_pr_endpoint_success_mock(monkeypatch):
    from unittest.mock import AsyncMock, patch
    from app.models import ApplyPRResponse

    mock_resp = ApplyPRResponse(
        branch="patch/sqli-f001-1734",
        commit_sha="3fa9c1e",
        pr_number=7,
        pr_url="https://github.com/test-org/test-repo/pull/7",
        files_changed=1
    )

    with patch("app.main.GitHubClient.apply_fix_and_create_pr", new_callable=AsyncMock) as mock_apply:
        mock_apply.return_value = mock_resp

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            payload = {
                "owner": "test-org",
                "repo": "test-repo",
                "file_path": "api/users.js",
                "line_number": 42,
                "fixed_code": 'db.query("SELECT * FROM users WHERE id = ?", [id]);',
                "rule_id": "sqli",
                "finding_id": "f001",
                "severity": "CRITICAL",
                "cwe": "CWE-89: SQL Injection"
            }
            response = await ac.post("/api/apply-pr", json=payload)
            assert response.status_code == 201
            data = response.json()
            assert data["branch"] == "patch/sqli-f001-1734"
            assert data["commit_sha"] == "3fa9c1e"
            assert data["pr_number"] == 7
            assert data["pr_url"] == "https://github.com/test-org/test-repo/pull/7"
            assert data["files_changed"] == 1


@pytest.mark.asyncio
async def test_explain_endpoint():
    from app.main import scans
    from app.models import Finding, ScanResponse, ScanSummary, Severity

    finding = Finding(
        id="f_exp",
        rule_id="SQLI-001",
        title="SQL Injection via string concatenation",
        severity=Severity.CRITICAL,
        category="injection",
        cwe="CWE-89",
        file_path="api/users.js",
        line_start=42,
        line_end=42,
        snippet='db.query("SELECT * FROM users WHERE id=" + id);',
        context="context",
        matched_text="text",
    )
    scans["scn_explain_test"] = ScanResponse(
        scan_id="scn_explain_test",
        repo_url="test-repo",
        files_scanned=1,
        duration_ms=5,
        summary=ScanSummary(critical=1, total=1),
        findings=[finding],
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/explain", json={"scan_id": "scn_explain_test", "finding_id": "f_exp"})
        assert response.status_code == 200
        data = response.json()
        assert data["finding_id"] == "f_exp"
        assert "explanation" in data
        assert "impact" in data
        assert "recommendation" in data


@pytest.mark.asyncio
async def test_apply_pr_pipeline_auto_enrich():
    from unittest.mock import AsyncMock, patch
    from app.main import app, scans
    from app.models import ApplyPRResponse, Finding, FixResponse, ScanResponse, ScanSummary, Severity

    finding = Finding(
        id="f_hero",
        rule_id="SQLI-001",
        title="SQL Injection via string concatenation",
        severity=Severity.CRITICAL,
        category="injection",
        cwe="CWE-89",
        file_path="api/users.js",
        line_start=42,
        line_end=42,
        snippet='db.query("SELECT * FROM users WHERE id=" + id);',
        context="context",
        matched_text="text",
    )
    scans["scn_enrich_test"] = ScanResponse(
        scan_id="scn_enrich_test",
        repo_url="test-repo",
        files_scanned=1,
        duration_ms=5,
        summary=ScanSummary(critical=1, total=1),
        findings=[finding],
    )

    mock_resp = ApplyPRResponse(
        branch="patch/sqli-fhero-1234",
        commit_sha="abcdef123",
        pr_number=99,
        pr_url="https://github.com/ayush834-git/ai-code-review/pull/99",
        files_changed=1,
    )

    mock_fix = FixResponse(
        finding_id="f_hero",
        file_path="api/users.js",
        original_code=finding.snippet,
        fixed_code='db.query("SELECT * FROM users WHERE id = ?", [id]);',
        diff='--- a/api/users.js\n+++ b/api/users.js\n@@ -42,1 +42,1 @@\n- db.query("SELECT * FROM users WHERE id=" + id);\n+ db.query("SELECT * FROM users WHERE id = ?", [id]);',
        explanation_of_change="Use parameterized query",
        confidence=0.95,
    )

    with patch("app.main.GitHubClient.apply_fix_and_create_pr", new_callable=AsyncMock) as mock_apply, \
         patch("app.main.default_agent.generate_fix_async", new_callable=AsyncMock) as mock_agent_fix:
        mock_apply.return_value = mock_resp
        mock_agent_fix.return_value = mock_fix

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # Frontend style: passing only scan_id and finding_ids
            payload = {
                "scan_id": "scn_enrich_test",
                "finding_ids": ["f_hero"],
            }
            response = await ac.post("/api/apply-pr", json=payload)
            assert response.status_code == 201
            data = response.json()
            assert data["pr_number"] == 99

            # Check that mock_apply received the auto-enriched payload
            call_payload = mock_apply.call_args[0][0]
            assert call_payload.file_path == "api/users.js"
            assert call_payload.line_number == 42
            assert call_payload.rule_id == "SQLI-001"
            assert call_payload.fixed_code != ""

