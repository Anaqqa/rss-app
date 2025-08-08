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
    
    
# ===== COLLECTION SCHEMAS =====
class CollectionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    is_shared: bool = False

class CollectionCreate(CollectionBase):
    pass

class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None

class CollectionResponse(CollectionBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CollectionWithStats(CollectionResponse):
    feeds_count: int = 0
    articles_count: int = 0
    unread_count: int = 0
    
# ===== RSS FEED SCHEMAS =====
class RSSFeedBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    url: str = Field(..., pattern=r'^https?://.+')  # Changé: regex -> pattern
    description: Optional[str] = None
    site_url: Optional[str] = Field(None, pattern=r'^https?://.+')  # Changé: regex -> pattern
    update_frequency: int = Field(default=60, ge=15, le=1440)  # Entre 15 min et 24h
    is_active: bool = True

class RSSFeedCreate(RSSFeedBase):
    collection_id: int

class RSSFeedUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    update_frequency: Optional[int] = Field(None, ge=15, le=1440)
    is_active: Optional[bool] = None

class RSSFeedResponse(RSSFeedBase):
    id: int
    collection_id: int
    last_updated: Optional[datetime] = None
    last_fetch_status: str = "pending"
    error_message: Optional[str] = None
    added_by_user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True    
        
# ===== ARTICLE SCHEMAS =====
class ArticleBase(BaseModel):
    title: str = Field(..., max_length=300)
    link: str
    description: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = Field(None, max_length=100)
    published_date: Optional[datetime] = None

class ArticleResponse(ArticleBase):
    id: int
    feed_id: int
    guid: Optional[str] = None
    fetched_at: datetime
    
    # États pour l'utilisateur connecté
    is_read: Optional[bool] = None
    is_favorite: Optional[bool] = None
    
    class Config:
        from_attributes = True

# ===== USER ARTICLE SCHEMAS =====
class UserArticleUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_favorite: Optional[bool] = None

class UserArticleResponse(BaseModel):
    id: int
    user_id: int
    article_id: int
    is_read: bool
    is_favorite: bool
    read_at: Optional[datetime] = None
    favorited_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        

# ===== MESSAGE SCHEMAS =====
class MessageBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)

class MessageCreate(MessageBase):
    collection_id: int

class MessageUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)

class MessageResponse(MessageBase):
    id: int
    collection_id: int
    user_id: int
    created_at: datetime
    
    # Informations utilisateur pour l'affichage
    user: UserResponse
    
    class Config:
        from_attributes = True

# ===== COMMENT SCHEMAS =====
class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)

class CommentCreate(CommentBase):
    article_id: int
    collection_id: int

class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)

class CommentResponse(CommentBase):
    id: int
    article_id: int
    user_id: int
    collection_id: int
    created_at: datetime
    updated_at: datetime
    
    # Informations utilisateur pour l'affichage
    user: UserResponse
    
    class Config:
        from_attributes = True

# ===== USER SIMPLE SCHEMA (pour éviter la récursion) =====
class UserSimple(BaseModel):
    id: int
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Redéfinir les schemas de message et commentaire avec UserSimple
class MessageResponse(MessageBase):
    id: int
    collection_id: int
    user_id: int
    created_at: datetime
    
    # Informations utilisateur pour l'affichage
    user: UserSimple
    
    class Config:
        from_attributes = True

class CommentResponse(CommentBase):
    id: int
    article_id: int
    user_id: int
    collection_id: int
    created_at: datetime
    updated_at: datetime
    
    # Informations utilisateur pour l'affichage
    user: UserSimple
    
    class Config:
        from_attributes = True