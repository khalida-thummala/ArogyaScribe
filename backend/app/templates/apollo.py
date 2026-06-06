from .base import BasePDFTemplate
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import Paragraph, HRFlowable
from reportlab.lib.enums import TA_CENTER

class ApolloTemplate(BasePDFTemplate):
    template_id = "apollo"
    name = "Apollo Style"

    def __init__(self, config=None):
        super().__init__(config)
        # Override defaults specifically for Apollo if not provided in config
        if not config or "primary_color" not in config:
            self.primary_color = "#005a9c"  # A deep corporate blue
        if not config or "secondary_color" not in config:
            self.secondary_color = "#333333"
        self._setup_styles()

    def build_title(self, report: dict, story: list):
        story.append(Paragraph("APOLLO CLINICAL ASSESSMENT", self.title_style))
        story.append(HRFlowable(width=self.W, thickness=2.5, color=colors.HexColor(self.primary_color), spaceAfter=8))
