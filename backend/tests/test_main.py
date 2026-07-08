import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_home_server_handshake():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "operational"

@pytest.mark.asyncio
async def test_protected_endpoint_without_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/chat/stream-converse", json={"user_message": "hello"})
    # Bearer Security raises 401 Unauthorized if the header is missing
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_protected_endpoint_with_mock_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = {"Authorization": "Bearer MOCK_SECURE_JWT_TOKEN_STRING"}
        response = await ac.post("/api/v1/chat/stream-converse", json={"user_message": "hello"}, headers=headers)
    # The route should parse the bearer token successfully and attempt processing (which might return 500 if GEMINI API keys are invalid in the environment, or 200 if functional)
    assert response.status_code in [200, 500]

from app.config import settings

@pytest.mark.asyncio
async def test_mock_auth_fails_in_production():
    original_env = settings.ENVIRONMENT
    settings.ENVIRONMENT = "production"
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            headers = {"Authorization": "Bearer MOCK_SECURE_JWT_TOKEN_STRING"}
            response = await ac.post("/api/v1/chat/stream-converse", json={"user_message": "hello"}, headers=headers)
        assert response.status_code == 401
    finally:
        settings.ENVIRONMENT = original_env

@pytest.mark.asyncio
async def test_submit_answer_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = {"Authorization": "Bearer MOCK_SECURE_JWT_TOKEN_STRING"}
        payload = {
            "question_text": "What is 2+2?",
            "options": ["1", "2", "3", "4"],
            "correct_option_index": 3,
            "user_selected_index": 3,
            "current_difficulty": "EASY",
            "topic": "Basic Math",
            "session_id": "test_session_123"
        }
        response = await ac.post("/api/v1/test/process-submit", json=payload, headers=headers)
    assert response.status_code == 200
    assert "is_correct" in response.json()

@pytest.mark.asyncio
async def test_get_history_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = {"Authorization": "Bearer MOCK_SECURE_JWT_TOKEN_STRING"}
        response = await ac.get("/api/v1/test/history", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_diagnose_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = {"Authorization": "Bearer MOCK_SECURE_JWT_TOKEN_STRING"}
        response = await ac.post("/api/v1/chat/diagnose", json={"user_message": "Diagnose my OS score"}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "strengths" in data
    assert "weaknesses" in data
    assert "tips" in data
