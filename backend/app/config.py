# fichier de configuration
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Configuration de base
    SECRET_KEY: str = os.getenv("SECRET_KEY", "votre-secret-key-super-secure-changez-moi")
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    
    # Configuration OAuth2 Google
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
    
    # URLs OAuth2
    GOOGLE_AUTHORIZATION_URL: str = "https://accounts.google.com/o/oauth2/auth"
    GOOGLE_TOKEN_URL: str = "https://oauth2.googleapis.com/token"
    GOOGLE_USER_INFO_URL: str = "https://www.googleapis.com/oauth2/v2/userinfo"
    
    # Frontend URL pour redirection
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Scopes OAuth2
    GOOGLE_SCOPES: list = [
        "openid",
        "email",
        "profile"
    ]

settings = Settings()