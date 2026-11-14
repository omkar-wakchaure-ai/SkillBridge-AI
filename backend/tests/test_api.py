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
