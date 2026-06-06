import io
import os
import uuid
from typing import Optional
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Image as RLImage, Table, TableStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

class BasePDFTemplate:
    template_id = "base"
    name = "Base Template"

    def __init__(self, config=None):
        self.config = config or {}
        self.primary_color = self.config.get("primary_color", "#0d9488")
        self.secondary_color = self.config.get("secondary_color", "#374151")
        self.font_family = self.config.get("font_family", "Helvetica")
        self.footer_text = self.config.get("footer_text", "Not for standalone clinical decision-making.")
        
        self.styles = getSampleStyleSheet()
        self.W = A4[0] - 40 * mm  # usable width
        self._setup_styles()

    def _setup_styles(self):
        self.title_style = ParagraphStyle(
            "ReportTitle",
            parent=self.styles["Normal"],
            fontSize=13,
            fontName=f"{self.font_family}-Bold" if self.font_family == "Helvetica" else self.font_family,
            textColor=colors.HexColor(self.primary_color),
            spaceAfter=4,
            alignment=TA_CENTER,
        )
        self.section_label = ParagraphStyle(
            "SectionLabel",
            parent=self.styles["Normal"],
            fontSize=9,
            fontName=f"{self.font_family}-Bold" if self.font_family == "Helvetica" else self.font_family,
            textColor=colors.HexColor(self.secondary_color),
            spaceBefore=8,
            spaceAfter=2,
        )
        self.body_style = ParagraphStyle(
            "BodyText",
            parent=self.styles["Normal"],
            fontSize=9.5,
            fontName=self.font_family,
            textColor=colors.HexColor("#111827"),
            leading=14,
            spaceAfter=4,
        )
        self.disclaimer_style = ParagraphStyle(
            "Disclaimer",
            parent=self.styles["Normal"],
            fontSize=7.5,
            fontName=f"{self.font_family}-Oblique" if self.font_family == "Helvetica" else self.font_family,
            textColor=colors.HexColor("#9ca3af"),
            alignment=TA_CENTER,
            spaceBefore=6,
        )

    def build_letterhead(self, letterhead_bytes: Optional[bytes], letterhead_ext: str, story: list, cleanup_files: list):
        if not letterhead_bytes:
            return
        
        try:
            lh_ext = letterhead_ext.lower()
            lh_dir = "uploads"
            os.makedirs(lh_dir, exist_ok=True)
            lh_filename = os.path.join(lh_dir, f"_lh_{uuid.uuid4()}.{lh_ext}")
            with open(lh_filename, "wb") as f:
                f.write(letterhead_bytes)
            
            cleanup_files.append(lh_filename)
            
            img = RLImage(lh_filename, width=self.W, height=None)
            img_w, img_h = img.imageWidth, img.imageHeight
            aspect = img_h / img_w
            img.drawWidth = self.W
            img.drawHeight = min(self.W * aspect, 60 * mm)
            story.append(img)
            story.append(Spacer(1, 4 * mm))
        except Exception as lh_err:
            print(f"[PDF] Letterhead render error: {lh_err}")

    def build_title(self, report: dict, story: list):
        story.append(Paragraph("MEDICAL CONSULTATION REPORT", self.title_style))
        story.append(HRFlowable(width=self.W, thickness=1.5, color=colors.HexColor(self.primary_color), spaceAfter=6))

    def build_patient_info(self, report: dict, story: list):
        gen_at = report.get("generated_at", datetime.utcnow().isoformat())
        try:
            dt = datetime.fromisoformat(gen_at)
            date_str = dt.strftime("%d %B %Y, %I:%M %p")
        except Exception:
            date_str = gen_at

        info_data = [
            ["Patient Name:", report.get("patient_name") or "Not specified",
             "Date:", report.get("date") or date_str],
            ["Age / Gender:",
             f"{report.get('patient_age', '')}  {report.get('patient_gender', '')}".strip() or "—",
             "Doctor:", report.get("doctor_name") or "—"],
        ]
        info_table = Table(info_data, colWidths=[30 * mm, 65 * mm, 20 * mm, 55 * mm])
        info_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), self.font_family),
            ("FONTNAME", (0, 0), (0, -1), f"{self.font_family}-Bold" if self.font_family == "Helvetica" else self.font_family),
            ("FONTNAME", (2, 0), (2, -1), f"{self.font_family}-Bold" if self.font_family == "Helvetica" else self.font_family),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor(self.secondary_color)),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(info_table)
        story.append(HRFlowable(width=self.W, thickness=0.5, color=colors.HexColor("#e5e7eb"), spaceAfter=4))

    def add_section(self, label: str, text: str, story: list):
        if text and text.strip():
            story.append(Paragraph(label.upper(), self.section_label))
            story.append(Paragraph(text.strip(), self.body_style))

    def build_clinical_body(self, report: dict, story: list):
        self.add_section("Indication", report.get("indication", ""), story)
        self.add_section("History", report.get("history", ""), story)
        self.add_section("Findings & Vitals", report.get("findings", ""), story)
        self.add_section("Impression / Diagnosis", report.get("impression", ""), story)
        self.add_section("Treatment Plan", report.get("plan", ""), story)

        meds = report.get("medications", [])
        if meds:
            story.append(Paragraph("MEDICATIONS PRESCRIBED", self.section_label))
            for i, med in enumerate(meds, 1):
                med_text = med if isinstance(med, str) else str(med)
                story.append(Paragraph(f"{i}. {med_text}", self.body_style))

        self.add_section("Follow-up Instructions", report.get("follow_up", ""), story)
        self.add_section("Additional Notes", report.get("notes", ""), story)

    def build_signature(self, report: dict, story: list):
        story.append(Spacer(1, 8 * mm))
        story.append(HRFlowable(width=self.W, thickness=0.5, color=colors.HexColor("#d1d5db"), spaceAfter=3))
        sig_data = [
            ["", "Doctor's Signature & Stamp"],
        ]
        sig_table = Table(sig_data, colWidths=[self.W * 0.6, self.W * 0.4])
        sig_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), self.font_family),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#6b7280")),
            ("ALIGN", (1, 0), (1, 0), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(sig_table)

    def build_footer(self, report: dict, story: list):
        story.append(Spacer(1, 3 * mm))
        story.append(Paragraph(
            f"⚠ This report was AI-assisted and generated from a voice dictation. {self.footer_text}",
            self.disclaimer_style,
        ))

    def render(self, report: dict, letterhead_bytes: Optional[bytes] = None, letterhead_ext: str = "png") -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=15 * mm,
            bottomMargin=20 * mm,
        )

        story = []
        cleanup_files = []

        try:
            self.build_letterhead(letterhead_bytes, letterhead_ext, story, cleanup_files)
            self.build_title(report, story)
            self.build_patient_info(report, story)
            self.build_clinical_body(report, story)
            self.build_signature(report, story)
            self.build_footer(report, story)

            doc.build(story)
            pdf_bytes = buffer.getvalue()
            return pdf_bytes
        finally:
            buffer.close()
            for f in cleanup_files:
                if os.path.exists(f):
                    try:
                        os.remove(f)
                    except Exception:
                        pass
