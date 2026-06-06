from .base import BasePDFTemplate
from reportlab.platypus import HRFlowable
from reportlab.lib import colors

class MinimalTemplate(BasePDFTemplate):
    template_id = "minimal"
    name = "Minimal Clinic"

    def __init__(self, config=None):
        super().__init__(config)
        # Minimalist colors, thin lines
        if not config or "primary_color" not in config:
            self.primary_color = "#111827"
        if not config or "secondary_color" not in config:
            self.secondary_color = "#4b5563"
        self._setup_styles()

    def build_title(self, report: dict, story: list):
        super().build_title(report, story)
        # Change the HR to be thinner for minimal
        story.pop() # remove the thick HR from base
        story.append(HRFlowable(width=self.W, thickness=0.5, color=colors.HexColor("#d1d5db"), spaceAfter=8))
