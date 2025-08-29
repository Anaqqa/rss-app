
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "votre-secret-key-super-secure-changez-moi")
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    
    
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
    
    
    GOOGLE_AUTHORIZATION_URL: str = "https://accounts.google.com/o/oauth2/auth"
    GOOGLE_TOKEN_URL: str = "https://oauth2.googleapis.com/token"
    GOOGLE_USER_INFO_URL: str = "https://www.googleapis.com/oauth2/v2/userinfo"
    
    
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    
    GOOGLE_SCOPES: list = [
        "openid",
        "email",
        "profile"
    ]

settings = Settings()