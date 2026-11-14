import io

from docx import Document
from pypdf import PdfReader
from pypdf.errors import PdfReadError

MAX_RESUME_CHARS = 20000


class ResumeParseError(Exception):
    """Raised when a resume document cannot be read or contains no usable text."""


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract readable text from a PDF resume.

    Raises ``ResumeParseError`` for corrupt, encrypted or image-only PDFs so the
    API layer can return a helpful 4xx response instead of a generic 500.
    """
    if not file_bytes:
        raise ResumeParseError("The uploaded file is empty.")

    try:
        reader = PdfReader(io.BytesIO(file_bytes))
    except (PdfReadError, ValueError) as exc:
        raise ResumeParseError("The uploaded file is not a valid PDF.") from exc
    except Exception as exc:  # pypdf can surface low-level IO errors
        raise ResumeParseError("Could not read the uploaded PDF.") from exc

    if reader.is_encrypted:
        try:
            reader.decrypt("")
        except Exception as exc:
            raise ResumeParseError(
                "The PDF is password protected. Please upload an unlocked copy."
            ) from exc

    pages: list[str] = []
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:
            continue
        if text.strip():
            pages.append(text)

    text = "\n".join(pages).strip()

    if not text:
        raise ResumeParseError(
            "No readable text found in this PDF. Scanned resumes must be "
            "converted to text before uploading."
        )

    return text[:MAX_RESUME_CHARS]


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract readable text from Word paragraphs and tables."""
    if not file_bytes:
        raise ResumeParseError("The uploaded file is empty.")

    try:
        document = Document(io.BytesIO(file_bytes))
        blocks: list[str] = []

        for block in document.element.body.iterchildren():
            if block.tag.endswith("}p"):
                text = "".join(
                    node.text or ""
                    for node in block.iter()
                    if node.tag.endswith("}t")
                ).strip()
                if text:
                    blocks.append(text)
            elif block.tag.endswith("}tbl"):
                for row in block.iter():
                    if not row.tag.endswith("}tr"):
                        continue
                    cells = [
                        " ".join(
                            node.text or ""
                            for node in cell.iter()
                            if node.tag.endswith("}t")
                        ).strip()
                        for cell in row
                        if cell.tag.endswith("}tc")
                    ]
                    row_text = " | ".join(text for text in cells if text)
                    if row_text:
                        blocks.append(row_text)
    except Exception as exc:
        raise ResumeParseError(
            "The uploaded Word document is invalid or could not be read."
        ) from exc

    text = "\n".join(blocks).strip()
    if not text:
        raise ResumeParseError("No readable text found in this Word document.")

    return text[:MAX_RESUME_CHARS]


def extract_text_from_resume(file_bytes: bytes, filename: str) -> str:
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension == "pdf":
        return extract_text_from_pdf(file_bytes)
    if extension == "docx":
        return extract_text_from_docx(file_bytes)
    raise ResumeParseError("Only PDF and Word (.docx) resumes are supported.")
