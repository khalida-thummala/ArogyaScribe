from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta, timezone
import random
import string
import secrets
from app.models.patient import Patient
from app.models.user import User
from app.models.organization import Organization
from app.schemas.user import UserCreate, UserLogin
from app.core.security import hash_password, verify_password
from app.core.jwt import create_access_token, create_refresh_token

from app.services.audit_service import audit_service
from app.services.notification_service import NotificationService

# In-memory store for reset tokens (use Redis/DB in production)
_reset_tokens: dict = {}

class AuthService:
    @staticmethod
    def generate_otp(length: int = 6) -> str:
        return ''.join(random.choices(string.digits, k=length))

    @staticmethod
    def register_user(db: Session, user: UserCreate):
        # 1. Check existing email
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")
        # Patient registration validation
        if user.role == "patient":

            patient = db.query(Patient).filter(
                Patient.email == user.email
            ).first()

            if not patient:
                raise HTTPException(
                    status_code=400,
                    detail="Patient record not found. Contact your doctor."
                )

            hashed = hash_password(user.password)

            new_user = User(
                email=user.email,
                password_hash=hashed,
                full_name=user.full_name,
                phone=user.phone,
                role="patient",
                status="active",
                email_verified=True,
                phone_verified=True
            )

            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            return {
                "message": "Patient registration successful",
                "user_id": new_user.user_id
            }

        
    # existing doctor registration code continues here
        try:
            # 2. Check if org exists with this email, or create it
            org = db.query(Organization).filter(Organization.email == user.email).first()

            if not org:
                org = Organization(
                    name=user.organization_name,
                    email=user.email,
                    phone=user.phone
                )
                db.add(org)
                db.flush()

            # 3. Hash password
            hashed = hash_password(user.password)

            # 4. Create user with all provided fields
            new_user = User(
                email=user.email,
                password_hash=hashed,
                full_name=user.full_name,
                phone=user.phone,
                license_number=user.license_number,
                organization_id=org.organization_id,
                role= "practitioner",
                timezone=user.timezone or "UTC",
                language_preference=user.language_preference or "en",
                status="active",
                email_verified=True,
                phone_verified=True
            )

            db.add(new_user)
            db.commit()

            # 5. Log event
            audit_service.log_event(
                db,
                action="user_registration",
                user_id=new_user.user_id,
                organization_id=org.organization_id,
                details={"email": user.email}
            )

            return {
                "message": "Registration successful. You can now log in.",
                "user_id": new_user.user_id
            }

        except IntegrityError as e:
            db.rollback()
            err_str = str(e.orig).lower()
            if "license_number" in err_str:
                raise HTTPException(status_code=400, detail="License number already registered.")
            if "email" in err_str:
                raise HTTPException(status_code=400, detail="Email already in use.")
            raise HTTPException(status_code=400, detail="Registration failed.")
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    def login_user(db: Session, user: UserLogin):
        import time

        try:
            # ---------------- DB QUERY ----------------
            t1 = time.time()

            db_user = db.query(User).filter(User.email == user.email).first()

            print("DB QUERY TIME:", time.time() - t1)

            if not db_user:
                raise HTTPException(status_code=401, detail="Invalid credentials")

            # ---------------- ACCOUNT LOCK CHECK ----------------
            if (
                db_user.locked_until
                and db_user.locked_until > datetime.now(timezone.utc)
            ):
                raise HTTPException(
                    status_code=403,
                    detail="Account locked. Please try again later."
                )

            # ---------------- PASSWORD VERIFY ----------------
            t2 = time.time()

            password_valid = verify_password(
                user.password,
                db_user.password_hash
            )

            print("PASSWORD VERIFY TIME:", time.time() - t2)

            if not password_valid:
                db_user.failed_login_attempts += 1

                if db_user.failed_login_attempts >= 5:
                    db_user.locked_until = (
    datetime.now(timezone.utc)
    + timedelta(minutes=15)
)

                db.commit()

                # Log failed attempt
                audit_service.log_event(
                    db,
                    action="login_failed",
                    details={"email": user.email},
                    status="failure"
                )

                raise HTTPException(
                    status_code=401,
                    detail="Invalid credentials"
                )

            # ---------------- UPDATE LOGIN INFO ----------------
            db_user.last_login = datetime.utcnow()
            db_user.failed_login_attempts = 0
            db_user.locked_until = None

            db.commit()

            # ---------------- TOKEN CREATION ----------------
            t3 = time.time()

            access_token = create_access_token({
                "sub": db_user.email,
                "role": db_user.role,
                "org_id": str(db_user.organization_id)
            })

            refresh_token = create_refresh_token({
                "sub": db_user.email
            })

            print("TOKEN TIME:", time.time() - t3)

            # ---------------- AUDIT LOG ----------------
            audit_service.log_event(
                db,
                action="login_success",
                user_id=db_user.user_id,
                organization_id=db_user.organization_id
            )

            # ---------------- RETURN ----------------
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user": {
                    "id": db_user.user_id,
                    "email": db_user.email,
                    "full_name": db_user.full_name,
                    "role": db_user.role,
                    "organization_id": db_user.organization_id
                }
            }

        except HTTPException:
            raise

        except Exception as e:
            db.rollback()

            raise HTTPException(
                status_code=500,
                detail=f"Internal server error: {str(e)}"
            )
    @staticmethod
    def verify_otp(db: Session, user_id: str, otp: str):
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Development Bypass: Allow 123456 for testing
        if otp == "123456":
            print(f"DEBUG: Using master OTP for user {user_id}")
        elif user.otp != otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        
        if user.otp_expiry and user.otp_expiry < datetime.utcnow() and otp != "123456":
            raise HTTPException(status_code=400, detail="OTP expired")
        
        user.email_verified = True
        user.phone_verified = True
        user.status = "active"
        user.otp = None
        user.otp_expiry = None
        db.commit()
        
        return {"message": "Account verified successfully"}

    @staticmethod
    def update_profile(db: Session, user_id: str, data: dict):
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        allowed_fields = ["full_name", "phone", "timezone", "language_preference", "signature_url"]
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])
        
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update_organization(db: Session, org_id: str, data: dict):
        if not org_id:
            raise HTTPException(status_code=400, detail="User does not belong to any organization")
            
        org = db.query(Organization).filter(Organization.organization_id == org_id).first()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")

        allowed_fields = ["hospital_name_override", "address", "contact_info", "logo_url", "letterhead_url"]
        for field in allowed_fields:
            if field in data:
                setattr(org, field, data[field])
        
        db.commit()
        db.refresh(org)
        
        return {
            "organization_id": org.organization_id,
            "hospital_name_override": org.hospital_name_override,
            "address": org.address,
            "contact_info": org.contact_info,
            "logo_url": org.logo_url,
            "letterhead_url": org.letterhead_url
        }

    @staticmethod
    def update_security(db: Session, user_id: str, data: dict):
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if "current_password" in data and "new_password" in data:
            if not verify_password(data["current_password"], user.password_hash):
                raise HTTPException(status_code=400, detail="Incorrect current password")
            user.password_hash = hash_password(data["new_password"])

        if "twofa_enabled" in data:
            user.twofa_enabled = data["twofa_enabled"]

        db.commit()
        return {"message": "Security settings updated successfully"}

    # ── Forgot / Reset Password ──────────────────────────────────────────────

    @staticmethod
    def forgot_password(db: Session, email: str) -> dict:
        """
        Generate a short-lived reset token and store it.
        In production, email the link to the user.
        Token expires in 30 minutes.
        """
        user = db.query(User).filter(User.email == email).first()
        # Always return success to prevent email enumeration
        if not user:
            return {"message": "If that email is registered, a reset link has been sent."}

        # Generate a secure URL-safe token
        token = secrets.token_urlsafe(32)
        expiry = datetime.utcnow() + timedelta(minutes=30)

        # Store in the in-memory dict (key = token, value = {user_id, expiry})
        _reset_tokens[token] = {
            "user_id": str(user.user_id),
            "expiry":  expiry,
        }

        # Log the event
        audit_service.log_event(
            db,
            action="password_reset_requested",
            user_id=user.user_id,
            organization_id=user.organization_id,
            details={"email": email},
        )

        # In production: send email with link like
        #   https://app.arogyascribe.ai/reset-password?token=<token>
        # For now, return the token in the response so the frontend can use it
        # during development (remove in production).
        print(f"[DEV] Password reset token for {email}: {token}")

        return {
            "message": "If that email is registered, a reset link has been sent.",
            # Remove the line below in production:
            "dev_token": token,
        }

    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> dict:
        """
        Validate the reset token and update the user's password.
        """
        entry = _reset_tokens.get(token)
        if not entry:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

        if datetime.utcnow() > entry["expiry"]:
            _reset_tokens.pop(token, None)
            raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")

        user = db.query(User).filter(User.user_id == entry["user_id"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        user.password_hash = hash_password(new_password)
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()

        # Invalidate the token after use
        _reset_tokens.pop(token, None)

        audit_service.log_event(
            db,
            action="password_reset_completed",
            user_id=user.user_id,
            organization_id=user.organization_id,
            details={"email": user.email},
        )

        return {"message": "Password updated successfully. You can now sign in."}

    @staticmethod
    def reset_password_by_email(db: Session, email: str, new_password: str) -> dict:
        """
        Simplified password reset for development (bypasses token check).
        """
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        user.password_hash = hash_password(new_password)
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()

        audit_service.log_event(
            db,
            action="password_reset_simplified",
            user_id=user.user_id,
            organization_id=user.organization_id,
            details={"email": user.email},
        )

        return {"message": "Password updated successfully. You can now sign in."}

