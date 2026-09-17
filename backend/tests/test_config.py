import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import REQUIRED_VARS, get_config_status


def test_get_config_status_structure():
    status = get_config_status()
    for var in REQUIRED_VARS:
        assert var in status
        assert isinstance(status[var], bool)


def test_configured_variables_truth_values():
    status = get_config_status()
    assert status["GROQ_API_KEY"] is True
    assert status["GROQ_MODEL"] is True
    assert status["GROQ_BASE_URL"] is True
    assert status["GITHUB_OWNER"] is True
    assert status["GITHUB_REPO"] is True
    assert status["DEFAULT_BRANCH"] is True
    # GITHUB_TOKEN is either True or False depending on whether user added it
    assert isinstance(status["GITHUB_TOKEN"], bool)


@pytest.mark.asyncio
async def test_health_check_includes_config_status():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "config_status" in data
        assert isinstance(data["config_status"], dict)
        for var in REQUIRED_VARS:
            assert var in data["config_status"]
            assert isinstance(data["config_status"][var], bool)
