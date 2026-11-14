from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas.activity import ActivityRead, ActivityUpdate
from app.services import activity_service
from app.utils.dependencies import current_user


router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("/me", response_model=ActivityRead | None)
def get_my_activity(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    return activity_service.get_user_activity(db, user.id)


@router.put("/me", response_model=ActivityRead)
def save_my_activity(
    payload: ActivityUpdate,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    return activity_service.save_user_activity(
        db,
        user.id,
        payload.profile_data,
        payload.last_path,
    )
