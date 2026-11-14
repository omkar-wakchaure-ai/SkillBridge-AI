from datetime import datetime
from typing import Any

from pydantic import BaseModel, field_validator


RESUMABLE_PATHS = {
    "/onboarding",
    "/dashboard",
    "/profile",
    "/career",
    "/learning",
    "/roleplay",
    "/certifications",
    "/analytics",
    "/courses",
    "/resume-analysis",
}


class ActivityUpdate(BaseModel):
    profile_data: dict[str, Any]
    last_path: str = "/dashboard"

    @field_validator("last_path")
    @classmethod
    def validate_last_path(cls, value: str) -> str:
        if value not in RESUMABLE_PATHS:
            raise ValueError("last_path must be a supported PathPilot page")
        return value


class ActivityRead(BaseModel):
    profile_data: dict[str, Any]
    last_path: str
    updated_at: datetime

    model_config = {"from_attributes": True}
