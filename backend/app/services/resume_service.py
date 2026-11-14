from fastapi import HTTPException, status
from pydantic import ValidationError

from app.ai.resume_gap_analyzer import (
    ResumeAnalysisError,
    analyze_resume_against_role,
)
from app.ai.resume_parser import ResumeParseError, extract_text_from_resume
from app.schemas.resume import ResumeGapAnalysis


def analyze_resume(
    file_bytes: bytes,
    target_job_title: str,
    filename: str = "resume.pdf",
) -> ResumeGapAnalysis:
    """Parse a resume and compare it with the target role via Gemini."""
    role = " ".join(target_job_title.split()).strip()

    if len(role) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide a valid target job title.",
        )

    try:
        resume_text = extract_text_from_resume(file_bytes, filename)
    except ResumeParseError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    try:
        raw_analysis = analyze_resume_against_role(role, resume_text)
    except ResumeAnalysisError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    try:
        return ResumeGapAnalysis(
            target_job_title=role,
            current_skills=raw_analysis.get("current_skills", []),
            missing_skills=raw_analysis.get("missing_skills", []),
            learning_roadmap=raw_analysis.get("learning_roadmap", []),
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI returned an unexpected response format. Please try again.",
        ) from exc
