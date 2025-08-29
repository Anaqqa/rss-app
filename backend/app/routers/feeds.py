from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/feeds", tags=["feeds"])

@router.get("/collection/{collection_id}", response_model=List[schemas.RSSFeedResponse])
def get_collection_feeds(
    collection_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir tous les flux RSS d'une collection"""
    
    collection = db.query(models.Collection).filter(models.Collection.id == collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection non trouvée")
    
    
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
    
    feeds = db.query(models.RSSFeed).filter(models.RSSFeed.collection_id == collection_id).all()
    return feeds

@router.post("/", response_model=schemas.RSSFeedResponse, status_code=status.HTTP_201_CREATED)
def create_feed(
    feed_data: schemas.RSSFeedCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Ajouter un flux RSS à une collection"""
    
    if db.query(models.RSSFeed).filter(models.RSSFeed.url == feed_data.url).first():
        raise HTTPException(status_code=400, detail="Ce flux RSS existe déjà")
    
    
    collection = db.query(models.Collection).filter(models.Collection.id == feed_data.collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection non trouvée")
    
    
    if collection.owner_id != current_user.id:
        user_collection = db.query(models.UserCollection).filter(
            and_(
                models.UserCollection.user_id == current_user.id,
                models.UserCollection.collection_id == feed_data.collection_id,
                models.UserCollection.can_add_feeds == True
            )
        ).first()
        if not user_collection:
            raise HTTPException(status_code=403, detail="Pas d'autorisation pour ajouter des flux")
    
    
    db_feed = models.RSSFeed(
        collection_id=feed_data.collection_id,
        title=feed_data.title,
        url=feed_data.url,
        description=feed_data.description,
        site_url=feed_data.site_url,
        update_frequency=feed_data.update_frequency,
        is_active=feed_data.is_active,
        added_by_user_id=current_user.id
    )
    
    db.add(db_feed)
    db.commit()
    db.refresh(db_feed)
    
    return db_feed

@router.put("/{feed_id}", response_model=schemas.RSSFeedResponse)
def update_feed_settings(
    feed_id: int,
    feed_update: schemas.RSSFeedUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour les paramètres d'un flux RSS"""
    feed = db.query(models.RSSFeed).filter(models.RSSFeed.id == feed_id).first()
    
    if not feed:
        raise HTTPException(status_code=404, detail="Flux RSS non trouvé")
    
    
    collection = db.query(models.Collection).filter(models.Collection.id == feed.collection_id).first()
    if collection.owner_id != current_user.id and feed.added_by_user_id != current_user.id:
        user_collection = db.query(models.UserCollection).filter(
            and_(
                models.UserCollection.user_id == current_user.id,
                models.UserCollection.collection_id == feed.collection_id,
                models.UserCollection.can_edit_feeds == True
            )
        ).first()
        if not user_collection:
            raise HTTPException(status_code=403, detail="Pas d'autorisation pour modifier ce flux")
    
    
    for field, value in feed_update.dict(exclude_unset=True).items():
        setattr(feed, field, value)
    
    db.commit()
    db.refresh(feed)
    
    return feed

@router.post("/{feed_id}/update")
def update_feed_content(
    feed_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Forcer la mise à jour du contenu d'un flux RSS (récupérer de nouveaux articles)"""
    
    
    feed = db.query(models.RSSFeed).filter(models.RSSFeed.id == feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Flux RSS non trouvé")
    
    
    collection = db.query(models.Collection).filter(models.Collection.id == feed.collection_id).first()
    if collection.owner_id != current_user.id and feed.added_by_user_id != current_user.id:
        user_collection = db.query(models.UserCollection).filter(
            and_(
                models.UserCollection.user_id == current_user.id,
                models.UserCollection.collection_id == feed.collection_id,
                models.UserCollection.can_edit_feeds == True
            )
        ).first()
        if not user_collection:
            raise HTTPException(status_code=403, detail="Pas d'autorisation pour mettre à jour ce flux")
    
    try:
        
        import feedparser
        import requests
        from datetime import datetime
        from sqlalchemy.sql import func
        
        
        response = requests.get(feed.url, timeout=30)
        response.raise_for_status()
        
        
        parsed_feed = feedparser.parse(response.content)
        
        if parsed_feed.bozo:
            raise HTTPException(status_code=400, detail=f"Flux RSS invalide: {parsed_feed.bozo_exception}")
        
        
        new_articles_count = 0
        
        
        for entry in parsed_feed.entries:
            
            article_guid = getattr(entry, 'id', entry.link)
            
            
            existing_article = db.query(models.Article).filter(
                and_(
                    models.Article.feed_id == feed.id,
                    models.Article.guid == article_guid
                )
            ).first()
            
            if existing_article:
                continue  
            
            
            title = getattr(entry, 'title', 'Sans titre')
            link = getattr(entry, 'link', '')
            description = getattr(entry, 'description', '') or getattr(entry, 'summary', '')
            author = getattr(entry, 'author', None)
            
            
            published_date = None
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                try:
                    published_date = datetime(*entry.published_parsed[:6])
                except (TypeError, ValueError):
                    pass
            
            
            new_article = models.Article(
                feed_id=feed.id,
                title=title[:300],  
                link=link[:500],    
                description=description,
                author=author[:100] if author else None,  
                published_date=published_date,
                guid=article_guid[:500],  
                fetched_at=func.now()
            )
            
            db.add(new_article)
            new_articles_count += 1
        
        
        feed.last_updated = func.now()
        feed.last_fetch_status = 'success'
        feed.error_message = None
        
        db.commit()
        
        return {
            "message": f"Flux mis à jour avec succès",
            "new_articles_count": new_articles_count,
            "total_entries": len(parsed_feed.entries),
            "feed_title": feed.title,
            "last_updated": datetime.now().isoformat()
        }
        
    except requests.RequestException as e:
        
        feed.last_fetch_status = 'error'
        feed.error_message = f"Erreur de récupération: {str(e)}"
        db.commit()
        raise HTTPException(status_code=400, detail=f"Impossible de récupérer le flux: {str(e)}")
    
    except Exception as e:
        
        feed.last_fetch_status = 'error' 
        feed.error_message = f"Erreur de parsing: {str(e)}"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour: {str(e)}")

@router.delete("/{feed_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feed(
    feed_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer un flux RSS"""
    feed = db.query(models.RSSFeed).filter(models.RSSFeed.id == feed_id).first()
    
    if not feed:
        raise HTTPException(status_code=404, detail="Flux RSS non trouvé")
    
    
    collection = db.query(models.Collection).filter(models.Collection.id == feed.collection_id).first()
    if collection.owner_id != current_user.id and feed.added_by_user_id != current_user.id:
        user_collection = db.query(models.UserCollection).filter(
            and_(
                models.UserCollection.user_id == current_user.id,
                models.UserCollection.collection_id == feed.collection_id,
                models.UserCollection.can_delete_feeds == True
            )
        ).first()
        if not user_collection:
            raise HTTPException(status_code=403, detail="Pas d'autorisation pour supprimer ce flux")
    
    db.delete(feed)
    db.commit()
    
    return None