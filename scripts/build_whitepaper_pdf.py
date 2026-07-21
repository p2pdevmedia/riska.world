#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, "/tmp/codex_pdf_build")

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "riska-whitepaper-v2.md"
OUTPUT = ROOT / "public" / "whitepapers" / "riska-whitepaper-v2.pdf"

ACCENT = colors.HexColor("#38BDF8")
INK = colors.HexColor("#0F172A")
MUTED = colors.HexColor("#475569")
BORDER = colors.HexColor("#CBD5E1")
FILL = colors.HexColor("#F8FAFC")
HEADER_FILL = colors.HexColor("#E0F2FE")


def clean_inline(text: str) -> str:
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"`([^`]+)`", r"<font name='Courier'>\1</font>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    return text


def paragraph(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(clean_inline(text), style)


def make_styles():
    base = getSampleStyleSheet()
    base.add(
        ParagraphStyle(
            name="CoverTitle",
            fontName="Helvetica-Bold",
            fontSize=28,
            leading=34,
            textColor=INK,
            alignment=TA_LEFT,
            spaceAfter=12,
        )
    )
    base.add(
        ParagraphStyle(
            name="CoverSubtitle",
            fontName="Helvetica",
            fontSize=12,
            leading=18,
            textColor=MUTED,
            alignment=TA_LEFT,
            spaceAfter=8,
        )
    )
    base.add(
        ParagraphStyle(
            name="SectionTitle",
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=21,
            textColor=INK,
            spaceBefore=14,
            spaceAfter=8,
            keepWithNext=True,
        )
    )
    base.add(
        ParagraphStyle(
            name="SubsectionTitle",
            fontName="Helvetica-Bold",
            fontSize=12.5,
            leading=16,
            textColor=colors.HexColor("#075985"),
            spaceBefore=10,
            spaceAfter=5,
            keepWithNext=True,
        )
    )
    base.add(
        ParagraphStyle(
            name="BodyTextRiska",
            fontName="Helvetica",
            fontSize=10.2,
            leading=14.2,
            textColor=INK,
            alignment=TA_JUSTIFY,
            spaceAfter=7,
        )
    )
    base.add(
        ParagraphStyle(
            name="BulletText",
            fontName="Helvetica",
            fontSize=10.0,
            leading=13.8,
            textColor=INK,
            alignment=TA_LEFT,
            leftIndent=18,
            firstLineIndent=0,
            bulletIndent=4,
            spaceAfter=4,
        )
    )
    base.add(
        ParagraphStyle(
            name="Callout",
            fontName="Helvetica",
            fontSize=10.2,
            leading=14.4,
            textColor=INK,
            backColor=colors.HexColor("#F0F9FF"),
            borderColor=ACCENT,
            borderWidth=0.75,
            borderPadding=8,
            leftIndent=0,
            rightIndent=0,
            spaceBefore=8,
            spaceAfter=10,
        )
    )
    base.add(
        ParagraphStyle(
            name="TableHeader",
            fontName="Helvetica-Bold",
            fontSize=8.6,
            leading=11,
            textColor=INK,
            alignment=TA_LEFT,
        )
    )
    base.add(
        ParagraphStyle(
            name="TableCell",
            fontName="Helvetica",
            fontSize=8.6,
            leading=11.5,
            textColor=INK,
            alignment=TA_LEFT,
        )
    )
    base.add(
        ParagraphStyle(
            name="Footer",
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#64748B"),
            alignment=TA_CENTER,
        )
    )
    return base


def draw_footer(canvas, doc):
    canvas.saveState()
    width, _ = LETTER
    canvas.setStrokeColor(colors.HexColor("#E2E8F0"))
    canvas.setLineWidth(0.5)
    canvas.line(inch, 0.62 * inch, width - inch, 0.62 * inch)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawString(inch, 0.42 * inch, "Riska 30 White Paper v2.0")
    canvas.drawRightString(width - inch, 0.42 * inch, f"Page {doc.page}")
    canvas.restoreState()


def parse_table(lines, start, styles):
    raw_rows = []
    idx = start
    while idx < len(lines) and lines[idx].strip().startswith("|"):
        raw_rows.append(lines[idx].strip())
        idx += 1

    rows = []
    for row in raw_rows:
        cells = [cell.strip() for cell in row.strip("|").split("|")]
        if all(re.fullmatch(r":?-{3,}:?", cell or "") for cell in cells):
            continue
        rows.append(cells)

    if not rows:
        return None, idx

    max_cols = max(len(row) for row in rows)
    normalized = [row + [""] * (max_cols - len(row)) for row in rows]
    data = []
    for r, row in enumerate(normalized):
        style = styles["TableHeader"] if r == 0 else styles["TableCell"]
        data.append([Paragraph(clean_inline(cell), style) for cell in row])

    table = Table(data, colWidths=[2.0 * inch, 2.15 * inch, 2.35 * inch][:max_cols], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), HEADER_FILL),
                ("TEXTCOLOR", (0, 0), (-1, 0), INK),
                ("GRID", (0, 0), (-1, -1), 0.45, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
            ]
        )
    )
    return [Spacer(1, 4), table, Spacer(1, 8)], idx


