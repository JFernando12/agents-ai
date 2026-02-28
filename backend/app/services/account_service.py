from app.models import (
    AccountUpdate, AccountPublic,
    UserCreate, UserUpdate, UserResetPassword, UserPublic,
    User,
)
from app.repositories import account_repository, user_repository
from app.services.auth_service import hash_password


class AccountService:
    # ------------------------------------------------------------------ #
    # Account management (super_admin only)
    # ------------------------------------------------------------------ #
    def get_all_accounts(self) -> list[dict]:
        accounts = account_repository.get_all()
        return [AccountPublic(**a.model_dump()).model_dump(mode='json') for a in accounts]

    def get_account(self, account_id: str) -> dict | None:
        account = account_repository.get_by_id(account_id)
        if not account:
            return None
        return AccountPublic(**account.model_dump()).model_dump(mode='json')

    def update_account(self, account_id: str, data: AccountUpdate) -> bool:
        return account_repository.update(account_id, data)

    def delete_account(self, account_id: str) -> bool:
        return account_repository.delete(account_id)

    # ------------------------------------------------------------------ #
    # User management (admin or super_admin)
    # ------------------------------------------------------------------ #
    def get_users(self, account_id: str) -> list[dict]:
        users = user_repository.get_by_account(account_id)
        return [
            UserPublic(
                id=u.id,
                name=u.name,
                email=u.email,
                role=u.role,
                account_id=u.account_id,
                status=u.status,
                created_at=u.created_at,
                updated_at=u.updated_at,
            ).model_dump(mode='json')
            for u in users
        ]

    def get_user(self, account_id: str, user_id: str) -> dict | None:
        user = user_repository.get_by_id(user_id)
        if not user or user.account_id != account_id:
            return None
        return UserPublic(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            account_id=user.account_id,
            status=user.status,
            created_at=user.created_at,
            updated_at=user.updated_at,
        ).model_dump(mode='json')

    def create_user(
        self, account_id: str, user_data: UserCreate, requesting_user: User
    ) -> dict | None:
        """
        Creates a new user within an account.
        - owner role is reserved and can never be assigned directly.
        - admin can only create editor/viewer.
        - owner and super_admin can create admin/editor/viewer.
        """
        # owner role can never be assigned via this endpoint
        if user_data.role == "owner":
            return None
        # admins cannot create other admins or super_admins
        if requesting_user.role == "admin" and user_data.role in ("admin", "super_admin"):
            return None

        existing = user_repository.get_by_email(user_data.email)
        if existing:
            return None

        password_hash = hash_password(user_data.password)
        user_id = user_repository.create(user_data, account_id, password_hash)

        new_user = user_repository.get_by_id(user_id)
        if not new_user:
            return None

        return UserPublic(
            id=new_user.id,
            name=new_user.name,
            email=new_user.email,
            role=new_user.role,
            account_id=new_user.account_id,
            status=new_user.status,
            created_at=new_user.created_at,
            updated_at=new_user.updated_at,
        ).model_dump(mode='json')

    def update_user(
        self, account_id: str, user_id: str, data: UserUpdate, requesting_user: User
    ) -> bool:
        user = user_repository.get_by_id(user_id)
        if not user or user.account_id != account_id:
            return False

        # The owner user can only be modified by super_admin
        if user.role == "owner" and requesting_user.role != "super_admin":
            return False
        # owner role can never be assigned
        if data.role == "owner":
            return False
        # admins cannot promote to admin/super_admin
        if requesting_user.role == "admin" and data.role in ("admin", "super_admin"):
            return False

        return user_repository.update(user_id, data)

    def delete_user(self, account_id: str, user_id: str) -> bool:
        user = user_repository.get_by_id(user_id)
        if not user or user.account_id != account_id:
            return False
        # The owner can only be deleted by super_admin
        if user.role == "owner":
            return False
        return user_repository.delete(user_id)

    def reset_user_password(
        self, account_id: str, user_id: str, data: UserResetPassword
    ) -> bool:
        user = user_repository.get_by_id(user_id)
        if not user or user.account_id != account_id:
            return False
        new_hash = hash_password(data.new_password)
        return user_repository.update_password(user_id, new_hash)


account_service = AccountService()
