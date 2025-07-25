#fichier pour OAuth2
import httpx
from fastapi import HTTPException
from authlib.integrations.starlette_client import OAuth
from authlib.integrations.starlette_client import OAuthError
from starlette.config import Config
from starlette.requests import Request
from typing import Dict, Optional
import secrets
import urllib.parse

from .config import settings

# Configuration OAuth avec Authlib
config = Config()
oauth = OAuth(config)

# Configuration du client Google OAuth
if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
    oauth.register(
        name='google',
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
        client_kwargs={
            'scope': ' '.join(settings.GOOGLE_SCOPES)
        }
    )

class OAuth2Service:
    def __init__(self):
        self.google_client_id = settings.GOOGLE_CLIENT_ID
        self.google_client_secret = settings.GOOGLE_CLIENT_SECRET
        
    def is_google_configured(self) -> bool:
        """Vérifier si Google OAuth est configuré"""
        return bool(self.google_client_id and self.google_client_secret)
    
    def generate_google_auth_url(self) -> Dict[str, str]:
        """Générer l'URL d'autorisation Google"""
        if not self.is_google_configured():
            raise HTTPException(
                status_code=500, 
                detail="Google OAuth non configuré"
            )
        
        # Générer un state unique pour la sécurité
        state = secrets.token_urlsafe(32)
        
        # Paramètres OAuth2
        params = {
            'client_id': self.google_client_id,
            'redirect_uri': settings.GOOGLE_REDIRECT_URI,
            'scope': ' '.join(settings.GOOGLE_SCOPES),
            'response_type': 'code',
            'state': state,
            'access_type': 'offline',
            'prompt': 'consent'
        }
        
        # Construire l'URL
        auth_url = f"{settings.GOOGLE_AUTHORIZATION_URL}?{urllib.parse.urlencode(params)}"
        
        return {
            'auth_url': auth_url,
            'state': state
        }
    
    async def exchange_code_for_token(self, code: str, state: str) -> Dict:
        """Échanger le code d'autorisation contre un token"""
        if not self.is_google_configured():
            raise HTTPException(
                status_code=500,
                detail="Google OAuth non configuré"
            )
        
        # Données pour l'échange de token
        token_data = {
            'client_id': self.google_client_id,
            'client_secret': self.google_client_secret,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': settings.GOOGLE_REDIRECT_URI,
        }
        
        # Requête pour obtenir le token
        async with httpx.AsyncClient() as client:
            response = await client.post(
                settings.GOOGLE_TOKEN_URL,
                data=token_data,
                headers={'Accept': 'application/json'}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail="Erreur lors de l'échange du code OAuth"
                )
            
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict:
        """Récupérer les informations utilisateur depuis Google"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/json'
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                settings.GOOGLE_USER_INFO_URL,
                headers=headers
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail="Erreur lors de la récupération des informations utilisateur"
                )
            
            return response.json()

# Instance globale du service OAuth2
oauth2_service = OAuth2Service()