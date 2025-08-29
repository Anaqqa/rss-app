
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
    
    owned_collections = db.query(models.Collection).filter(
        models.Collection.owner_id == current_user.id
    ).all()
    
    
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
    
    
    if collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Seul le propriétaire peut modifier la collection")
    
    
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
    
    
    if collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Seul le propriétaire peut supprimer la collection")
    
    db.delete(collection)
    db.commit()
    
    return None



@router.get("/{collection_id}/members")
def get_collection_members(
    collection_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir les membres d'une collection partagée"""
    
    
    collection = db.query(models.Collection).filter(models.Collection.id == collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection non trouvée")
    
    
    if collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Seul le propriétaire peut voir les membres")
    
    
    members = db.query(models.UserCollection).filter(
        models.UserCollection.collection_id == collection_id
    ).all()
    
    result = []
    for member in members:
        result.append({
            "id": member.id,
            "user_id": member.user_id,
            "user": {
                "id": member.user.id,
                "username": member.user.username,
                "email": member.user.email,
                "first_name": member.user.first_name,
                "last_name": member.user.last_name
            },
            "permissions": {
                "can_read": member.can_read,
                "can_add_feeds": member.can_add_feeds,
                "can_edit_feeds": member.can_edit_feeds,
                "can_delete_feeds": member.can_delete_feeds,
                "can_comment": member.can_comment
            },
            "joined_at": member.joined_at.isoformat()
        })
    
    return result

@router.post("/{collection_id}/invite")
def invite_user_to_collection(
    collection_id: int,
    invite_data: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Inviter un utilisateur à rejoindre une collection partagée"""
    
    username = invite_data.get("username")
    permissions = invite_data.get("permissions", {})
    
    if not username:
        raise HTTPException(status_code=400, detail="Nom d'utilisateur requis")
    
    
    collection = db.query(models.Collection).filter(models.Collection.id == collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection non trouvée")
    
    
    if collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Seul le propriétaire peut inviter des membres")
    
    
    if not collection.is_shared:
        raise HTTPException(status_code=400, detail="Cette collection n'est pas partagée")
    
    
    user_to_invite = db.query(models.User).filter(models.User.username == username).first()
    if not user_to_invite:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    
    existing_member = db.query(models.UserCollection).filter(
        and_(
            models.UserCollection.user_id == user_to_invite.id,
            models.UserCollection.collection_id == collection_id
        )
    ).first()
    
    if existing_member:
        raise HTTPException(status_code=400, detail="Cet utilisateur est déjà membre de cette collection")
    
    
    if user_to_invite.id == current_user.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous inviter vous-même")
    
    
    new_member = models.UserCollection(
        user_id=user_to_invite.id,
        collection_id=collection_id,
        can_read=permissions.get("can_read", True),
        can_add_feeds=permissions.get("can_add_feeds", False),
        can_edit_feeds=permissions.get("can_edit_feeds", False),
        can_delete_feeds=permissions.get("can_delete_feeds", False),
        can_comment=permissions.get("can_comment", True)
    )
    
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    return {
        "message": f"Utilisateur {username} invité avec succès",
        "member": {
            "id": new_member.id,
            "user_id": new_member.user_id,
            "username": user_to_invite.username,
            "permissions": {
                "can_read": new_member.can_read,
                "can_add_feeds": new_member.can_add_feeds,
                "can_edit_feeds": new_member.can_edit_feeds,
                "can_delete_feeds": new_member.can_delete_feeds,
                "can_comment": new_member.can_comment
            }
        }
    }

@router.delete("/{collection_id}/members/{member_id}")
def remove_member_from_collection(
    collection_id: int,
    member_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Retirer un membre d'une collection partagée"""
    
    
    collection = db.query(models.Collection).filter(models.Collection.id == collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection non trouvée")
    
    
    if collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Seul le propriétaire peut retirer des membres")
    
    
    member = db.query(models.UserCollection).filter(
        and_(
            models.UserCollection.id == member_id,
            models.UserCollection.collection_id == collection_id
        )
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Membre non trouvé")
    
    db.delete(member)
    db.commit()
    
    return {"message": "Membre retiré avec succès"}

@router.put("/{collection_id}/members/{member_id}/permissions")
def update_member_permissions(
    collection_id: int,
    member_id: int,
    permissions_data: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour les permissions d'un membre"""
    
    
    collection = db.query(models.Collection).filter(models.Collection.id == collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection non trouvée")
    
    
    if collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Seul le propriétaire peut modifier les permissions")
    
    
    member = db.query(models.UserCollection).filter(
        and_(
            models.UserCollection.id == member_id,
            models.UserCollection.collection_id == collection_id
        )
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Membre non trouvé")
    
    
    permissions = permissions_data.get("permissions", {})
    member.can_read = permissions.get("can_read", member.can_read)
    member.can_add_feeds = permissions.get("can_add_feeds", member.can_add_feeds)
    member.can_edit_feeds = permissions.get("can_edit_feeds", member.can_edit_feeds)
    member.can_delete_feeds = permissions.get("can_delete_feeds", member.can_delete_feeds)
    member.can_comment = permissions.get("can_comment", member.can_comment)
    
    db.commit()
    db.refresh(member)
    
    return {
        "message": "Permissions mises à jour",
        "permissions": {
            "can_read": member.can_read,
            "can_add_feeds": member.can_add_feeds,
            "can_edit_feeds": member.can_edit_feeds,
            "can_delete_feeds": member.can_delete_feeds,
            "can_comment": member.can_comment
        }
    }