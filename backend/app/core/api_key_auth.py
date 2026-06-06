from fastapi import Header, HTTPException, Depends

from sqlalchemy.orm import Session

from datetime import datetime

from app.db.deps import get_db

from app.models.api_key import APIKey


def validate_api_key(

    db: Session = Depends(get_db),

    x_api_key: str = Header(...)
):

    api_key = db.query(APIKey).filter(

        APIKey.key == x_api_key,

        APIKey.is_active == True

    ).first()

    if not api_key:

        raise HTTPException(

            status_code=401,

            detail="Invalid API key"
        )

    api_key.request_count += 1

    api_key.last_used_at = datetime.utcnow()

    db.commit()

    return api_key