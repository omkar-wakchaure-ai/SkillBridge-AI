from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class UserActivity(Base):
    __tablename__ = "user_activities"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    profile_data: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )

    last_path: Mapped[str] = mapped_column(
        String(500),
        default="/dashboard",
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
