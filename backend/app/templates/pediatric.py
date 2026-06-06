from .base import BasePDFTemplate
from reportlab.lib import colors

class PediatricTemplate(BasePDFTemplate):
    template_id = "pediatric"
    name = "Pediatric Center"

    def __init__(self, config=None):
        super().__init__(config)
        if not config or "primary_color" not in config:
            self.primary_color = "#0ea5e9"  # Sky Blue
        self._setup_styles()

    def build_clinical_body(self, report: dict, story: list):
        # Rename standard sections for Pediatric
        self.add_section("Parental Concerns (Indication)", report.get("indication", ""), story)
        self.add_section("Birth & Developmental History", report.get("history", ""), story)
        self.add_section("Pediatric Physical Exam", report.get("findings", ""), story)
        self.add_section("Clinical Impression", report.get("impression", ""), story)
        self.add_section("Pediatric Care Plan", report.get("plan", ""), story)

        meds = report.get("medications", [])
        if meds:
            self.add_section("Prescriptions (Weight-based)", ", ".join([str(m) for m in meds]), story)

        self.add_section("Follow-up Instructions", report.get("follow_up", ""), story)
        self.add_section("Safety Notes", report.get("notes", ""), story)
