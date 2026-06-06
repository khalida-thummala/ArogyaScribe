from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.db.deps import get_db

from app.core.deps import get_current_user

from app.services.api_key_service import APIKeyService

from app.models.api_key import APIKey


router = APIRouter()


@router.post("/generate")
def generate_api_key(

    db: Session = Depends(get_db),

    current_user = Depends(get_current_user)
):

    api_key = APIKeyService.create_api_key(

        db,

        current_user.organization_id,

        "Default Key"
    )

    return {

        "success": True,

        "api_key": api_key.key
    }


@router.get("")
def get_api_keys(

    db: Session = Depends(get_db),

    current_user = Depends(get_current_user)
):

    keys = db.query(APIKey).filter(

    APIKey.organization_id
    == current_user.organization_id,

    APIKey.is_active == True

).all()

    return keys


@router.post("/{api_key_id}/revoke")
def revoke_api_key(

    api_key_id: str,

    db: Session = Depends(get_db),

    current_user = Depends(get_current_user)
):

    api_key = db.query(APIKey).filter(

        APIKey.api_key_id == api_key_id,

        APIKey.organization_id
        == current_user.organization_id

    ).first()

    if not api_key:

        raise HTTPException(

            status_code=404,

            detail="API key not found"
        )

    api_key.is_active = False

    db.commit()

    return {

        "success": True,

        "message": "API key revoked"
    }