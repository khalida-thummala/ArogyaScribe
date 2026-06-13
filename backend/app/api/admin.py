from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import HTTPException
from pydantic import BaseModel, Field
from app.core.security import hash_password
from app.db.deps import get_db
from app.core.deps import get_current_user
from app.models.organization import Organization
from app.models.user import User
from app.models.report import Report
from app.models.consultation import Consultation
from app.models.patient import Patient
from app.models.upgrade_request import UpgradeRequest
from app.models.patient import Patient
from typing import Literal
from app.models.subscription import OrganizationSubscription
router = APIRouter()

class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    password: str = Field(..., min_length=8)
    phone: str | None = Field(None, pattern=r"^(?:\+91|91)?\d{10}$")
    subscription_plan: str = "basic"
    max_users: int = Field(10, gt=0)

@router.get("/organizations")
def get_organizations(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "super_admin":
        return {"detail": "Access denied"}

    organizations = db.query(Organization).all()

    return organizations


@router.post("/organizations")
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    # Check organization email already exists
    existing_org = db.query(Organization).filter(
        Organization.email == payload.email
    ).first()

    if existing_org:
        raise HTTPException(
            status_code=400,
            detail="Organization already exists"
        )

    # Check user email already exists
    existing_user = db.query(User).filter(
        User.email == payload.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    # Create Organization
    organization = Organization(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        subscription_plan=payload.subscription_plan,
        max_users=payload.max_users,
        billing_status="active"
    )

    db.add(organization)
    db.commit()
    db.refresh(organization)

    # Create Organization Admin automatically
    admin_user = User(
        full_name=f"{payload.name} Admin",
        email=payload.email,
        password_hash=hash_password(payload.password),
        role="organization_admin",
        organization_id=organization.organization_id,
        status="active",
        email_verified=True
    )

    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    return {
        "message": "Organization created successfully",
        "organization_id": organization.organization_id,
        "organization_name": organization.name,
        "admin_user_id": admin_user.user_id,
        "admin_name": admin_user.full_name,
        "admin_email": admin_user.email
    }

@router.get("/doctors")
def get_doctors(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "super_admin":
        return {"detail": "Access denied"}

    doctors = db.query(User).filter(
        User.role == "practitioner"
    ).all()

    return doctors


@router.get("/organizations/{org_id}/doctors")
def get_org_doctors_super_admin(
    org_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Access denied")
    doctors = db.query(User).filter(
        User.organization_id == org_id,
        User.role == "practitioner"
    ).all()
    return doctors

@router.get("/organizations/{org_id}/patients")
def get_org_patients_super_admin(
    org_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Access denied")
    patients = db.query(Patient).filter(Patient.organization_id == org_id).all()
    return patients

class ResetPasswordPayload(BaseModel):
    password: str

@router.put("/organizations/{org_id}/reset-password")
def reset_org_admin_password(
    org_id: str,
    payload: ResetPasswordPayload,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Access denied")
    admin_user = db.query(User).filter(
        User.organization_id == org_id,
        User.role == "organization_admin"
    ).first()
    if not admin_user:
        raise HTTPException(status_code=404, detail="Organization admin not found")
    
    admin_user.password_hash = hash_password(payload.password)
    admin_user.failed_login_attempts = 0
    admin_user.locked_until = None
    db.commit()
    return {"message": "Organization admin password updated successfully"}

@router.get("/doctors/{doctor_id}/patients")
def get_doctor_patients(
    doctor_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "super_admin":
        return {"detail": "Access denied"}

    patient_ids = (
        db.query(Consultation.patient_id)
        .filter(Consultation.user_id == doctor_id)
        .distinct()
        .all()
    )

    patient_ids = [p[0] for p in patient_ids]

    patients = db.query(Patient).filter(
        Patient.patient_id.in_(patient_ids)
    ).all()

    return patients

@router.get("/patients")
def get_patients(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "super_admin":
        return {"detail": "Access denied"}

    return db.query(Patient).all()

@router.get("/patients/{patient_id}/consultations")
def get_patient_consultations(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    consultations = db.query(Consultation).filter(
        Consultation.patient_id == patient_id
    ).all()

    return consultations


class SubscriptionCreate(BaseModel):
    organization_id: str
    plan_name: Literal[
        "free_trial",
        "basic",
        "premium",
        "enterprise"
    ]
    report_limit: int
    transcription_limit: int


@router.get("/subscriptions")
def get_subscriptions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "super_admin":
        return {"detail": "Access denied"}

    subscriptions = (
        db.query(
            OrganizationSubscription,
            Organization.name
        )
        .join(
            Organization,
            Organization.organization_id ==
            OrganizationSubscription.organization_id
        )
        .all()
    )

    result = []

    for subscription, organization_name in subscriptions:
        result.append({
            "subscription_id": subscription.subscription_id,
            "organization_name": organization_name,
            "plan_name": subscription.plan_name,
            "report_limit": subscription.report_limit,
            "reports_used": subscription.reports_used,
            "transcription_limit": subscription.transcription_limit,
            "transcriptions_used": subscription.transcriptions_used,
            "status": subscription.status,
        })

    return result

@router.post("/subscriptions")
def create_subscription(
    payload: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    organization = db.query(Organization).filter(
        Organization.organization_id == payload.organization_id
    ).first()

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organization not found"
        )

    existing = db.query(
        OrganizationSubscription
    ).filter(
        OrganizationSubscription.organization_id == payload.organization_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Subscription already exists"
        )

    subscription = OrganizationSubscription(
        organization_id=payload.organization_id,
        plan_name=payload.plan_name,
        report_limit=payload.report_limit,
        transcription_limit=payload.transcription_limit
    )

    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    return subscription



class SubscriptionUpdate(BaseModel):
    plan_name: str
    report_limit: int
    transcription_limit: int
    status: str


from fastapi import HTTPException

@router.put("/subscriptions/{subscription_id}")
def update_subscription(
    subscription_id: str,
    payload: SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    subscription = db.query(
        OrganizationSubscription
    ).filter(
        OrganizationSubscription.subscription_id == subscription_id
    ).first()

    if not subscription:
        raise HTTPException(
            status_code=404,
            detail="Subscription not found"
        )

    subscription.plan_name = payload.plan_name
    subscription.report_limit = payload.report_limit
    subscription.transcription_limit = payload.transcription_limit
    subscription.status = payload.status

    db.commit()
    db.refresh(subscription)

    return subscription


@router.get("/usage")
def get_usage(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "super_admin":
        return {"detail": "Access denied"}

    subscriptions = (
        db.query(
            OrganizationSubscription,
            Organization.name
        )
        .join(
            Organization,
            Organization.organization_id ==
            OrganizationSubscription.organization_id
        )
        .all()
    )

    result = []

    for sub, org_name in subscriptions:
        result.append({
            "organization_name": org_name,
            "plan_name": sub.plan_name,
            "reports_used": sub.reports_used,
            "report_limit": sub.report_limit,
            "transcriptions_used": sub.transcriptions_used,
            "transcription_limit": sub.transcription_limit,
            "status": sub.status
        })

    return result


@router.get("/upgrade-requests")
def get_upgrade_requests(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "super_admin":
        return {"detail": "Access denied"}

    return db.query(UpgradeRequest).all()


from fastapi import HTTPException
@router.put("/upgrade-requests/{request_id}/approve")
def approve_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    request = db.query(
        UpgradeRequest
    ).filter(
        UpgradeRequest.request_id == request_id
    ).first()

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    # Mark request approved
    request.status = "approved"

    # Upgrade organization plan
    organization = db.query(
        Organization
    ).filter(
        Organization.organization_id ==
        request.organization_id
    ).first()

    if organization:
        organization.subscription_plan = (
            request.requested_plan
        )

    db.commit()

    return {
        "message": "Upgrade approved successfully",
        "organization": organization.name,
        "new_plan": organization.subscription_plan
    }




class UpgradeRequestCreate(BaseModel):
    organization_id: str
    current_plan: str
    requested_plan: str
    message: str


@router.post("/upgrade-requests")
def create_upgrade_request(
    payload: UpgradeRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    request = UpgradeRequest(
        organization_id=payload.organization_id,
        current_plan=payload.current_plan,
        requested_plan=payload.requested_plan,
        message=payload.message
    )

    db.add(request)
    db.commit()
    db.refresh(request)

    return request



@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    organizations = db.query(Organization).count()

    doctors = db.query(User).filter(
        User.role == "practitioner"
    ).count()

    patients = db.query(Patient).count()

    consultations = db.query(
            Consultation
        ).count()

    reports = db.query(
            Report
        ).count()

    subscriptions = db.query(
        OrganizationSubscription
    ).count()

    pending_requests = db.query(
        UpgradeRequest
    ).filter(
        UpgradeRequest.status == "pending"
    ).count()

    return {
    "organizations": organizations,
    "doctors": doctors,
    "patients": patients,
    "consultations": consultations,
    "reports": reports,
    "subscriptions": subscriptions,
    "pending_upgrade_requests": pending_requests
}




class OrganizationAdminCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    password: str = Field(..., min_length=8)


@router.post("/organizations/{organization_id}/create-admin")
def create_organization_admin(
    organization_id: str,
    payload: OrganizationAdminCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    organization = db.query(
        Organization
    ).filter(
        Organization.organization_id == organization_id
    ).first()

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organization not found"
        )

    existing = db.query(User).filter(
        User.email == payload.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(
    payload.password
),
        role="organization_admin",
        organization_id=organization_id,
        status="active",
        email_verified=True
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.get("/organization/dashboard")
def organization_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "organization_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    doctors = db.query(User).filter(
        User.organization_id == current_user.organization_id,
        User.role == "practitioner"
    ).count()

    patients = db.query(Patient).filter(
        Patient.organization_id == current_user.organization_id
    ).count()

    reports = db.query(Report).filter(
    Report.organization_id ==
    current_user.organization_id
).count()

    return {
        "doctors": doctors,
        "patients": patients,
        "reports": reports
    }


@router.get("/organization/doctors")
def get_organization_doctors(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "organization_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    doctors = db.query(User).filter(
        User.organization_id ==
        current_user.organization_id,
        User.role == "practitioner"
    ).all()

    return doctors


@router.put("/organization/doctors/{doctor_id}/status")
def update_doctor_status(
    doctor_id: str,
    status: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "organization_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    doctor = db.query(User).filter(
        User.user_id == doctor_id,
        User.organization_id ==
        current_user.organization_id
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    doctor.status = status

    db.commit()

    return {
        "message": "Doctor updated"
    }

@router.get("/organization/patients")
def get_organization_patients(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "organization_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    patients = db.query(Patient).filter(
        Patient.organization_id ==
        current_user.organization_id
    ).all()

    return patients





@router.get("/organization/reports")
def get_organization_reports(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "organization_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    reports = (
        db.query(Report)
        .join(
            Patient,
            Report.patient_id == Patient.patient_id
        )
        .filter(
            Patient.organization_id ==
            current_user.organization_id
        )
        .order_by(
            Report.created_at.desc()
        )
        .all()
    )

    return reports


from app.models.user import User
from app.models.patient import Patient
from app.models.report import Report
from app.models.consultation import Consultation

@router.get("/organization/usage")
def get_organization_usage(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "organization_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    doctors = db.query(User).filter(
        User.organization_id == current_user.organization_id,
        User.role == "practitioner"
    ).count()

    patients = db.query(Patient).filter(
        Patient.organization_id == current_user.organization_id
    ).count()

    consultations = (
        db.query(Consultation)
        .join(
            Patient,
            Consultation.patient_id == Patient.patient_id
        )
        .filter(
            Patient.organization_id ==
            current_user.organization_id
        )
        .count()
    )

    reports = (
        db.query(Report)
        .join(
            Patient,
            Report.patient_id == Patient.patient_id
        )
        .filter(
            Patient.organization_id ==
            current_user.organization_id
        )
        .count()
    )

    return {
        "doctors": doctors,
        "patients": patients,
        "consultations": consultations,
        "reports": reports
    }

from app.models.organization import Organization

@router.get("/organization/subscription")
def get_organization_subscription(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "organization_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    organization = db.query(
        Organization
    ).filter(
        Organization.organization_id ==
        current_user.organization_id
    ).first()

    return {
    "organization_id": organization.organization_id,
    "name": organization.name,
    "plan": organization.subscription_plan,
    "billing_status": organization.billing_status,
    "max_users": organization.max_users
}

class CreateDoctorRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    password: str = Field(..., min_length=8)

    phone: str = Field(..., pattern=r"^(?:\+91|91)?\d{10}$")
    license_number: str = Field(..., min_length=3)

    specialization: str
    department: str
@router.post("/organization/doctors")
def create_organization_doctor(
    payload: CreateDoctorRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "organization_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    existing = db.query(User).filter(
        User.email == payload.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    doctor = User(
          full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,

            license_number=payload.license_number,

            specialization=payload.specialization,
            department=payload.department,

            password_hash=hash_password(
                payload.password
        ),
        role="practitioner",
        organization_id=
        current_user.organization_id,
        status="active",
        email_verified=True
    )

    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return {
        "message": "Doctor created successfully",
        "doctor_id": doctor.user_id,
        "doctor_name": doctor.full_name,
        "email": doctor.email,
        "phone": doctor.phone,
        "license_number": doctor.license_number
    }

@router.get("/organization/settings")
def get_organization_settings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    organization = db.query(
        Organization
    ).filter(
        Organization.organization_id ==
        current_user.organization_id
    ).first()

    return organization

@router.put("/organization/settings")
def update_organization_settings(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    organization = db.query(
        Organization
    ).filter(
        Organization.organization_id ==
        current_user.organization_id
    ).first()

    organization.name = payload["name"]
    organization.email = payload["email"]
    organization.phone = payload["phone"]

    db.commit()

    return {"message": "Updated"}

from app.models.patient import Patient
from app.models.report import Report

from app.models.patient import Patient
from app.models.report import Report

@router.get("/organization/doctors/{doctor_id}")
def get_doctor_details(
    doctor_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    doctor = db.query(User).filter(
        User.user_id == doctor_id,
        User.organization_id ==
        current_user.organization_id
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    patient_count = db.query(Patient).filter(
        Patient.doctor_id == doctor_id,
        Patient.deleted_at == None
    ).count()

    report_count = db.query(Report).filter(
        Report.user_id == doctor_id
    ).count()

    return {
        "user_id": doctor.user_id,
        "full_name": doctor.full_name,
        "email": doctor.email,
        "phone": doctor.phone,
        "license_number": doctor.license_number,
        "department": getattr(doctor, "department", None),
        "specialization": getattr(doctor, "specialization", None),
        "status": doctor.status,
        "role": doctor.role,
        "created_at": doctor.created_at,

        "patient_count": patient_count,
        "consultation_count": report_count,  # temporary
        "report_count": report_count
    }
@router.put(
    "/organization/doctors/{doctor_id}"
)
def update_doctor(
    doctor_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    doctor = db.query(User).filter(
        User.user_id == doctor_id,
        User.organization_id ==
        current_user.organization_id
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    doctor.phone = payload.get(
        "phone",
        doctor.phone
    )

    doctor.specialization = payload.get(
        "specialization",
        doctor.specialization
    )

    doctor.department = payload.get(
        "department",
        doctor.department
    )

    db.commit()

    return {
        "message": "Doctor updated"
    }

class ResetDoctorPasswordRequest(BaseModel):
    password: str

@router.put(
    "/organization/doctors/{doctor_id}/reset-password"
)
def reset_doctor_password(
    doctor_id: str,
    payload: ResetDoctorPasswordRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    doctor = db.query(User).filter(
        User.user_id == doctor_id,
        User.organization_id ==
        current_user.organization_id
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    doctor.password_hash = hash_password(
        payload.password
    )

    db.commit()

    return {
        "message":
        "Password reset successfully"
    }

@router.get("/organization/patients")
def get_organization_patients(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "organization_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    patients = db.query(Patient).filter(
        Patient.organization_id ==
        current_user.organization_id
    ).all()

    return patients



from pydantic import BaseModel

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

from app.core.security import (
    verify_password,
    hash_password
)

@router.put("/organization/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "organization_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    user = db.query(User).filter(
        User.user_id == current_user.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not verify_password(
        payload.current_password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    user.password_hash = hash_password(
        payload.new_password
    )

    db.commit()

    return {
        "message": "Password changed successfully"
    }

from app.models.organization import Organization
from app.models.user import User
from app.models.patient import Patient
from app.models.consultation import Consultation
from app.models.report import Report
from app.core.roles import require_role
@router.get("/organizations/{organization_id}")
def get_organization_details(
    organization_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["super_admin"]))
):
    organization = db.query(Organization).filter(
        Organization.organization_id == organization_id
    ).first()

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organization not found"
        )

    doctor_count = db.query(User).filter(
        User.organization_id == organization_id,
        User.role == "practitioner"
    ).count()

    patient_count = db.query(Patient).filter(
        Patient.organization_id == organization_id
    ).count()

    consultation_count = db.query(Consultation).filter(
        Consultation.organization_id == organization_id
    ).count()

    report_count = db.query(Report).filter(
        Report.organization_id == organization_id
    ).count()

    doctors = db.query(User).filter(
        User.organization_id == organization_id,
        User.role == "practitioner"
    ).all()

    return {
        "organization": organization,
        "doctor_count": doctor_count,
        "patient_count": patient_count,
        "consultation_count": consultation_count,
        "report_count": report_count,
        "doctors": doctors
    }