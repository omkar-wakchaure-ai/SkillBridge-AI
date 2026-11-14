from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.models.user import User
from app.schemas.resume import ResumeGapAnalysis
from app.services.resume_service import analyze_resume
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


@router.post("/analyze", response_model=ResumeGapAnalysis)
def analyze_resume_endpoint(
    resume: UploadFile = File(..., description="Resume PDF or DOCX file (max 5 MB)"),
    target_job_title: str = Form(..., min_length=2, max_length=120),
    user: User = Depends(current_user),
):
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

    return analyze_resume(file_bytes, target_job_title, filename)
