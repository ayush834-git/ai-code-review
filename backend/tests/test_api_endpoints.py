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
