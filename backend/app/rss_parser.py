# rss_parser.py - Parseur de flux RSS opérationnel
import feedparser
import requests
from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
import logging
import re

from .models import RSSFeed, Article
from .database import SessionLocal

logger = logging.getLogger(__name__)

class RSSParser:
    """Classe pour parser et stocker les flux RSS"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'RSS-Aggregator/1.0 (https://example.com/contact)'
        }
    
    def fetch_feed(self, feed_id: int) -> Dict:
        """
        Récupérer et parser un flux RSS spécifique
        """
        db = SessionLocal()
        try:
            feed = db.query(RSSFeed).filter(RSSFeed.id == feed_id).first()
            if not feed:
                return {'status': 'error', 'error': 'Flux non trouvé'}
            
            return self._process_feed(db, feed)
        finally:
            db.close()
    
    def fetch_all_active_feeds(self) -> Dict:
        """
        Récupérer tous les flux RSS actifs
        """
        db = SessionLocal()
        try:
            active_feeds = db.query(RSSFeed).filter(RSSFeed.is_active == True).all()
            
            results = {
                'total_feeds': len(active_feeds),
                'successful_feeds': 0,
                'failed_feeds': 0,
                'total_new_articles': 0,
                'errors': []
            }
            
            for feed in active_feeds:
                try:
                    result = self._process_feed(db, feed)
                    
                    if result['status'] == 'success':
                        results['successful_feeds'] += 1
                        results['total_new_articles'] += result.get('new_articles_count', 0)
                    else:
                        results['failed_feeds'] += 1
                        results['errors'].append({
                            'feed_id': feed.id,
                            'feed_title': feed.title,
                            'error': result.get('error', 'Erreur inconnue')
                        })
                        
                except Exception as e:
                    results['failed_feeds'] += 1
                    results['errors'].append({
                        'feed_id': feed.id,
                        'feed_title': feed.title,
                        'error': str(e)
                    })
            
            logger.info(f"Mise à jour terminée: {results['successful_feeds']} succès, "
                       f"{results['failed_feeds']} échecs, "
                       f"{results['total_new_articles']} nouveaux articles")
            
            return results
        finally:
            db.close()
    
    def _process_feed(self, db: Session, feed: RSSFeed) -> Dict:
        """
        Traiter un flux RSS spécifique
        """
        try:
            logger.info(f"Récupération du flux: {feed.url}")
            
            # Récupérer le flux avec timeout
            response = requests.get(
                feed.url,
                headers=self.headers,
                timeout=30,
                allow_redirects=True
            )
            response.raise_for_status()
            
            # Parser le flux RSS
            parsed_feed = feedparser.parse(response.content)
            
            # Vérifier si le parsing a réussi
            if parsed_feed.bozo:
                logger.warning(f"Flux RSS malformé: {feed.url}")
                if hasattr(parsed_feed, 'bozo_exception'):
                    logger.warning(f"Erreur: {parsed_feed.bozo_exception}")
            
            # Traiter les articles
            new_articles = self._process_articles(db, feed, parsed_feed.entries)
            
            # Mettre à jour le statut du flux
            self._update_feed_status(db, feed, 'success', None)
            
            return {
                'status': 'success',
                'feed_info': self._extract_feed_info(parsed_feed),
                'new_articles_count': len(new_articles),
                'total_articles': len(parsed_feed.entries)
            }
            
        except requests.RequestException as e:
            error_msg = f"Erreur réseau: {str(e)}"
            logger.error(f"Erreur lors de la récupération de {feed.url}: {error_msg}")
            self._update_feed_status(db, feed, 'error', error_msg)
            return {'status': 'error', 'error': error_msg}
            
        except Exception as e:
            error_msg = f"Erreur de parsing: {str(e)}"
            logger.error(f"Erreur lors du parsing de {feed.url}: {error_msg}")
            self._update_feed_status(db, feed, 'error', error_msg)
            return {'status': 'error', 'error': error_msg}
    
    def _process_articles(self, db: Session, feed: RSSFeed, entries: List) -> List[Article]:
        """
        Traiter les articles d'un flux RSS
        """
        new_articles = []
        
        for entry in entries:
            try:
                # Extraire les données de l'article
                article_data = self._extract_article_data(entry)
                
                # Vérifier si l'article existe déjà
                existing_article = db.query(Article).filter(
                    and_(
                        Article.feed_id == feed.id,
                        Article.guid == article_data['guid']
                    )
                ).first()
                
                if not existing_article:
                    # Créer un nouvel article
                    article = Article(
                        feed_id=feed.id,
                        **article_data
                    )
                    db.add(article)
                    new_articles.append(article)
                    logger.debug(f"Nouvel article ajouté: {article_data['title']}")
                
            except Exception as e:
                logger.error(f"Erreur lors du traitement d'un article: {str(e)}")
                continue
        
        # Sauvegarder tous les nouveaux articles
        if new_articles:
            db.commit()
            logger.info(f"Ajouté {len(new_articles)} nouveaux articles pour {feed.title}")
        
        return new_articles
    
    def _extract_article_data(self, entry) -> Dict:
        """
        Extraire les données d'un article depuis une entrée RSS
        """
        # Titre de l'article
        title = getattr(entry, 'title', 'Sans titre')
        if len(title) > 300:
            title = title[:297] + '...'
        
        # Lien vers l'article
        link = getattr(entry, 'link', '')
        
        # Description/résumé
        description = ''
        if hasattr(entry, 'summary'):
            description = entry.summary
        elif hasattr(entry, 'description'):
            description = entry.description
        
        # Nettoyer le HTML de base si présent
        if description:
            description = self._clean_html(description)
            if len(description) > 1000:
                description = description[:997] + '...'
        
        # Contenu complet
        content = ''
        if hasattr(entry, 'content') and entry.content:
            content = entry.content[0].value if isinstance(entry.content, list) else entry.content
            content = self._clean_html(content)
        
        # Auteur
        author = ''
        if hasattr(entry, 'author'):
            author = entry.author[:100]  # Limiter à 100 caractères
        elif hasattr(entry, 'author_detail') and entry.author_detail:
            author = entry.author_detail.get('name', '')[:100]
        
        # Date de publication
        published_date = None
        if hasattr(entry, 'published_parsed') and entry.published_parsed:
            try:
                published_date = datetime(*entry.published_parsed[:6])
            except (ValueError, TypeError):
                pass
        
        # GUID (identifiant unique)
        guid = getattr(entry, 'id', '') or getattr(entry, 'guid', '') or link
        if len(guid) > 500:
            guid = guid[:500]
        
        return {
            'title': title,
            'link': link[:500] if link else '',  # Limiter la longueur
            'description': description,
            'content': content,
            'author': author,
            'published_date': published_date,
            'guid': guid
        }
    
    def _clean_html(self, text: str) -> str:
        """
        Nettoyer le HTML basique d'un texte
        """
        if not text:
            return ''
        
        # Supprimer les balises HTML de base
        # Remplacer les balises <br> par des retours à la ligne
        text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
        
        # Supprimer toutes les autres balises HTML
        text = re.sub(r'<[^>]+>', '', text)
        
        # Décoder les entités HTML communes
        html_entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&nbsp;': ' '
        }
        
        for entity, char in html_entities.items():
            text = text.replace(entity, char)
        
        # Nettoyer les espaces multiples
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def _extract_feed_info(self, parsed_feed) -> Dict:
        """
        Extraire les informations du flux RSS
        """
        feed_info = {}
        
        if hasattr(parsed_feed, 'feed'):
            feed = parsed_feed.feed
            feed_info = {
                'title': getattr(feed, 'title', ''),
                'description': getattr(feed, 'description', ''),
                'link': getattr(feed, 'link', ''),
                'language': getattr(feed, 'language', ''),
                'last_build_date': getattr(feed, 'updated', '')
            }
        
        return feed_info
    
    def _update_feed_status(self, db: Session, feed: RSSFeed, status: str, error_message: Optional[str]):
        """
        Mettre à jour le statut d'un flux RSS
        """
        feed.last_updated = datetime.utcnow()
        feed.last_fetch_status = status
        feed.error_message = error_message
        
        db.commit()

# Fonctions utilitaires
def update_feed(feed_id: int) -> Dict:
    """
    Mettre à jour un flux RSS spécifique
    """
    parser = RSSParser()
    return parser.fetch_feed(feed_id)

def update_all_feeds() -> Dict:
    """
    Mettre à jour tous les flux RSS actifs
    """
    parser = RSSParser()
    return parser.fetch_all_active_feeds()