import secrets

from app.models.api_key import APIKey


class APIKeyService:

    @staticmethod
    def generate_key():

        return secrets.token_hex(32)

    @staticmethod
    def create_api_key(

        db,

        organization_id,

        name
    ):

        key = APIKeyService.generate_key()

        api_key = APIKey(

            organization_id=organization_id,

            key=key,

            name=name
        )

        db.add(api_key)

        db.commit()

        db.refresh(api_key)

        return api_key