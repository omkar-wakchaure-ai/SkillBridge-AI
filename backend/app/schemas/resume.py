from pydantic import BaseModel, Field


class RoadmapStep(BaseModel):
    title: str = Field(..., min_length=1, max_length=160)
    description: str = Field(..., min_length=1, max_length=1200)
    estimated_time: str = Field(..., min_length=1, max_length=80)


class ResumeGapAnalysis(BaseModel):
    target_job_title: str = Field(..., min_length=1, max_length=120)
    current_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    learning_roadmap: list[RoadmapStep] = Field(default_factory=list)
