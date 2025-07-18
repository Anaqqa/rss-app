from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum

# Enums
class ThemePreference(str, Enum):
    light = "light"
    dark = "dark"

class OAuthProvider(str, Enum):
    google = "google"
    github = "github"
    microsoft = "microsoft"

# ===== USER SCHEMAS =====
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Le mot de passe doit contenir au moins 8 caractères')
        return v

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    oauth_provider: Optional[OAuthProvider] = None
    theme_preference: ThemePreference = ThemePreference.light
    font_size: int = 14
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    theme_preference: Optional[ThemePreference] = None
    font_size: Optional[int] = Field(None, ge=10, le=24)

# ===== AUTHENTICATION SCHEMAS =====
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    user_id: Optional[int] = None