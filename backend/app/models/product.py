from pydantic import BaseModel
from datetime import datetime


class Product(BaseModel):
    id: str
    name: str
    description: str | None = None
    slug: str
    created_at: datetime
    updated_at: datetime


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    slug: str


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    slug: str | None = None
