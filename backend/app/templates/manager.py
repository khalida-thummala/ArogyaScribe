from .base import BasePDFTemplate
from .apollo import ApolloTemplate
from .corporate import CorporateTemplate
from .minimal import MinimalTemplate
from .pediatric import PediatricTemplate
from .cardiology import CardiologyTemplate

class TemplateManager:
    _templates = {
        "apollo": ApolloTemplate,
        "corporate": CorporateTemplate,
        "minimal": MinimalTemplate,
        "pediatric": PediatricTemplate,
        "cardiology": CardiologyTemplate,
        "default": MinimalTemplate
    }

    @classmethod
    def get_template(cls, template_id: str, config: dict = None) -> BasePDFTemplate:
        template_class = cls._templates.get(template_id, cls._templates["default"])
        return template_class(config=config)

    @classmethod
    def get_available_templates(cls):
        return [
            {"id": "apollo", "name": "Apollo Style"},
            {"id": "corporate", "name": "Corporate Hospital"},
            {"id": "minimal", "name": "Minimal Clinic"},
            {"id": "pediatric", "name": "Pediatric Center"},
            {"id": "cardiology", "name": "Cardiology Center"}
        ]
