import io
import re
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate


def _is_section_heading(line: str) -> bool:
    return (
        len(line) <= 64
        and any(character.isalpha() for character in line)
        and line == line.upper()
    )


def _draw_page_number(canvas: Canvas, document: SimpleDocTemplate) -> None:
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748b"))
    canvas.drawRightString(
        letter[0] - 0.65 * inch,
        0.35 * inch,
        f"Page {document.page}",
    )
    canvas.restoreState()


def create_resume_pdf(draft_text: str) -> bytes:
    """Render a reviewed plain-text resume draft as a paginated PDF."""
    if not draft_text.strip():
        raise ValueError("Resume text cannot be empty.")

    output = io.BytesIO()
    document = SimpleDocTemplate(
        output,
        pagesize=letter,
        rightMargin=0.7 * inch,
        leftMargin=0.7 * inch,
        topMargin=0.65 * inch,
        bottomMargin=0.65 * inch,
        title="Tailored Resume",
        author="PathPilot AI",
    )

    base_styles = getSampleStyleSheet()
    name_style = ParagraphStyle(
        "ResumeName",
        parent=base_styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#172554"),
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    headline_style = ParagraphStyle(
        "ResumeHeadline",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#4f46e5"),
        alignment=TA_CENTER,
        spaceAfter=6,
    )
    section_style = ParagraphStyle(
        "ResumeSection",
        parent=base_styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#3730a3"),
        spaceBefore=9,
        spaceAfter=4,
        keepWithNext=True,
    )
    body_style = ParagraphStyle(
        "ResumeBody",
        parent=base_styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#1e293b"),
        alignment=TA_LEFT,
        spaceAfter=3,
    )
    bullet_style = ParagraphStyle(
        "ResumeBullet",
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3,
    )

    story = []
    nonempty_lines = [line.strip() for line in draft_text.splitlines() if line.strip()]
    for index, line in enumerate(nonempty_lines):
        if index == 0:
            story.append(Paragraph(escape(line), name_style))
        elif index == 1:
            story.append(Paragraph(escape(line), headline_style))
            story.append(HRFlowable(
                width="100%",
                thickness=0.7,
                color=colors.HexColor("#c7d2fe"),
                spaceAfter=8,
            ))
        elif _is_section_heading(line):
            story.append(Paragraph(escape(line.title()), section_style))
        elif re.match(r"^(?:[-*•]|\d+[.)])\s+", line):
            text = re.sub(r"^(?:[-*•]|\d+[.)])\s+", "", line)
            story.append(Paragraph(f"• {escape(text)}", bullet_style))
        else:
            story.append(Paragraph(escape(line), body_style))

    document.build(
        story,
        onFirstPage=_draw_page_number,
        onLaterPages=_draw_page_number,
    )
    return output.getvalue()
