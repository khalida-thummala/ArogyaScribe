from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.deps import get_db
from app.core.deps import get_current_user
from app.models.patient import Patient
from app.models.consultation import Consultation
from app.models.user import User

router = APIRouter()

@router.get("")
def list_audit_events(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    org_id = current_user.organization_id

    # Gather patients created
    patients = db.query(Patient).filter(Patient.organization_id == org_id).order_by(Patient.created_at.desc()).limit(limit).all()
    # Gather consultations created
    consults = db.query(Consultation).filter(Consultation.organization_id == org_id).order_by(Consultation.created_at.desc()).limit(limit).all()

    events = []
    
    for p in patients:
        events.append({
            "id": f"pat_{p.patient_id}",
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "user_id": p.user_id or "System",
            "action": "CREATE_PATIENT",
            "resource": f"Patient:{p.patient_id[:8]}",
            "ip_address": "127.0.0.1",
            "status": "success"
        })

    for c in consults:
        events.append({
            "id": f"cons_{c.consultation_id}",
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "user_id": c.user_id or "System",
            "action": "CREATE_CONSULTATION",
            "resource": f"Consultation:{c.consultation_id[:8]}",
            "ip_address": "127.0.0.1",
            "status": "success" if c.status == "completed" else "info"
        })

    # Sort by created_at descending
    events.sort(key=lambda x: x["created_at"] or "", reverse=True)

    return {"data": events[:limit]}
