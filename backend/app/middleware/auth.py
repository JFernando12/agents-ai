from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from typing import Optional, Callable

from app.config.environment import env
from app.models.user import User

security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)


def validate_jwt_token(token: str) -> Optional[User]:
    """Decode and validate a JWT. Returns a User or None."""
    try:
        if token.startswith('Bearer '):
            token = token[7:]

        payload = jwt.decode(
            token,
            env.jwt_secret_key,
            algorithms=[env.jwt_algorithm]
        )

        if payload is None:
            return None

        required_fields = {'id', 'name', 'email', 'role', 'account_id'}
        if not required_fields.issubset(payload.keys()):
            return None

        if not isinstance(payload['id'], str):
            payload['id'] = str(payload['id'])

        return User(
            id=payload['id'],
            name=payload['name'],
            email=payload['email'],
            role=payload['role'],
            account_id=payload['account_id'],
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        return None
    except Exception as e:
        print(f"Error validating JWT token: {e}")
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Require a valid JWT. Used for all protected endpoints."""
    user = validate_jwt_token(credentials.credentials)
    if user:
        return user
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_chat_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
) -> User:
    """
    JWT (Authorization: Bearer) or static API key (X-API-Key) - chat endpoint only.
    API key creates a generic service user for external integrations.
    """
    if credentials:
        user = validate_jwt_token(credentials.credentials)
        if user:
            return user

    if x_api_key and env.api_key and x_api_key == env.api_key:
        return User(
            id='api-key-user',
            name='API Key User',
            email='api@service',
            role='viewer',
            account_id='default',
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def require_roles(*roles: str) -> Callable:
    """
    Dependency factory for role-based access control.

    Usage:
        @router.post("/")
        def create(user = Depends(require_roles("admin", "editor"))):
            ...
    """
    async def dependency(
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ) -> User:
        user = validate_jwt_token(credentials.credentials)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {list(roles)}",
            )
        return user

    return dependency