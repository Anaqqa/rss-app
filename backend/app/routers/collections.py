from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/collections", tags=["collections"])

@router.get("/", response_model=List[schemas.CollectionResponse])
def get_user_collections(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir toutes les collections de l'utilisateur"""
    # Collections possédées
    owned_collections = db.query(models.Collection).filter(
        models.Collection.owner_id == current_user.id
    ).all()
    
    # Collections partagées où l'utilisateur a accès
    shared_collections = db.query(models.Collection).join(models.UserCollection).filter(
        and_(
            models.UserCollection.user_id == current_user.id,
            models.UserCollection.can_read == True,
            models.Collection.owner_id != current_user.id
        )
    ).all()
    
    return owned_collections + shared_collections

@router.post("/", response_model=schemas.CollectionResponse, status_code=status.HTTP_201_CREATED)
def create_collection(
    collection_data: schemas.CollectionCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle collection"""
    db_collection = models.Collection(
        name=collection_data.name,
        description=collection_data.description,
        is_shared=collection_data.is_shared,
        owner_id=current_user.id
    )
    
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    
    return db_collection

@router.get("/{collection_id}", response_model=schemas.CollectionResponse)
def get_collection(
    collection_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir une collection spécifique"""
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
    
    return collection

@router.put("/{collection_id}", response_model=schemas.CollectionResponse)
def update_collection(
    collection_id: int,
    collection_update: schemas.CollectionUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour une collection"""
    collection = db.query(models.Collection).filter(models.Collection.id == collection_id).first()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection non trouvée")
    
    # Seul le propriétaire peut modifier
    if collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Seul le propriétaire peut modifier la collection")
    
    # Mettre à jour les champs
    for field, value in collection_update.dict(exclude_unset=True).items():
        setattr(collection, field, value)
    
    db.commit()
    db.refresh(collection)
    
    return collection

@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(
    collection_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer une collection"""
    collection = db.query(models.Collection).filter(models.Collection.id == collection_id).first()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection non trouvée")
    
    # Seul le propriétaire peut supprimer
    if collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Seul le propriétaire peut supprimer la collection")
    
    db.delete(collection)
    db.commit()
    
    return None