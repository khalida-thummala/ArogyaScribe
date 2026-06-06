from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: str

    license_number: Optional[str] = None
    organization_name: Optional[str] = None

    role: Optional[str] = "practitioner"
    timezone: Optional[str] = "UTC"
    language_preference: Optional[str] = "en"


class UserLogin(BaseModel):
    email:    EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token:        Optional[str] = None
    email:        Optional[str] = None
    new_password: str


class User(BaseModel):
    user_id:             str
    email:               str
    full_name:           str
    phone:               Optional[str] = None
    license_number: Optional[str] = None
    organization_name: Optional[str] = None
    role:                str
    status:              str
    email_verified:      Optional[bool] = False
    twofa_enabled:       Optional[bool] = False
    timezone:            Optional[str]  = None
    language_preference: Optional[str]  = None
    created_at:          Optional[datetime] = None
    updated_at:          Optional[datetime] = None
    last_login:          Optional[datetime] = None

    class Config:
        from_attributes = True