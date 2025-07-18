from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Optional
from .. import models, schemas, auth
from ..database import get_db
from ..rss_parser import update_feed

router = APIRouter(prefix="/articles", tags=["articles"])

@router.get("/collection/{collection_id}", response_model=List[schemas.ArticleResponse])
def get_collection_articles(
    collection_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    feed_id: Optional[int] = Query(None),
    is_read: Optional[bool] = Query(None),
    is_favorite: Optional[bool] = Query(None),
    search: Optional[str] = Query(None)
):
    """Obtenir les articles d'une collection avec filtres"""
    
    # Vérifier l'accès à la collection
    collection = db.query(models.Collection).filter(models.Collection.id == collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection non trouvée")
    
    # Vérifier les permissions
    if collection.owner_id != current_user.id:
        user_collection = db.query(models.UserCollection).filter(
            and_(
                models.UserCollection.user_id == current_user.id,
                models.UserCollection.collection_id == collection_id,
                models.UserCollection.can_read == True
            )
        ).first()
        if not user_collection:
            raise HTTPException(status_code=403, detail="Accès refusé")
    
    # Construire la requête de base
    query = db.query(models.Article).join(models.RSSFeed).filter(
        models.RSSFeed.collection_id == collection_id
    )
    
    # Appliquer les filtres
    if feed_id:
        query = query.filter(models.Article.feed_id == feed_id)
    
    if search:
        query = query.filter(models.Article.title.ilike(f"%{search}%"))
    
    # Filtres par statut utilisateur
    if is_read is not None or is_favorite is not None:
        query = query.outerjoin(
            models.UserArticle,
            and_(
                models.UserArticle.article_id == models.Article.id,
                models.UserArticle.user_id == current_user.id
            )
        )
        
        if is_read is not None:
            if is_read:
                query = query.filter(models.UserArticle.is_read == True)
            else:
                query = query.filter(
                    (models.UserArticle.is_read == False) | 
                    (models.UserArticle.is_read.is_(None))
                )
        
        if is_favorite is not None:
            query = query.filter(models.UserArticle.is_favorite == is_favorite)
    
    # Ordre par date de publication décroissante
    query = query.order_by(desc(models.Article.published_date), desc(models.Article.fetched_at))
    
    # Pagination
    articles = query.offset(offset).limit(limit).all()
    
    # Ajouter les statuts utilisateur
    for article in articles:
        user_article = db.query(models.UserArticle).filter(
            and_(
                models.UserArticle.article_id == article.id,
                models.UserArticle.user_id == current_user.id
            )
        ).first()
        
        if user_article:
            article.is_read = user_article.is_read
            article.is_favorite = user_article.is_favorite
        else:
            article.is_read = False
            article.is_favorite = False
    
    return articles

@router.put("/{article_id}/status", response_model=schemas.UserArticleResponse)
def update_article_status(
    article_id: int,
    status_update: schemas.UserArticleUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour le statut d'un article pour l'utilisateur"""
    
    # Vérifier que l'article existe
    article = db.query(models.Article).filter(models.Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    # Chercher ou créer l'enregistrement UserArticle
    user_article = db.query(models.UserArticle).filter(
        and_(
            models.UserArticle.article_id == article_id,
            models.UserArticle.user_id == current_user.id
        )
    ).first()
    
    if not user_article:
        user_article = models.UserArticle(
            article_id=article_id,
            user_id=current_user.id,
            is_read=False,
            is_favorite=False
        )
        db.add(user_article)
    
    # Mettre à jour les statuts
    for field, value in status_update.dict(exclude_unset=True).items():
        setattr(user_article, field, value)
        if field == 'is_read' and value:
            user_article.read_at = datetime.utcnow()
        elif field == 'is_favorite' and value:
            user_article.favorited_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user_article)
    
    return user_article

@router.post("/refresh-feed/{feed_id}")
def refresh_feed(
    feed_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Forcer la mise à jour d'un flux RSS"""
    
    # Vérifier que le flux existe et que l'utilisateur a accès
    feed = db.query(models.RSSFeed).filter(models.RSSFeed.id == feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Flux RSS non trouvé")
    
    # Vérifier l'accès à la collection
    collection = db.query(models.Collection).filter(models.Collection.id == feed.collection_id).first()
    if collection.owner_id != current_user.id:
        user_collection = db.query(models.UserCollection).filter(
            and_(
                models.UserCollection.user_id == current_user.id,
                models.UserCollection.collection_id == feed.collection_id,
                models.UserCollection.can_read == True
            )
        ).first()
        if not user_collection:
            raise HTTPException(status_code=403, detail="Accès refusé")
    
    # Lancer la mise à jour
    result = update_feed(feed_id)
    
    return {
        "message": "Mise à jour lancée",
        "result": result
    }