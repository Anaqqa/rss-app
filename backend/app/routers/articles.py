# backend/app/routers/articles.py - Version complète avec recherche
from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, or_
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
    """Obtenir les articles d'une collection avec filtres et recherche plein texte"""
    
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
    
    # Construction de la requête de base
    query = db.query(models.Article).join(models.RSSFeed).filter(
        models.RSSFeed.collection_id == collection_id
    )
    
    # Filtrage par flux spécifique
    if feed_id:
        query = query.filter(models.Article.feed_id == feed_id)
    
    # RECHERCHE PLEIN TEXTE
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Article.title.ilike(search_term),
                models.Article.description.ilike(search_term),
                models.Article.content.ilike(search_term),
                models.Article.author.ilike(search_term),
                models.RSSFeed.title.ilike(search_term)
            )
        )
    
    # Jointure avec UserArticle pour les filtres lu/non lu et favoris
    query = query.outerjoin(
        models.UserArticle,
        and_(
            models.UserArticle.article_id == models.Article.id,
            models.UserArticle.user_id == current_user.id
        )
    )
    
    # Filtrage par statut lu/non lu
    if is_read is not None:
        if is_read:
            query = query.filter(models.UserArticle.is_read == True)
        else:
            query = query.filter(
                or_(
                    models.UserArticle.is_read == False,
                    models.UserArticle.is_read.is_(None)
                )
            )
    
    # Filtrage par favoris
    if is_favorite is not None:
        if is_favorite:
            query = query.filter(models.UserArticle.is_favorite == True)
        else:
            query = query.filter(
                or_(
                    models.UserArticle.is_favorite == False,
                    models.UserArticle.is_favorite.is_(None)
                )
            )
    
    # Trier par date de publication (plus récent en premier)
    query = query.order_by(desc(models.Article.published_date))
    
    # Pagination
    articles = query.offset(offset).limit(limit).all()
    
    # Enrichir avec les données utilisateur
    result = []
    for article in articles:
        user_article = db.query(models.UserArticle).filter(
            and_(
                models.UserArticle.article_id == article.id,
                models.UserArticle.user_id == current_user.id
            )
        ).first()
        
        article_dict = {
            "id": article.id,
            "feed_id": article.feed_id,
            "title": article.title,
            "link": article.link,
            "description": article.description,
            "content": article.content,
            "author": article.author,
            "published_date": article.published_date,
            "guid": article.guid,
            "fetched_at": article.fetched_at,
            "is_read": user_article.is_read if user_article else False,
            "is_favorite": user_article.is_favorite if user_article else False
        }
        result.append(article_dict)
    
    return result

@router.put("/{article_id}/status")
def update_article_status(
    article_id: int,
    status_update: schemas.UserArticleUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour le statut d'un article (lu/non lu, favori)"""
    
    # Vérifier que l'article existe
    article = db.query(models.Article).filter(models.Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    # Vérifier l'accès à la collection
    collection = db.query(models.Collection).join(models.RSSFeed).filter(
        models.RSSFeed.id == article.feed_id
    ).first()
    
    if collection.owner_id != current_user.id:
        user_collection = db.query(models.UserCollection).filter(
            and_(
                models.UserCollection.user_id == current_user.id,
                models.UserCollection.collection_id == collection.id,
                models.UserCollection.can_read == True
            )
        ).first()
        if not user_collection:
            raise HTTPException(status_code=403, detail="Accès refusé")
    
    # Chercher ou créer l'enregistrement UserArticle
    user_article = db.query(models.UserArticle).filter(
        and_(
            models.UserArticle.user_id == current_user.id,
            models.UserArticle.article_id == article_id
        )
    ).first()
    
    if not user_article:
        user_article = models.UserArticle(
            user_id=current_user.id,
            article_id=article_id,
            is_read=False,
            is_favorite=False
        )
        db.add(user_article)
    
    # Mettre à jour les statuts
    if status_update.is_read is not None:
        user_article.is_read = status_update.is_read
        user_article.read_at = datetime.utcnow() if status_update.is_read else None
    
    if status_update.is_favorite is not None:
        user_article.is_favorite = status_update.is_favorite
        user_article.favorited_at = datetime.utcnow() if status_update.is_favorite else None
    
    db.commit()
    db.refresh(user_article)
    
    return {"message": "Statut mis à jour avec succès"}

@router.get("/search", response_model=List[schemas.ArticleResponse])
def search_articles_global(
    search: str = Query(..., min_length=2),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0)
):
    """Recherche globale dans tous les articles accessibles par l'utilisateur"""
    
    # Collections accessibles par l'utilisateur
    owned_collections = db.query(models.Collection.id).filter(
        models.Collection.owner_id == current_user.id
    ).subquery()
    
    shared_collections = db.query(models.Collection.id).join(models.UserCollection).filter(
        and_(
            models.UserCollection.user_id == current_user.id,
            models.UserCollection.can_read == True
        )
    ).subquery()
    
    # Recherche dans les articles
    search_term = f"%{search.strip()}%"
    
    query = db.query(models.Article).join(models.RSSFeed).join(models.Collection).filter(
        or_(
            models.Collection.id.in_(owned_collections),
            models.Collection.id.in_(shared_collections)
        )
    ).filter(
        or_(
            models.Article.title.ilike(search_term),
            models.Article.description.ilike(search_term),
            models.Article.content.ilike(search_term),
            models.Article.author.ilike(search_term),
            models.RSSFeed.title.ilike(search_term)
        )
    ).order_by(desc(models.Article.published_date))
    
    articles = query.offset(offset).limit(limit).all()
    
    # Enrichir avec les données utilisateur
    result = []
    for article in articles:
        user_article = db.query(models.UserArticle).filter(
            and_(
                models.UserArticle.article_id == article.id,
                models.UserArticle.user_id == current_user.id
            )
        ).first()
        
        article_dict = {
            "id": article.id,
            "feed_id": article.feed_id,
            "title": article.title,
            "link": article.link,
            "description": article.description,
            "content": article.content,
            "author": article.author,
            "published_date": article.published_date,
            "guid": article.guid,
            "fetched_at": article.fetched_at,
            "is_read": user_article.is_read if user_article else False,
            "is_favorite": user_article.is_favorite if user_article else False
        }
        result.append(article_dict)
    
    return result