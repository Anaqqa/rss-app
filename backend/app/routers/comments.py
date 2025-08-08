from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/comments", tags=["comments"])

@router.get("/article/{article_id}")
def get_article_comments(
    article_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(20, le=50),
    offset: int = Query(0, ge=0)
):
    """Obtenir les commentaires d'un article"""
    
    # Vérifier que l'article existe
    article = db.query(models.Article).join(models.RSSFeed).filter(
        models.Article.id == article_id
    ).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    collection = article.feed.collection
    
    # Vérifier l'accès à la collection
    has_access = False
    if collection.owner_id == current_user.id:
        has_access = True
    else:
        user_collection = db.query(models.UserCollection).filter(
            and_(
                models.UserCollection.user_id == current_user.id,
                models.UserCollection.collection_id == collection.id,
                models.UserCollection.can_read == True
            )
        ).first()
        if user_collection:
            has_access = True
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    # Récupérer les commentaires
    comments = db.query(models.Comment).filter(
        models.Comment.article_id == article_id
    ).order_by(desc(models.Comment.created_at)).offset(offset).limit(limit).all()
    
    # Transformer en format JSON
    result = []
    for comment in comments:
        result.append({
            "id": comment.id,
            "article_id": comment.article_id,
            "user_id": comment.user_id,
            "collection_id": comment.collection_id,
            "content": comment.content,
            "created_at": comment.created_at.isoformat(),
            "updated_at": comment.updated_at.isoformat(),
            "user": {
                "id": comment.user.id,
                "username": comment.user.username,
                "first_name": comment.user.first_name,
                "last_name": comment.user.last_name
            }
        })
    
    return result

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_comment(
    comment_data: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un nouveau commentaire sur un article"""
    
    article_id = comment_data.get("article_id")
    collection_id = comment_data.get("collection_id")
    content = comment_data.get("content")
    
    if not article_id or not collection_id or not content:
        raise HTTPException(status_code=400, detail="article_id, collection_id et content requis")
    
    # Vérifier que l'article existe
    article = db.query(models.Article).join(models.RSSFeed).filter(
        models.Article.id == article_id
    ).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    # Vérifier que la collection correspond
    if article.feed.collection_id != collection_id:
        raise HTTPException(status_code=400, detail="L'article n'appartient pas à cette collection")
    
    # Récupérer la collection
    collection = db.query(models.Collection).filter(
        models.Collection.id == collection_id
    ).first()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection non trouvée")
    
    # Vérifier que la collection est partagée
    if not collection.is_shared:
        raise HTTPException(status_code=400, detail="Les commentaires ne sont disponibles que sur les collections partagées")
    
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
        raise HTTPException(status_code=403, detail="Vous n'avez pas l'autorisation de commenter")
    
    # Créer le commentaire
    db_comment = models.Comment(
        article_id=article_id,
        collection_id=collection_id,
        user_id=current_user.id,
        content=content
    )
    
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    # Retourner le commentaire avec infos utilisateur
    return {
        "id": db_comment.id,
        "article_id": db_comment.article_id,
        "user_id": db_comment.user_id,
        "collection_id": db_comment.collection_id,
        "content": db_comment.content,
        "created_at": db_comment.created_at.isoformat(),
        "updated_at": db_comment.updated_at.isoformat(),
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name
        }
    }