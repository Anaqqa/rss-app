from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile ,File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json
import csv
import xml.etree.ElementTree as ET
from io import StringIO
from .. import models, auth
from ..database import get_db

router = APIRouter(prefix="/export", tags=["export"])

@router.get("/opml")
def export_opml(
    collection_ids: str = None,  
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Exporter les flux RSS au format OPML"""
    
    
    query = db.query(models.RSSFeed).join(models.Collection)
    
    if collection_ids:
        collection_id_list = [int(id.strip()) for id in collection_ids.split(',')]
        query = query.filter(models.RSSFeed.collection_id.in_(collection_id_list))
    
    
    query = query.filter(
        (models.Collection.owner_id == current_user.id) |
        (models.Collection.id.in_(
            db.query(models.UserCollection.collection_id).filter(
                models.UserCollection.user_id == current_user.id
            )
        ))
    )
    
    feeds = query.all()
    
    
    opml = ET.Element("opml", version="2.0")
    head = ET.SubElement(opml, "head")
    
    title = ET.SubElement(head, "title")
    title.text = f"RSS Feeds Export - {current_user.username}"
    
    date_created = ET.SubElement(head, "dateCreated")
    date_created.text = datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT")
    
    body = ET.SubElement(opml, "body")
    
    
    collections_data = {}
    for feed in feeds:
        collection = feed.collection
        if collection.id not in collections_data:
            collections_data[collection.id] = {
                'name': collection.name,
                'feeds': []
            }
        collections_data[collection.id]['feeds'].append(feed)
    
    
    for collection_data in collections_data.values():
        outline = ET.SubElement(body, "outline", text=collection_data['name'])
        
        for feed in collection_data['feeds']:
            feed_outline = ET.SubElement(
                outline, 
                "outline",
                type="rss",
                text=feed.title,
                xmlUrl=feed.url
            )
            if feed.site_url:
                feed_outline.set("htmlUrl", feed.site_url)
            if feed.description:
                feed_outline.set("description", feed.description)
    
    
    xml_str = ET.tostring(opml, encoding='unicode')
    
    
    return Response(
        content=xml_str,
        media_type="application/xml",
        headers={"Content-Disposition": "attachment; filename=rss_feeds.opml"}
    )

@router.get("/json")
def export_json(
    collection_ids: str = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Exporter les flux RSS au format JSON"""
    
    
    query = db.query(models.RSSFeed).join(models.Collection)
    
    if collection_ids:
        collection_id_list = [int(id.strip()) for id in collection_ids.split(',')]
        query = query.filter(models.RSSFeed.collection_id.in_(collection_id_list))
    
    query = query.filter(
        (models.Collection.owner_id == current_user.id) |
        (models.Collection.id.in_(
            db.query(models.UserCollection.collection_id).filter(
                models.UserCollection.user_id == current_user.id
            )
        ))
    )
    
    feeds = query.all()
    
    
    export_data = {
        "export_info": {
            "user": current_user.username,
            "exported_at": datetime.utcnow().isoformat(),
            "format": "RSS Aggregator JSON v1.0"
        },
        "collections": []
    }
    
    
    collections_data = {}
    for feed in feeds:
        collection = feed.collection
        if collection.id not in collections_data:
            collections_data[collection.id] = {
                'id': collection.id,
                'name': collection.name,
                'description': collection.description,
                'is_shared': collection.is_shared,
                'feeds': []
            }
        
        collections_data[collection.id]['feeds'].append({
            'id': feed.id,
            'title': feed.title,
            'url': feed.url,
            'description': feed.description,
            'site_url': feed.site_url,
            'update_frequency': feed.update_frequency,
            'is_active': feed.is_active,
            'created_at': feed.created_at.isoformat() if feed.created_at else None
        })
    
    export_data['collections'] = list(collections_data.values())
    
    
    json_str = json.dumps(export_data, indent=2, ensure_ascii=False)
    
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=rss_feeds.json"}
    )

