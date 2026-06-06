from .base import BasePDFTemplate
from reportlab.lib import colors
from reportlab.platypus import Paragraph, HRFlowable
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.styles import ParagraphStyle

class CorporateTemplate(BasePDFTemplate):
    template_id = "corporate"
    name = "Corporate Hospital"

    def __init__(self, config=None):
        super().__init__(config)
        if not config or "primary_color" not in config:
            self.primary_color = "#1e3a8a"  # Dark blue
        if not config or "font_family" not in config:
            self.font_family = "Times-Roman"
        self._setup_styles()

        # Corporate uses right-aligned titles
        self.title_style = ParagraphStyle(
            "ReportTitle",
            parent=self.styles["Normal"],
            fontSize=16,
            fontName="Times-Bold",
            textColor=colors.HexColor(self.primary_color),
            spaceAfter=6,
            alignment=TA_RIGHT,
        )

    def build_title(self, report: dict, story: list):
        story.append(Paragraph("MEDICAL REPORT", self.title_style))
        story.append(HRFlowable(width=self.W, thickness=1.0, color=colors.HexColor("#000000"), spaceAfter=10))
