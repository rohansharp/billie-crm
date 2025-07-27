from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class User(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    disabled: bool = False
    client_id: str


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    client_id: str


class UserInDB(User):
    hashed_password: str
    client_id: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None
    client_id: str


class ApiKey(BaseModel):
    key: str
    client_id: str
    created_at: datetime
    last_used: Optional[datetime] = None
    is_revoked: bool = False
