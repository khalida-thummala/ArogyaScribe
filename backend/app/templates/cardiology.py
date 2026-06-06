from .base import BasePDFTemplate
from reportlab.lib import colors

class CardiologyTemplate(BasePDFTemplate):
    template_id = "cardiology"
    name = "Cardiology Center"

    def __init__(self, config=None):
        super().__init__(config)
        if not config or "primary_color" not in config:
            self.primary_color = "#e11d48"  # Rose/Red
        self._setup_styles()

    def build_clinical_body(self, report: dict, story: list):
        self.add_section("Indication for Consult", report.get("indication", ""), story)
        self.add_section("Cardiac Risk History", report.get("history", ""), story)
        self.add_section("Hemodynamic Vitals & Exam", report.get("findings", ""), story)
        self.add_section("Diagnosis", report.get("impression", ""), story)
        self.add_section("Therapeutic Regimen", report.get("plan", ""), story)

        meds = report.get("medications", [])
        if meds:
            self.add_section("Medications", ", ".join([str(m) for m in meds]), story)

        self.add_section("Follow-up Instructions", report.get("follow_up", ""), story)
        self.add_section("Notes", report.get("notes", ""), story)
