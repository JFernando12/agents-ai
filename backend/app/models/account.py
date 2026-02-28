from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class Account(BaseModel):
    id: str
    name: str
    slug: str
    status: Literal["active", "inactive", "suspended"] = "active"
    plan: str = "free"  # free | pro | enterprise (for future payment integration)
    owner_email: str
    created_at: datetime
    updated_at: datetime


class AccountCreate(BaseModel):
    """Used when a user self-registers (creates account + first admin)."""
    account_name: str
    name: str          # owner's full name
    email: str
    password: str


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[Literal["active", "inactive", "suspended"]] = None
    plan: Optional[str] = None


class AccountPublic(BaseModel):
    id: str
    name: str
    slug: str
    status: str
    plan: str
    owner_email: str
    created_at: datetime
    updated_at: datetime
