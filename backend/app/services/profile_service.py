from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.profile import LearnerProfile


def upsert_profile(db: Session, user_id: int, values: dict) -> LearnerProfile:
    profile = db.query(LearnerProfile).filter_by(user_id=user_id).first()
    if profile is None:
        profile = LearnerProfile(user_id=user_id)
        db.add(profile)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            profile = db.query(LearnerProfile).filter_by(user_id=user_id).first()
            if profile is None:
                raise

    for key, value in values.items():
        setattr(profile, key, value)

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


