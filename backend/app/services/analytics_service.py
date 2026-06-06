from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models.consultation import Consultation
from app.models.patient import Patient
from app.models.report import Report

class AnalyticsService:
    @staticmethod
    def get_dashboard_stats(
    db: Session,
    current_user,
    period: str = "30d"
):
        organization_id = current_user.organization_id
        # Total Patients
        if current_user.role == "practitioner":
            total_patients = db.query(Patient).filter(
                Patient.doctor_id == current_user.user_id,
                Patient.deleted_at == None
            ).count()
        else:
            total_patients = db.query(Patient).filter(
                Patient.organization_id == current_user.organization_id,
                Patient.deleted_at == None
            ).count()

        # Total Consultations
        if current_user.role == "practitioner":
            total_consultations = db.query(Consultation).filter(
                Consultation.user_id == current_user.user_id
            ).count()
        else:
            total_consultations = db.query(Consultation).filter(
                Consultation.organization_id == organization_id
            ).count()

        # Consultations this month
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # Consultations this month
        if current_user.role == "practitioner":
            monthly_consultations = db.query(Consultation).filter(
                Consultation.user_id == current_user.user_id,
                Consultation.created_at >= start_of_month
            ).count()
        else:
            monthly_consultations = db.query(Consultation).filter(
                Consultation.organization_id == organization_id,
                Consultation.created_at >= start_of_month
            ).count()
        # Pending Reports
        if current_user.role == "practitioner":
            pending_reports = db.query(Report).filter(
                Report.user_id == current_user.user_id,
                Report.status == "draft"
            ).count()
        else:
            pending_reports = db.query(Report).filter(
                Report.organization_id == organization_id,
                Report.status == "draft"
            ).count()
        
        # Reports Exported (Signed/Approved)
        if current_user.role == "practitioner":
            reports_exported = db.query(Report).filter(
                Report.user_id == current_user.user_id,
                Report.status.in_(["approved", "signed"])
            ).count()
        else:
            reports_exported = db.query(Report).filter(
                Report.organization_id == organization_id,
                Report.status.in_(["approved", "signed"])
            ).count()

        # Avg Consultation Duration
        if current_user.role == "practitioner":
            avg_duration = db.query(
                func.avg(Consultation.duration_minutes)
            ).filter(
                Consultation.user_id == current_user.user_id,
                Consultation.duration_minutes != None
            ).scalar() or 0
        else:
            avg_duration = db.query(
                func.avg(Consultation.duration_minutes)
            ).filter(
                Consultation.organization_id == organization_id,
                Consultation.duration_minutes != None
            ).scalar() or 0

        return {
            "total_patients": total_patients,
            "total_consultations": total_consultations,
            "monthly_consultations": monthly_consultations,
            "pending_reports": pending_reports,
            "reports_exported": reports_exported,
            "avg_duration_minutes": round(float(avg_duration or 0), 1),
            "time_saved_hours": round(total_consultations * 0.25, 1) # Estimated 15 mins saved per consultation
        }

    @staticmethod
    def get_consultation_trends(
    db: Session,
    organization_id: str,
    period: str = "30d"
):
        try:

            days = int(
                period.replace("d", "")
            )

        except:

            days = 30
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Daily counts
        daily_results = db.query(
            func.date(Consultation.created_at).label('date'),
            func.count(Consultation.consultation_id).label('count')
        ).filter(
            Consultation.organization_id == organization_id,
            Consultation.created_at >= start_date
        ).group_by(func.date(Consultation.created_at)).all()

        # Consultation by type distribution
        type_results = db.query(
            Consultation.consultation_type,
            func.count(Consultation.consultation_id)
        ).filter(
            Consultation.organization_id == organization_id
        ).group_by(Consultation.consultation_type).all()
        
        total_c = sum(r[1] for r in type_results) or 1
        colors = ["#0d6e6e", "#5a3fad", "#e67e22", "#2980b9", "#27ae60"]
        by_type = []
        for i, r in enumerate(type_results):
            label = str(r[0] or "General").capitalize()
            by_type.append({
                "label": label,
                "pct": round((r[1] / total_c) * 100, 1),
                "color": colors[i % len(colors)]
            })

        # Monthly volume for the last 6 months (Robust PostgreSQL compatible version)
        monthly = []
        for i in range(5, -1, -1):
            # Calculate the target date for each of the last 6 months
            first_of_curr_month = end_date.replace(day=1)
            target_start = (first_of_curr_month - timedelta(days=i*30)).replace(day=1, hour=0, minute=0, second=0)
            
            month_name = target_start.strftime("%b")
            
            # Use simple range filtering which is much more reliable across DB types
            next_month = (target_start + timedelta(days=32)).replace(day=1)
            
            count = db.query(Consultation).filter(
                Consultation.organization_id == organization_id,
                Consultation.created_at >= target_start,
                Consultation.created_at < next_month
            ).count()
            
            monthly.append({
                "label": month_name,
                "h": max(count * 20, 10) if count > 0 else 0, # Min height for visibility
                "count": count,
                "current": i == 0
            })

        return {
            "daily": [{"date": str(r.date), "count": r.count} for r in daily_results],
            "by_type": by_type,
            "monthly": monthly
        }
