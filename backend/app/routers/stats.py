# backend/app/routers/stats.py - Nouvelles routes pour les statistiques
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Dict
from .. import models, auth
from ..database import get_db

router = APIRouter(prefix="/stats", tags=["statistics"])

@router.get("/dashboard")
def get_dashboard_stats(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """Obtenir les statistiques pour le dashboard"""
    
    # Collections possédées
    owned_collections_count = db.query(models.Collection).filter(
        models.Collection.owner_id == current_user.id
    ).count()
    
    # Collections partagées accessibles
    shared_collections_count = db.query(models.Collection).join(models.UserCollection).filter(
        and_(
            models.UserCollection.user_id == current_user.id,
            models.UserCollection.can_read == True,
            models.Collection.owner_id != current_user.id
        )
    ).count()
    
    total_collections = owned_collections_count + shared_collections_count
    
    # Flux RSS accessibles
    owned_feeds = db.query(models.RSSFeed).join(models.Collection).filter(
        models.Collection.owner_id == current_user.id
    )
    
    shared_feeds = db.query(models.RSSFeed).join(models.Collection).join(models.UserCollection).filter(
        and_(
            models.UserCollection.user_id == current_user.id,
            models.UserCollection.can_read == True,
            models.Collection.owner_id != current_user.id
        )
    )
    
    total_feeds = owned_feeds.count() + shared_feeds.count()
    
    # Articles accessibles
    owned_articles = db.query(models.Article).join(models.RSSFeed).join(models.Collection).filter(
        models.Collection.owner_id == current_user.id
    )
    
    shared_articles = db.query(models.Article).join(models.RSSFeed).join(models.Collection).join(models.UserCollection).filter(
        and_(
            models.UserCollection.user_id == current_user.id,
            models.UserCollection.can_read == True,
            models.Collection.owner_id != current_user.id
        )
    )
    
    total_articles = owned_articles.count() + shared_articles.count()
    
    # Articles non lus (ceux qui n'ont pas d'entrée UserArticle ou is_read = False)
    read_articles = db.query(models.UserArticle).filter(
        and_(
            models.UserArticle.user_id == current_user.id,
            models.UserArticle.is_read == True
        )
    ).count()
    
    unread_articles = total_articles - read_articles
    
    # Articles favoris
    favorite_articles = db.query(models.UserArticle).filter(
        and_(
            models.UserArticle.user_id == current_user.id,
            models.UserArticle.is_favorite == True
        )
    ).count()
    
    # Statistiques sur les flux
    active_feeds = owned_feeds.filter(models.RSSFeed.is_active == True).count() + \
                  shared_feeds.filter(models.RSSFeed.is_active == True).count()
    
    # Derniers articles (5 plus récents)
    recent_articles_query = db.query(models.Article).join(models.RSSFeed).join(models.Collection).filter(
        models.Collection.owner_id == current_user.id
    ).union(
        db.query(models.Article).join(models.RSSFeed).join(models.Collection).join(models.UserCollection).filter(
            and_(
                models.UserCollection.user_id == current_user.id,
                models.UserCollection.can_read == True,
                models.Collection.owner_id != current_user.id
            )
        )
    ).order_by(models.Article.published_date.desc()).limit(5)
    
    recent_articles = []
    for article in recent_articles_query:
        user_article = db.query(models.UserArticle).filter(
            and_(
                models.UserArticle.article_id == article.id,
                models.UserArticle.user_id == current_user.id
            )
        ).first()
        
        recent_articles.append({
            "id": article.id,
            "title": article.title,
            "link": article.link,
            "published_date": article.published_date,
            "feed_title": article.feed.title,
            "is_read": user_article.is_read if user_article else False,
            "is_favorite": user_article.is_favorite if user_article else False
        })
    
    return {
        "collections": {
            "total": total_collections,
            "owned": owned_collections_count,
            "shared": shared_collections_count
        },
        "feeds": {
            "total": total_feeds,
            "active": active_feeds,
            "inactive": total_feeds - active_feeds
        },
        "articles": {
            "total": total_articles,
            "unread": unread_articles,
            "read": read_articles,
            "favorites": favorite_articles
        },
        "recent_articles": recent_articles
    }

@router.get("/collection/{collection_id}")
def get_collection_stats(
    collection_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """Obtenir les statistiques d'une collection spécifique"""
    
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
    
    # Statistiques de la collection
    feeds_count = db.query(models.RSSFeed).filter(models.RSSFeed.collection_id == collection_id).count()
    active_feeds_count = db.query(models.RSSFeed).filter(
        and_(
            models.RSSFeed.collection_id == collection_id,
            models.RSSFeed.is_active == True
        )
    ).count()
    
    articles_count = db.query(models.Article).join(models.RSSFeed).filter(
        models.RSSFeed.collection_id == collection_id
    ).count()
    
    # Articles lus par l'utilisateur dans cette collection
    read_articles_count = db.query(models.UserArticle).join(models.Article).join(models.RSSFeed).filter(
        and_(
            models.RSSFeed.collection_id == collection_id,
            models.UserArticle.user_id == current_user.id,
            models.UserArticle.is_read == True
        )
    ).count()
    
    unread_articles_count = articles_count - read_articles_count
    
    # Articles favoris dans cette collection
    favorite_articles_count = db.query(models.UserArticle).join(models.Article).join(models.RSSFeed).filter(
        and_(
            models.RSSFeed.collection_id == collection_id,
            models.UserArticle.user_id == current_user.id,
            models.UserArticle.is_favorite == True
        )
    ).count()
    
    # Statistiques par flux dans la collection
    feeds_stats = []
    feeds = db.query(models.RSSFeed).filter(models.RSSFeed.collection_id == collection_id).all()
    
    for feed in feeds:
        feed_articles_count = db.query(models.Article).filter(models.Article.feed_id == feed.id).count()
        
        feed_read_articles = db.query(models.UserArticle).join(models.Article).filter(
            and_(
                models.Article.feed_id == feed.id,
                models.UserArticle.user_id == current_user.id,
                models.UserArticle.is_read == True
            )
        ).count()
        
        feeds_stats.append({
            "feed_id": feed.id,
            "feed_title": feed.title,
            "total_articles": feed_articles_count,
            "read_articles": feed_read_articles,
            "unread_articles": feed_articles_count - feed_read_articles,
            "is_active": feed.is_active,
            "last_updated": feed.last_updated,
            "last_fetch_status": feed.last_fetch_status
        })
    
    return {
        "collection_id": collection_id,
        "collection_name": collection.name,
        "feeds": {
            "total": feeds_count,
            "active": active_feeds_count,
            "inactive": feeds_count - active_feeds_count
        },
        "articles": {
            "total": articles_count,
            "read": read_articles_count,
            "unread": unread_articles_count,
            "favorites": favorite_articles_count
        },
        "feeds_details": feeds_stats
    }