@router.get("/csv")
def export_csv(
    collection_ids: str = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Exporter les flux RSS au format CSV"""
    
    
    query = db.query(models.RSSFeed).join(models.Collection)
    
    if collection_ids:
        collection_id_list = [int(id.strip()) for id in collection_ids.split(',')]
        query = query.filter(models.RSSFeed.collection_id.in_(collection_id_list))
    
    query = query.filter(
        (models.Collection.owner_id == current_user.id) |
        (models.Collection.id.in_(
            db.query(models.UserCollection.collection_id).filter(
                models.UserCollection.user_id == current_user.id
            )
        ))
    )
    
    feeds = query.all()
    
    
    csv_lines = []
    csv_lines.append("Collection Name,Feed Title,RSS URL,Site URL,Description,Update Frequency")
    
    for feed in feeds:
        collection_name = feed.collection.name.replace('"', '""')  
        feed_title = feed.title.replace('"', '""')
        description = (feed.description or '').replace('"', '""')
        site_url = feed.site_url or ''
        
        
        csv_lines.append(f'"{collection_name}","{feed_title}","{feed.url}","{site_url}","{description}",{feed.update_frequency}')
    
    csv_content = '\n'.join(csv_lines)
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=rss_feeds.csv"}
    )    

@router.post("/import/opml")
async def import_opml(
    file: UploadFile = File(...),
    collection_id: int = None,  
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Importer des flux RSS depuis un fichier OPML"""
    
    if not file.filename.endswith('.opml'):
        raise HTTPException(status_code=400, detail="Le fichier doit être au format .opml")
    
    try:
        
        content = await file.read()
        xml_content = content.decode('utf-8')
        
        
        root = ET.fromstring(xml_content)
        
        
        if not collection_id:
            import_collection = models.Collection(
                name=f"Import OPML - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                description=f"Collection importée depuis {file.filename}",
                is_shared=False,
                owner_id=current_user.id
            )
            db.add(import_collection)
            db.commit()
            db.refresh(import_collection)
            collection_id = import_collection.id
        else:
            
            collection = db.query(models.Collection).filter(
                models.Collection.id == collection_id,
                models.Collection.owner_id == current_user.id
            ).first()
            if not collection:
                raise HTTPException(status_code=404, detail="Collection non trouvée")
        
        imported_feeds = []
        skipped_feeds = []
        
        
        body = root.find('.//body')
        if body is not None:
            for outline in body.findall('.//outline[@type="rss"]'):
                xml_url = outline.get('xmlUrl')
                if xml_url:
                    
                    existing_feed = db.query(models.RSSFeed).filter(
                        models.RSSFeed.url == xml_url
                    ).first()
                    
                    if existing_feed:
                        skipped_feeds.append({
                            'url': xml_url,
                            'reason': 'Flux déjà existant'
                        })
                        continue
                    
                    
                    new_feed = models.RSSFeed(
                        collection_id=collection_id,
                        title=outline.get('text', 'Flux sans titre'),
                        url=xml_url,
                        description=outline.get('description', ''),
                        site_url=outline.get('htmlUrl', ''),
                        added_by_user_id=current_user.id
                    )
                    
                    db.add(new_feed)
                    imported_feeds.append({
                        'title': new_feed.title,
                        'url': new_feed.url
                    })
        
        db.commit()
        
        return {
            "message": f"Import terminé: {len(imported_feeds)} flux importés, {len(skipped_feeds)} ignorés",
            "imported_feeds": imported_feeds,
            "skipped_feeds": skipped_feeds,
            "collection_id": collection_id
        }
        
    except ET.ParseError:
        raise HTTPException(status_code=400, detail="Fichier OPML invalide")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'import: {str(e)}")

@router.post("/import/json")
async def import_json(
    file: UploadFile = File(...),
    collection_id: int = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Importer des flux RSS depuis un fichier JSON"""
    
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="Le fichier doit être au format .json")
    
    try:
        content = await file.read()
        data = json.loads(content.decode('utf-8'))
        
        imported_feeds = []
        skipped_feeds = []
        
        
        collections_data = data.get('collections', [])
        
        for collection_data in collections_data:
            
            if collection_id:
                target_collection_id = collection_id
            else:
                
                new_collection = models.Collection(
                    name=collection_data.get('name', 'Collection importée'),
                    description=collection_data.get('description', ''),
                    is_shared=False,
                    owner_id=current_user.id
                )
                db.add(new_collection)
                db.commit()
                db.refresh(new_collection)
                target_collection_id = new_collection.id
            
            
            for feed_data in collection_data.get('feeds', []):
                feed_url = feed_data.get('url')
                if not feed_url:
                    continue
                
                
                existing_feed = db.query(models.RSSFeed).filter(
                    models.RSSFeed.url == feed_url
                ).first()
                
                if existing_feed:
                    skipped_feeds.append({
                        'url': feed_url,
                        'reason': 'Flux déjà existant'
                    })
                    continue
                
                
                new_feed = models.RSSFeed(
                    collection_id=target_collection_id,
                    title=feed_data.get('title', 'Flux sans titre'),
                    url=feed_url,
                    description=feed_data.get('description', ''),
                    site_url=feed_data.get('site_url', ''),
                    update_frequency=feed_data.get('update_frequency', 60),
                    is_active=feed_data.get('is_active', True),
                    added_by_user_id=current_user.id
                )
                
                db.add(new_feed)
                imported_feeds.append({
                    'title': new_feed.title,
                    'url': new_feed.url
                })
        
        db.commit()
        
        return {
            "message": f"Import terminé: {len(imported_feeds)} flux importés, {len(skipped_feeds)} ignorés",
            "imported_feeds": imported_feeds,
            "skipped_feeds": skipped_feeds
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Fichier JSON invalide")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'import: {str(e)}")