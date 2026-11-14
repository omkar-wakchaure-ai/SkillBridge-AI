import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.ai.resume_gap_analyzer import (
    ResumeAnalysisError,
    _parse_json_object,
    build_prompt,
)
from app.ai.resume_parser import ResumeParseError, extract_text_from_docx
from app.api.resume import router as resume_router
from app.services import resume_service
from app.utils.dependencies import current_user

test_app = FastAPI()
test_app.include_router(resume_router, prefix="/api")
test_app.dependency_overrides[current_user] = lambda: object()
client = TestClient(test_app)


def _build_unauthenticated_client() -> TestClient:
    app = FastAPI()
    app.include_router(resume_router, prefix="/api")
    return TestClient(app)


unauth_client = _build_unauthenticated_client()


def _pdf_file(name: str = "resume.pdf", content: bytes = b"%PDF-1.4 test"):
    return {"resume": (name, content, "application/pdf")}


def _docx_file(name: str = "resume.docx", content: bytes = b"docx test"):
    return {
        "resume": (
            name,
            content,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    }


def _post(client=client, job_title="AI/ML Engineer", **kwargs):
    return client.post(
        "/api/resume/analyze",
        data={"target_job_title": job_title},
        files=_pdf_file(**kwargs),
    )


def _mock_happy_path(monkeypatch, payload=None):
    monkeypatch.setattr(
        resume_service,
        "extract_text_from_resume",
        lambda _bytes, _filename: "Python, FastAPI, React and SQL experience.",
    )
    monkeypatch.setattr(
        resume_service,
        "analyze_resume_against_role",
        lambda role, text: payload
        or {
            "current_skills": ["Python", "FastAPI", "React"],
            "missing_skills": ["Kubernetes", "MLOps"],
            "learning_roadmap": [
                {
                    "title": "Learn Docker",
                    "description": "Containerize a FastAPI service.",
                    "estimated_time": "2 weeks",
                }
            ],
        },
    )


def test_analyze_success(monkeypatch):
    _mock_happy_path(monkeypatch)

    response = _post(job_title="  AI/ML   Engineer  ")

    assert response.status_code == 200
    body = response.json()
    assert body["target_job_title"] == "AI/ML Engineer"
    assert body["current_skills"] == ["Python", "FastAPI", "React"]
    assert body["missing_skills"] == ["Kubernetes", "MLOps"]
    assert body["learning_roadmap"][0]["title"] == "Learn Docker"


def test_analyze_requires_auth():
    response = unauth_client.post(
        "/api/resume/analyze",
        data={"target_job_title": "Data Scientist"},
        files=_pdf_file(),
    )
    assert response.status_code in (401, 403)


def test_resume_draft_requires_auth():
    response = unauth_client.post(
        "/api/resume/draft",
        data={"target_job_title": "AI/ML Engineer"},
        files=_pdf_file(),
    )
    assert response.status_code in (401, 403)


def test_analyze_rejects_unsupported_document():
    response = client.post(
        "/api/resume/analyze",
        data={"target_job_title": "Data Scientist"},
        files={"resume": ("resume.txt", b"hello", "text/plain")},
    )
    assert response.status_code == 400
    assert "PDF and Word (.docx)" in response.json()["detail"]


def test_analyze_accepts_docx(monkeypatch):
    _mock_happy_path(monkeypatch)

    response = client.post(
        "/api/resume/analyze",
        data={"target_job_title": "AI/ML Engineer"},
        files=_docx_file(),
    )

    assert response.status_code == 200
    assert response.json()["current_skills"] == ["Python", "FastAPI", "React"]


def test_docx_parser_extracts_paragraphs_and_tables():
    from docx import Document
    from io import BytesIO

    document = Document()
    document.add_paragraph("Python developer")
    table = document.add_table(rows=1, cols=2)
    table.cell(0, 0).text = "FastAPI"
    table.cell(0, 1).text = "React"
    buffer = BytesIO()
    document.save(buffer)

    text = extract_text_from_docx(buffer.getvalue())

    assert "Python developer" in text
    assert "FastAPI" in text
    assert "React" in text


def test_docx_parser_rejects_invalid_document():
    with pytest.raises(ResumeParseError, match="invalid or could not be read"):
        extract_text_from_docx(b"not a Word document")


def test_analyze_rejects_empty_file():
    response = _post(content=b"")
    assert response.status_code == 400


def test_analyze_rejects_oversized_file():
    oversized = b"0" * (5 * 1024 * 1024 + 1)
    response = _post(content=oversized)
    assert response.status_code == 413


def test_analyze_rejects_short_job_title():
    response = _post(job_title="a")
    assert response.status_code == 422


def test_analyze_handles_unreadable_pdf(monkeypatch):
    def boom(_bytes, _filename):
        raise ResumeParseError("No readable text found in this PDF.")

    monkeypatch.setattr(resume_service, "extract_text_from_resume", boom)

    response = _post()
    assert response.status_code == 422
    assert "No readable text" in response.json()["detail"]


def test_analyze_handles_gemini_failure(monkeypatch):
    monkeypatch.setattr(
        resume_service,
        "extract_text_from_resume",
        lambda _bytes, _filename: "Python developer",
    )

    def boom(_role, _text):
        raise ResumeAnalysisError("Could not reach the Gemini API.")

    monkeypatch.setattr(resume_service, "analyze_resume_against_role", boom)

    response = _post()
    assert response.status_code == 502
    assert "Gemini" in response.json()["detail"]


def test_analyze_handles_invalid_ai_payload(monkeypatch):
    _mock_happy_path(
        monkeypatch,
        payload={
            "current_skills": ["Python"],
            "missing_skills": ["MLOps"],
            "learning_roadmap": [{"description": "missing title and time"}],
        },
    )

    response = _post()
    assert response.status_code == 502


def test_generate_resume_draft_uses_only_user_confirmed_skills(monkeypatch):
    seen = {}
    monkeypatch.setattr(
        resume_service,
        "extract_text_from_resume",
        lambda _bytes, _filename: "Python engineer with a completed FastAPI project.",
    )

    def build_draft(role, resume_text, confirmed_skills):
        seen["role"] = role
        seen["resume_text"] = resume_text
        seen["confirmed_skills"] = confirmed_skills
        return "Candidate Name\nAI/ML Engineer\n\nTECHNICAL SKILLS\nPython, MLOps"

    monkeypatch.setattr(resume_service, "build_tailored_resume_draft", build_draft)
    response = client.post(
        "/api/resume/draft",
        data={
            "target_job_title": "AI/ML Engineer",
            "confirmed_skills": ["MLOps", "MLOps"],
        },
        files=_pdf_file(),
    )

    assert response.status_code == 200
    assert seen["role"] == "AI/ML Engineer"
    assert seen["confirmed_skills"] == ["MLOps"]
    assert "Python engineer" in seen["resume_text"]
    assert "TECHNICAL SKILLS" in response.json()["draft_text"]


def test_generate_resume_draft_rejects_too_many_confirmed_skills(monkeypatch):
    monkeypatch.setattr(
        resume_service,
        "extract_text_from_resume",
        lambda _bytes, _filename: "Python engineer",
    )
    response = client.post(
        "/api/resume/draft",
        data={
            "target_job_title": "AI/ML Engineer",
            "confirmed_skills": [f"Skill {index}" for index in range(26)],
        },
        files=_pdf_file(),
    )
    assert response.status_code == 422
    assert "no more than 25" in response.json()["detail"]


def test_download_resume_pdf_requires_accuracy_confirmation():
    response = client.post(
        "/api/resume/pdf",
        data={
            "target_job_title": "AI/ML Engineer",
            "draft_text": "Candidate Name\nAI/ML Engineer\n\nPROFESSIONAL SUMMARY\nPython developer",
            "facts_confirmed": "false",
        },
    )
    assert response.status_code == 422


def test_download_resume_pdf_returns_valid_pdf():
    from io import BytesIO
    from pypdf import PdfReader

    response = client.post(
        "/api/resume/pdf",
        data={
            "target_job_title": "AI/ML Engineer",
            "draft_text": (
                "Candidate Name\nAI/ML Engineer\n\n"
                "PROFESSIONAL SUMMARY\nPython engineer.\n- Built a model.\n\n"
                "TECHNICAL SKILLS\nPython, SQL"
            ),
            "facts_confirmed": "true",
        },
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF-")
    assert len(PdfReader(BytesIO(response.content)).pages) == 1


def test_prompt_contains_role_and_resume():
    prompt = build_prompt("ML Engineer", "Python, PyTorch")
    assert "ML Engineer" in prompt
    assert "Python, PyTorch" in prompt
    assert "career advisor" in prompt.lower()
    assert "untrusted candidate data" in prompt
    assert "current_skills" in prompt
    assert "learning_roadmap" in prompt


def test_parse_json_strips_markdown_fences():
    parsed = _parse_json_object(
        '```json\n{"current_skills": ["Python"], "missing_skills": []}\n```'
    )
    assert parsed["current_skills"] == ["Python"]


def test_parse_json_recovers_from_surrounding_text():
    parsed = _parse_json_object(
        'Here is the report: {"current_skills": ["SQL"]} — done.'
    )
    assert parsed["current_skills"] == ["SQL"]


def test_parse_json_rejects_non_json():
    with pytest.raises(ResumeAnalysisError):
        _parse_json_object("not json at all")