def flush_paragraph(buffer, story, styles):
    if not buffer:
        return
    text = " ".join(part.strip() for part in buffer).strip()
    if text:
        if text.startswith("Riska 30 reframes") or text.startswith("Core product rule:"):
            story.append(paragraph(text, styles["Callout"]))
        else:
            story.append(paragraph(text, styles["BodyTextRiska"]))
    buffer.clear()


def build_story(markdown: str):
    styles = make_styles()
    lines = markdown.splitlines()
    story = []
    buffer = []
    bullet_items = []
    number_items = []
    in_cover = True

    def flush_lists():
        nonlocal bullet_items, number_items
        if bullet_items:
            for item in bullet_items:
                story.append(Paragraph(clean_inline(item), styles["BulletText"], bulletText="•"))
            story.append(Spacer(1, 4))
            bullet_items = []
        if number_items:
            for item_index, item in enumerate(number_items, 1):
                story.append(Paragraph(clean_inline(item), styles["BulletText"], bulletText=f"{item_index}."))
            story.append(Spacer(1, 4))
            number_items = []

    idx = 0
    while idx < len(lines):
        line = lines[idx]
        stripped = line.strip()

        if not stripped:
            flush_paragraph(buffer, story, styles)
            flush_lists()
            idx += 1
            continue

        if stripped.startswith("|"):
            flush_paragraph(buffer, story, styles)
            flush_lists()
            table_parts, next_idx = parse_table(lines, idx, styles)
            if table_parts:
                story.extend(table_parts)
            idx = next_idx
            continue

        if stripped.startswith("# "):
            flush_paragraph(buffer, story, styles)
            flush_lists()
            title = stripped[2:].strip()
            story.append(Spacer(1, 1.0 * inch))
            story.append(HRFlowable(width="22%", thickness=3, color=ACCENT, hAlign="LEFT", spaceAfter=18))
            story.append(Paragraph(clean_inline(title), styles["CoverTitle"]))
            in_cover = True
            idx += 1
            continue

        if stripped.startswith("## "):
            flush_paragraph(buffer, story, styles)
            flush_lists()
            if in_cover:
                story.append(Spacer(1, 0.18 * inch))
                story.append(PageBreak())
                in_cover = False
            story.append(Paragraph(clean_inline(stripped[3:].strip()), styles["SectionTitle"]))
            idx += 1
            continue

        if stripped.startswith("### "):
            flush_paragraph(buffer, story, styles)
            flush_lists()
            story.append(Paragraph(clean_inline(stripped[4:].strip()), styles["SubsectionTitle"]))
            idx += 1
            continue

        if stripped.startswith("- "):
            flush_paragraph(buffer, story, styles)
            number_items = []
            bullet_items.append(stripped[2:].strip())
            idx += 1
            continue

        match = re.match(r"^(\d+)\.\s+(.*)", stripped)
        if match:
            flush_paragraph(buffer, story, styles)
            bullet_items = []
            number_items.append(match.group(2).strip())
            idx += 1
            continue

        if stripped.startswith("**") and stripped.endswith("**"):
            flush_paragraph(buffer, story, styles)
            story.append(Paragraph(clean_inline(stripped), styles["CoverSubtitle"]))
            idx += 1
            continue

        buffer.append(stripped)
        idx += 1

    flush_paragraph(buffer, story, styles)
    flush_lists()
    return story


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    markdown = SOURCE.read_text(encoding="utf-8")
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=LETTER,
        leftMargin=0.85 * inch,
        rightMargin=0.85 * inch,
        topMargin=0.78 * inch,
        bottomMargin=0.82 * inch,
        title="Riska 30: Life Protection with Programmed Income",
        author="Riska Foundation",
        subject="White paper for Riska 30",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    template = PageTemplate(id="main", frames=[frame], onPage=draw_footer)
    doc.addPageTemplates([template])
    story = build_story(markdown)
    doc.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    main()
