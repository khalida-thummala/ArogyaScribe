from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from typing import Optional, Any, Dict

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        action: str,
        user_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        status: str = "success"
    ):
        try:

            log = AuditLog(

                user_id=user_id,

                organization_id=organization_id,

                action=action,

                resource_type=resource_type,

                resource_id=resource_id,

                details=details,

                ip_address=ip_address,

                status=status
            )

            db.add(log)

            db.commit()

            return log

        except Exception as e:

            print(
                "AUDIT LOG ERROR:",
                str(e)
            )

            db.rollback()

            return None
        

audit_service = AuditService()
