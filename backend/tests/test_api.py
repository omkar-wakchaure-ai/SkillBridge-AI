from fastapi.testclient import TestClient
from main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_feedback() -> None:
    response = client.post("/api/feedback", json={"message": "Helpful roadmap"})
    assert response.status_code == 200
    assert response.json()["status"] == "received"


def test_auth_status_rejects_invalid_token() -> None:
    response = client.get(
        "/api/auth/status",
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or expired token"


def test_cors_preflight_allows_deployed_frontend() -> None:
    origin = "https://skill-bridge-ai-zx9m.vercel.app"
    response = client.options(
        "/api/chat",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
