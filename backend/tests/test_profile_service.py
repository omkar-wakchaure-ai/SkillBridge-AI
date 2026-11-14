from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.models import LearnerProfile, User
from app.services.profile_service import upsert_profile


def test_upsert_profile_recovers_from_concurrent_insert(monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    db = Session(engine)
    user = User(
        email="profile-race@example.test",
        full_name="Test User",
        password_hash="unused",
    )
    db.add(user)
    db.flush()
    profile = LearnerProfile(user_id=user.id, target_role="Old role")
    db.add(profile)
    db.commit()
    profile_id = profile.id

    original_query = Session.query
    missed_existing_profile = False

    class StaleQuery:
        def filter_by(self, **filters):
            assert filters == {"user_id": user.id}
            return self

        def first(self):
            return None

    def query_with_stale_read(session, entity, *entities, **kwargs):
        nonlocal missed_existing_profile
        if entity is LearnerProfile and not missed_existing_profile:
            missed_existing_profile = True
            return StaleQuery()
        return original_query(session, entity, *entities, **kwargs)

    monkeypatch.setattr(Session, "query", query_with_stale_read)

    updated = upsert_profile(db, user.id, {"target_role": "Data Scientist"})

    assert updated.id == profile_id
    assert updated.target_role == "Data Scientist"
    db.close()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
