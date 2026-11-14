from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.ai import llm_service
from app.ai.llm_service import (
    LLMConfigurationError,
    LLMGenerationError,
    LLMService,
    SYSTEM_INSTRUCTION,
)
from app.api.chat import router as chat_router
from app.utils.dependencies import current_user


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(chat_router, prefix="/api")
    app.dependency_overrides[current_user] = lambda: object()
    return TestClient(app)


def test_gemini_generation_uses_system_prompt_and_stateless_request(monkeypatch):
    captured = {}

    class FakeClient:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return None

        def create_interaction(self, **kwargs):
            captured.update(kwargs)
            return SimpleNamespace(output_text="Build a project to practice Python.")

        @property
        def interactions(self):
            return SimpleNamespace(create=self.create_interaction)

    def create_client(api_key):
        captured["api_key"] = api_key
        return FakeClient()

    monkeypatch.setattr(llm_service, "create_gemini_client", create_client)
    monkeypatch.setattr(llm_service.settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(llm_service.settings, "gemini_model", "gemini-test")

    result = LLMService().generate("How should I learn Python?")

    assert result == "Build a project to practice Python."
    assert captured["api_key"] == "test-key"
    assert captured["model"] == "gemini-test"
    assert captured["system_instruction"] == SYSTEM_INSTRUCTION
    assert captured["input"] == "How should I learn Python?"
    assert captured["generation_config"] == {
        "max_output_tokens": 500,
        "thinking_level": "low",
    }
    assert captured["store"] is False


def test_gemini_generation_requires_a_configured_key(monkeypatch):
    monkeypatch.setattr(llm_service.settings, "gemini_api_key", "")

    with pytest.raises(LLMConfigurationError, match="GEMINI_API_KEY"):
        LLMService().generate("Help me plan my career")


def test_chat_endpoint_returns_generated_reply(monkeypatch):
    monkeypatch.setattr("app.api.chat.answer", lambda message: f"Advice for: {message}")

    response = _client().post(
        "/api/chat",
        json={"message": "How do I learn data engineering?"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "reply": "Advice for: How do I learn data engineering?"
    }


def test_chat_endpoint_returns_gateway_error_on_gemini_failure(monkeypatch):
    def fail(_message):
        raise LLMGenerationError("Gemini could not generate a response.")

    monkeypatch.setattr("app.api.chat.answer", fail)

    response = _client().post("/api/chat", json={"message": "Hello"})

    assert response.status_code == 502
    assert response.json()["detail"] == "Gemini could not generate a response."
