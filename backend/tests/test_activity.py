from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.activity import router as activity_router
from app.database.base import Base
from app.database.connection import get_db
from app.models import User
from app.utils.dependencies import current_user


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autoflush=False, bind=engine)
api_test_app = FastAPI()
api_test_app.include_router(activity_router, prefix="/api")


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def override_current_user():
    db = TestingSessionLocal()
    try:
        return db.query(User).filter_by(email="learner@example.com").first()
    finally:
        db.close()


api_test_app.dependency_overrides[get_db] = override_get_db
api_test_app.dependency_overrides[current_user] = override_current_user
client = TestClient(api_test_app)


def setup_function():
    Base.metadata.create_all(bind=engine)
    with TestingSessionLocal() as db:
        db.add(
            User(
                email="learner@example.com",
                password_hash="test",
                full_name="Learner",
            )
        )
        db.commit()


def teardown_function():
    Base.metadata.drop_all(bind=engine)


def test_activity_is_saved_and_restored_for_user():
    assert client.get("/api/activity/me").json() is None

    saved = client.put(
        "/api/activity/me",
        json={
            "profile_data": {
                "selectedStream": "AI & ML",
                "progress": {"currentPhase": 2},
            },
            "last_path": "/learning",
        },
    )
    assert saved.status_code == 200
    assert saved.json()["last_path"] == "/learning"

    restored = client.get("/api/activity/me")
    assert restored.status_code == 200
    assert restored.json()["profile_data"]["progress"]["currentPhase"] == 2


def test_activity_rejects_unsupported_resume_paths():
    response = client.put(
        "/api/activity/me",
        json={"profile_data": {}, "last_path": "https://example.com"},
    )
    assert response.status_code == 422
