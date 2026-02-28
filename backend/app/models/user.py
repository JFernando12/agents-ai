from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    id: str
    name: str
    email: str
    role: Optional[str] = None
    
    class Config:
        from_attributes = True
