from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

UserRole = Literal["super_admin", "owner", "admin", "editor", "viewer"]

class User(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole = "viewer"
    account_id: Optional[str] = None

    class Config:
        from_attributes = True


class UserRecord(BaseModel):
    """Full user record stored in DynamoDB (includes password_hash)."""
    id: str
    name: str
    email: str
    role: UserRole
    account_id: str
    status: str = "active"
    password_hash: str
    created_at: datetime
    updated_at: datetime


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: UserRole = "viewer"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[Literal["active", "inactive"]] = None


class UserResetPassword(BaseModel):
    new_password: str


class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    account_id: str
    status: str
    created_at: datetime
    updated_at: datetime
