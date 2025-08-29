from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional
from .. import models, schemas, auth
from ..database import get_db
from ..oauth import oauth2_service
from ..config import settings
import secrets

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Créer un nouveau compte utilisateur"""
    
    
    if db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email déjà utilisé"
        )
    
    if db.query(models.User).filter(models.User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nom d'utilisateur déjà utilisé"
        )
    
    
    db_user = models.User(
        username=user_data.username,
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        password_hash=auth.get_password_hash(user_data.password)
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """Connexion utilisateur"""
    
    user = auth.authenticate_user(db, user_credentials.username, user_credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nom d'utilisateur ou mot de passe incorrect"
        )
    
    access_token_expires = timedelta(hours=auth.ACCESS_TOKEN_EXPIRE_HOURS)
    access_token = auth.create_access_token(
        data={"user_id": user.id}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": auth.ACCESS_TOKEN_EXPIRE_HOURS * 3600  
    }

@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_info(current_user: models.User = Depends(auth.get_current_user)):
    """Obtenir les informations de l'utilisateur connecté"""
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_profile(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour le profil utilisateur"""
    
    
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.get("/oauth/google/url")
def get_google_oauth_url():
    """Obtenir l'URL d'autorisation Google OAuth"""
    if not oauth2_service.is_google_configured():
        raise HTTPException(
            status_code=503,
            detail="Google OAuth non configuré sur le serveur"
        )
    
    try:
        auth_data = oauth2_service.generate_google_auth_url()
        return {
            "auth_url": auth_data["auth_url"],
            "state": auth_data["state"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la génération de l'URL OAuth: {str(e)}"
        )

@router.get("/oauth/google/callback")
async def google_oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    error: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Callback OAuth2 Google"""
    
    
    if error:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=oauth_denied",
            status_code=302
        )
    
    try:
        
        token_data = await oauth2_service.exchange_code_for_token(code, state)
        access_token = token_data.get('access_token')
        
        if not access_token:
            raise HTTPException(
                status_code=400,
                detail="Token d'accès non reçu"
            )
        
        
        user_info = await oauth2_service.get_user_info(access_token)
        
        
        user = await get_or_create_oauth_user(db, user_info)
        
        
        access_token_expires = timedelta(hours=auth.ACCESS_TOKEN_EXPIRE_HOURS)
        jwt_token = auth.create_access_token(
            data={"user_id": user.id},
            expires_delta=access_token_expires
        )
        
        
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}",
            status_code=302
        )
        
    except HTTPException:
        raise
    except Exception as e:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=oauth_error",
            status_code=302
        )

@router.post("/oauth/google/connect", response_model=schemas.Token)
async def connect_google_to_existing_account(
    oauth_code: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Connecter un compte Google à un compte existant"""
    
    try:
        
        token_data = await oauth2_service.exchange_code_for_token(oauth_code, "")
        access_token = token_data.get('access_token')
        
        
        user_info = await oauth2_service.get_user_info(access_token)
        google_id = user_info.get('id')
        google_email = user_info.get('email')
        
        
        existing_oauth_user = db.query(models.User).filter(
            models.User.oauth_id == google_id,
            models.User.oauth_provider == "google"
        ).first()
        
        if existing_oauth_user and existing_oauth_user.id != current_user.id:
            raise HTTPException(
                status_code=400,
                detail="Ce compte Google est déjà associé à un autre utilisateur"
            )
        
        
        current_user.oauth_provider = "google"
        current_user.oauth_id = google_id
        
        
        if not current_user.email or current_user.email != google_email:
            
            email_exists = db.query(models.User).filter(
                models.User.email == google_email,
                models.User.id != current_user.id
            ).first()
            
            if not email_exists:
                current_user.email = google_email
        
        db.commit()
        db.refresh(current_user)
        
        
        access_token_expires = timedelta(hours=auth.ACCESS_TOKEN_EXPIRE_HOURS)
        jwt_token = auth.create_access_token(
            data={"user_id": current_user.id},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "expires_in": auth.ACCESS_TOKEN_EXPIRE_HOURS * 3600
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'association du compte Google: {str(e)}"
        )

@router.delete("/oauth/disconnect")
def disconnect_oauth_account(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Déconnecter le compte OAuth"""
    
    if not current_user.oauth_provider:
        raise HTTPException(
            status_code=400,
            detail="Aucun compte OAuth associé"
        )
    
    
    if not current_user.password_hash:
        raise HTTPException(
            status_code=400,
            detail="Impossible de déconnecter OAuth sans mot de passe défini. Définissez d'abord un mot de passe."
        )
    
    
    current_user.oauth_provider = None
    current_user.oauth_id = None
    
    db.commit()
    
    return {"message": "Compte OAuth déconnecté avec succès"}



async def get_or_create_oauth_user(db: Session, user_info: dict) -> models.User:
    """Récupérer ou créer un utilisateur OAuth"""
    
    google_id = user_info.get('id')
    email = user_info.get('email')
    first_name = user_info.get('given_name', '')
    last_name = user_info.get('family_name', '')
    username = user_info.get('email', '').split('@')[0]  
    
    
    user = db.query(models.User).filter(
        models.User.oauth_id == google_id,
        models.User.oauth_provider == "google"
    ).first()
    
    if user:
        return user
    
    
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if user:
        
        user.oauth_provider = "google"
        user.oauth_id = google_id
        db.commit()
        return user
    
    
    base_username = username
    counter = 1
    while db.query(models.User).filter(models.User.username == username).first():
        username = f"{base_username}{counter}"
        counter += 1
    
    
    new_user = models.User(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        oauth_provider="google",
        oauth_id=google_id,
        password_hash="",  
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user