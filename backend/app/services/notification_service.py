from app.models.notification import Notification


class NotificationService:

    @staticmethod
    def create_notification(

        db,

        user_id,

        title,

        message,

        type="info"
    ):

        notification = Notification(

            user_id=user_id,

            title=title,

            message=message,

            type=type
        )

        db.add(notification)

        db.commit()

        return notification