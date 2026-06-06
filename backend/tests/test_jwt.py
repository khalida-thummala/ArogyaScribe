import os
from dotenv import load_dotenv
load_dotenv()

from app.core.jwt import create_access_token, verify_token
from app.core.deps import get_current_user
from fastapi.security import HTTPAuthorizationCredentials

token = create_access_token({"sub": "test@clinic.com", "role": "admin"})
print("Token:", token)

class MockCreds:
    credentials = token

try:
    from app.db.session import SessionLocal
    db = SessionLocal()
    # verify standard jwt decode
    from jose import jwt
    SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkeythatisverylongandsecure")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    print("Decoded payload:", payload)
except Exception as e:
    print("Error decoding:", e)
