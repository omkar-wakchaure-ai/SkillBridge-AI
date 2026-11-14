import re

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response

from app.models.user import User
from app.schemas.resume import ResumeDraftResponse, ResumeGapAnalysis
from app.services.resume_pdf_service import create_resume_pdf
from app.services.resume_service import analyze_resume, generate_resume_draft
from app.utils.dependencies import current_user

router = APIRouter(prefix="/resume", tags=["resume"])

MAX_RESUME_BYTES = 5 * 1024 * 1024
CONTENT_TYPES_BY_EXTENSION = {
    ".pdf": {"application/pdf", "application/x-pdf", "application/octet-stream"},
    ".docx": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/zip",
        "application/octet-stream",
    },
}


def _read_resume_upload(resume: UploadFile) -> tuple[str, bytes]:
    filename = (resume.filename or "").strip()
    extension = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    allowed_content_types = CONTENT_TYPES_BY_EXTENSION.get(extension)
    if allowed_content_types is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and Word (.docx) resumes are supported.",
        )

    if resume.content_type and resume.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file type does not match its filename.",
        )

    file_bytes = resume.file.read(MAX_RESUME_BYTES + 1)
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )
    if len(file_bytes) > MAX_RESUME_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Resume is too large. Maximum size is 5 MB.",
        )

    return filename, file_bytes


@router.post("/analyze", response_model=ResumeGapAnalysis)
def analyze_resume_endpoint(
    resume: UploadFile = File(..., description="Resume PDF or DOCX file (max 5 MB)"),
    target_job_title: str = Form(..., min_length=2, max_length=120),
    _user: User = Depends(current_user),
):
    filename, file_bytes = _read_resume_upload(resume)
    return analyze_resume(file_bytes, target_job_title, filename)


@router.post("/draft", response_model=ResumeDraftResponse)
def create_resume_draft_endpoint(
    resume: UploadFile = File(..., description="Resume PDF or DOCX file (max 5 MB)"),
    target_job_title: str = Form(..., min_length=2, max_length=120),
    confirmed_skills: list[str] | None = Form(default=None),
    _user: User = Depends(current_user),
):
    filename, file_bytes = _read_resume_upload(resume)
    return generate_resume_draft(
        file_bytes,
        target_job_title,
        confirmed_skills or [],
        filename,
    )


@router.post("/pdf")
def download_resume_pdf(
    target_job_title: str = Form(..., min_length=2, max_length=120),
    draft_text: str = Form(..., min_length=1, max_length=20000),
    facts_confirmed: bool = Form(...),
    _user: User = Depends(current_user),
):
    if not facts_confirmed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Review the draft and confirm that all details are accurate before downloading.",
        )

    filename_role = re.sub(
        r"[^A-Za-z0-9]+",
        "_",
        target_job_title.strip(),
    ).strip("_")[:60] or "Resume"
    filename = f"PathPilot_{filename_role}_Resume.pdf"

    try:
        pdf_bytes = create_resume_pdf(draft_text)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
