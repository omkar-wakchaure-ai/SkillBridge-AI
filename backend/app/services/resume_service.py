from fastapi import HTTPException, status
from pydantic import ValidationError

from app.ai.resume_gap_analyzer import (
    ResumeAnalysisError,
    analyze_resume_against_role,
)
from app.ai.resume_parser import ResumeParseError, extract_text_from_resume
from app.ai.resume_builder import build_tailored_resume_draft
from app.schemas.resume import ResumeDraftResponse, ResumeGapAnalysis


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


def generate_resume_draft(
    file_bytes: bytes,
    target_job_title: str,
    confirmed_skills: list[str],
    filename: str = "resume.pdf",
) -> ResumeDraftResponse:
    """Create a role-focused resume draft from uploaded facts and user confirmations."""
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

    normalized_skills = []
    seen_skills = set()
    for skill in confirmed_skills:
        normalized = " ".join(skill.split()).strip()
        if not normalized:
            continue
        key = normalized.casefold()
        if key not in seen_skills:
            seen_skills.add(key)
            normalized_skills.append(normalized[:80])

    if len(normalized_skills) > 25:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Select no more than 25 skills to confirm.",
        )

    try:
        draft_text = build_tailored_resume_draft(
            role,
            resume_text,
            normalized_skills,
        )
        return ResumeDraftResponse(draft_text=draft_text)
    except ResumeAnalysisError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The generated resume draft was too long or invalid. Please try again.",
        ) from exc
