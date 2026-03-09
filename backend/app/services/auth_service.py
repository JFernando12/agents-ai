import bcrypt
import jwt
from datetime import datetime, timedelta, timezone

from app.config import env
from app.models import LoginRequest, LoginResponse, AccountCreate, User, UserCreate
from app.repositories import account_repository, user_repository


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_jwt(user_id: str, name: str, email: str, role: str, account_id: str) -> str:
    payload = {
        "id": user_id,
        "name": name,
        "email": email,
        "role": role,
        "account_id": account_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, env.jwt_secret_key, algorithm=env.jwt_algorithm)


class AuthService:
    def register(self, register_data: AccountCreate) -> LoginResponse | None:
        """
        Creates a new account + the first admin user.
        Returns a JWT on success, None if email is already in use.
        """
        # Check email uniqueness
        existing = user_repository.get_by_email(register_data.email)
        if existing:
            return None

        # Create account
        account_id = account_repository.create(register_data)

        # Create the account owner (first user always gets owner role)
        user_data = UserCreate(
            name=register_data.name,
            email=register_data.email,
            password=register_data.password,
            role="owner",
        )
        password_hash = hash_password(register_data.password)
        user_id = user_repository.create(user_data, account_id, password_hash)

        token = create_jwt(
            user_id=user_id,
            name=register_data.name,
            email=register_data.email,
            role="owner",
            account_id=account_id,
        )

        return LoginResponse(
            token=token,
            user_id=user_id,
            name=register_data.name,
            email=register_data.email,
            role="owner",
            account_id=account_id,
        )

    def login(self, login_data: LoginRequest) -> LoginResponse | None:
        """
        Validates credentials and returns a JWT.
        Returns None if credentials are invalid or account is inactive.
        """
        user_record = user_repository.get_by_email(login_data.email)
        if not user_record:
            return None

        if not verify_password(login_data.password, user_record.password_hash):
            return None

        if user_record.status != "active":
            return None

        # Verify owner account is still active (skip check for super_admin)
        if user_record.role != "super_admin":
            account = account_repository.get_by_id(user_record.account_id)
            if not account or account.status != "active":
                return None

        token = create_jwt(
            user_id=user_record.id,
            name=user_record.name,
            email=user_record.email,
            role=user_record.role,
            account_id=user_record.account_id,
        )

        return LoginResponse(
            token=token,
            user_id=user_record.id,
            name=user_record.name,
            email=user_record.email,
            role=user_record.role,
            account_id=user_record.account_id,
        )


auth_service = AuthService()
