from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from app.db.deps import get_db
from app.schemas.user import UserCreate, UserLogin, User as UserSchema, ForgotPasswordRequest, ResetPasswordRequest
from app.services.auth_service import AuthService
from app.core.deps import get_current_user
from app.models.user import User
from pydantic import BaseModel
from app.core.jwt import verify_token, create_access_token
import time

router = APIRouter()


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    return AuthService.register_user(db, user)


@router.post("/login")
def login(user: UserLogin, response: Response, db: Session = Depends(get_db)):
    start = time.time()

    result = AuthService.login_user(db, user)

    print("LOGIN TIME:", time.time() - start)

    # Set refresh token in secure httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        secure=False,   # FALSE for local development
        samesite="lax",
        max_age=30 * 24 * 60 * 60
    )

    # Return access token and user info
    return {
        "access_token": result["access_token"],
        "token_type": "bearer",
        "user": result["user"]
    }


@router.post("/refresh")
def refresh_token(request: Request):
    print("REFRESH CALLED")

    token = request.cookies.get("refresh_token")

    if not token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    payload = verify_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    new_access_token = create_access_token({
        "sub": payload["sub"],
        "role": payload.get("role"),
        "org_id": payload.get("org_id")
    })

    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }


@router.get("/verify")
def verify_email(token: str, db: Session = Depends(get_db)):
    # Simple verification logic
    if not token.startswith("mock_token_"):
        raise HTTPException(status_code=400, detail="Invalid verification token")

    user_id = token.replace("mock_token_", "")

    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.email_verified = True
    user.status = "active"

    db.commit()

    return {
        "message": "Email verified successfully. You can now login."
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("refresh_token")

    return {
        "message": "Logged out successfully"
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "license_number": current_user.license_number,
        "organization_id": str(current_user.organization_id),
        "role": current_user.role,
        "status": current_user.status,
        "email_verified": current_user.email_verified,
        "twofa_enabled": current_user.twofa_enabled,
        "timezone": current_user.timezone,
        "language_preference": current_user.language_preference,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
    }


@router.put("/me")
def update_profile(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated = AuthService.update_profile(db, current_user.user_id, data)

    return {
        "user_id": updated.user_id,
        "email": updated.email,
        "full_name": updated.full_name,
        "phone": updated.phone,
        "license_number": updated.license_number,
        "organization_id": str(updated.organization_id),
        "role": updated.role,
        "status": updated.status,
        "email_verified": updated.email_verified,
        "twofa_enabled": updated.twofa_enabled,
        "timezone": updated.timezone,
        "language_preference": updated.language_preference,
        "created_at": updated.created_at.isoformat() if updated.created_at else None,
        "last_login": updated.last_login.isoformat() if updated.last_login else None,
    }


@router.put("/security")
def update_security(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AuthService.update_security(db, current_user.user_id, data)


@router.put("/organization")
def update_organization(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure only users belonging to the org can update it
    # In a real app, you might also check if the user is an admin of the org
    return AuthService.update_organization(db, current_user.organization_id, data)


class OTPVerify(BaseModel):
    user_id: str
    otp: str


@router.post("/verify-otp")
def verify_otp(data: OTPVerify, db: Session = Depends(get_db)):
    return AuthService.verify_otp(db, data.user_id, data.otp)


# ── Forgot / Reset Password ──────────────────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Request a password reset link.
    Always returns 200 to prevent email enumeration.
    In development the token is returned in the response body (dev_token).
    """
    return AuthService.forgot_password(db, data.email)


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Consume a reset token and set a new password.
    Supports development bypass if email is provided.
    """
    if not data.token and data.email:
        return AuthService.reset_password_by_email(db, data.email, data.new_password)
    return AuthService.reset_password(db, data.token, data.new_password)
