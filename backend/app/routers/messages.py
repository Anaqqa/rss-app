# backend/app/routers/messages.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/messages", tags=["messages"])

@router.get("/collection/{collection_id}")
def get_collection_messages(
    collection_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0)
):
    """Obtenir les messages d'une collection partagée"""
    
    # Vérifier l'accès à la collection
    collection = db.query(models.Collection).filter(models.Collection.id == collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection non trouvée")
    
    # Vérifier que la collection est partagée
    if not collection.is_shared:
        raise HTTPException(status_code=400, detail="Cette collection n'est pas partagée")
    
    # Vérifier les permissions
    has_access = False
    if collection.owner_id == current_user.id:
        has_access = True
    else:
        user_collection = db.query(models.UserCollection).filter(
            and_(
                models.UserCollection.user_id == current_user.id,
                models.UserCollection.collection_id == collection_id,
                models.UserCollection.can_read == True
            )
        ).first()
        if user_collection:
            has_access = True
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    # Récupérer les messages avec les infos utilisateur
    messages = db.query(models.Message).filter(
        models.Message.collection_id == collection_id
    ).order_by(desc(models.Message.created_at)).offset(offset).limit(limit).all()
    
    # Transformer en format JSON avec infos utilisateur
    result = []
    for message in messages:
        result.append({
            "id": message.id,
            "collection_id": message.collection_id,
            "user_id": message.user_id,
            "content": message.content,
            "created_at": message.created_at.isoformat(),
            "user": {
                "id": message.user.id,
                "username": message.user.username,
                "first_name": message.user.first_name,
                "last_name": message.user.last_name
            }
        })
    
    return result

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_message(
    message_data: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un nouveau message dans une collection partagée"""
    
    collection_id = message_data.get("collection_id")
    content = message_data.get("content")
    
    if not collection_id or not content:
        raise HTTPException(status_code=400, detail="collection_id et content requis")
    
    # Vérifier l'accès à la collection
    collection = db.query(models.Collection).filter(
        models.Collection.id == collection_id
    ).first()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection non trouvée")
    
    # Vérifier que la collection est partagée
    if not collection.is_shared:
        raise HTTPException(status_code=400, detail="Cette collection n'est pas partagée")
    
    # Vérifier les permissions
    has_access = False
    can_comment = False
    
    if collection.owner_id == current_user.id:
        has_access = True
        can_comment = True
    else:
        user_collection = db.query(models.UserCollection).filter(
            and_(
                models.UserCollection.user_id == current_user.id,
                models.UserCollection.collection_id == collection_id,
                models.UserCollection.can_read == True
            )
        ).first()
        
        if user_collection:
            has_access = True
            can_comment = user_collection.can_comment
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    if not can_comment:
        raise HTTPException(status_code=403, detail="Vous n'avez pas l'autorisation d'envoyer des messages")
    
    # Créer le message
    db_message = models.Message(
        collection_id=collection_id,
        user_id=current_user.id,
        content=content
    )
    
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    # Retourner le message avec infos utilisateur
    return {
        "id": db_message.id,
        "collection_id": db_message.collection_id,
        "user_id": db_message.user_id,
        "content": db_message.content,
        "created_at": db_message.created_at.isoformat(),
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name
        }
    }

@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer un message"""
    
    # Récupérer le message
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message non trouvé")
    
    # Récupérer la collection
    collection = db.query(models.Collection).filter(
        models.Collection.id == message.collection_id
    ).first()
    
    # Vérifier les permissions (auteur ou propriétaire de la collection)
    if message.user_id != current_user.id and collection.owner_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Vous ne pouvez supprimer que vos propres messages"
        )
    
    db.delete(message)
    db.commit()
    
    return None
