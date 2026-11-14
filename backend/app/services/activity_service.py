from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.activity import UserActivity


def get_user_activity(db: Session, user_id: int) -> UserActivity | None:
    return db.get(UserActivity, user_id)


def save_user_activity(
    db: Session,
    user_id: int,
    profile_data: dict[str, Any],
    last_path: str,
) -> UserActivity:
    activity = db.get(UserActivity, user_id)
    if activity is None:
        activity = UserActivity(user_id=user_id)

    activity.profile_data = profile_data
    activity.last_path = last_path
    activity.updated_at = datetime.now(timezone.utc)

    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity
