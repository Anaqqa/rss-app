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
    
    feeds = db.query(models.RSSFeed).filter(models.RSSFeed.collection_id == collection_id).all()
    return feeds

@router.post("/", response_model=schemas.RSSFeedResponse, status_code=status.HTTP_201_CREATED)
def create_feed(
    feed_data: schemas.RSSFeedCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Ajouter un flux RSS à une collection"""
    # Vérifier que l'URL n'existe pas déjà
    if db.query(models.RSSFeed).filter(models.RSSFeed.url == feed_data.url).first():
        raise HTTPException(status_code=400, detail="Ce flux RSS existe déjà")
    
    # Vérifier l'accès à la collection
    collection = db.query(models.Collection).filter(models.Collection.id == feed_data.collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection non trouvée")
    
    # Vérifier les permissions d'ajout
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
    
    # Créer le flux RSS
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
def update_feed(
    feed_id: int,
    feed_update: schemas.RSSFeedUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour un flux RSS"""
    feed = db.query(models.RSSFeed).filter(models.RSSFeed.id == feed_id).first()
    
    if not feed:
        raise HTTPException(status_code=404, detail="Flux RSS non trouvé")
    
    # Vérifier les permissions
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
    
    # Mettre à jour les champs
    for field, value in feed_update.dict(exclude_unset=True).items():
        if field != "category_ids":  # On gère les catégories séparément
            setattr(feed, field, value)
    
    db.commit()
    db.refresh(feed)
    
    return feed

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
    
    # Vérifier les permissions
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