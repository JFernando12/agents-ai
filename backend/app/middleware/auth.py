from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from typing import Optional

from app.config.environment import env
from app.models.user import User

security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)

def validate_jwt_token(token: str) -> Optional[User]:
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        # Decode token
        payload = jwt.decode(
            token,
            env.jwt_secret_key,
            algorithms=[env.jwt_algorithm]
        )
        
        if payload is None:
            return None
        
        # Check required fields
        required_fields = {'id', 'name', 'email'}
        if not required_fields.issubset(payload.keys()):
            return None
        
        # Convert id to string if it's not already
        if 'id' in payload and not isinstance(payload['id'], str):
            payload['id'] = str(payload['id'])
        
        # Create user object
        user = User(**payload)
        return user
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        return None
    except Exception as e:
        print(f"Error validating JWT token: {str(e)}")
        return None

def validate_api_key(token: str) -> Optional[User]:
    """Accept a static API key in place of a JWT. Returns a generic service user."""
    if env.api_key and token == env.api_key:
        return User(id='api-key-user', name='API Key User', email='api@service')
    return None

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """JWT-only authentication for internal/admin endpoints."""
    token = credentials.credentials
    user = validate_jwt_token(token)
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
    """JWT (Authorization: Bearer) or API key (X-API-Key) — chat endpoint only."""
    if credentials:
        user = validate_jwt_token(credentials.credentials)
        if user:
            return user

    if x_api_key:
        user = validate_api_key(x_api_key)
        if user:
            return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
