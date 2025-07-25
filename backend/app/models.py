from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

# Table d'association pour les catégories de flux
feed_categories = Table(
    'feed_categories',
    Base.metadata,
    Column('feed_id', Integer, ForeignKey('rss_feeds.id'), primary_key=True),
    Column('category_id', Integer, ForeignKey('categories.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(50))
    last_name = Column(String(50))
    is_active = Column(Boolean, default=True)
    
    # OAuth2 fields 
    oauth_provider = Column(String(20))
    oauth_id = Column(String(100))
    
    # Préférences utilisateur
    theme_preference = Column(String(10), default='light')
    font_size = Column(Integer, default=14)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relations
    owned_collections = relationship("Collection", back_populates="owner")
    user_collections = relationship("UserCollection", back_populates="user")
    user_articles = relationship("UserArticle", back_populates="user")
    comments = relationship("Comment", back_populates="user")
    messages = relationship("Message", back_populates="user")

class Collection(Base):
    __tablename__ = "collections"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_shared = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relations
    owner = relationship("User", back_populates="owned_collections")
    user_collections = relationship("UserCollection", back_populates="collection")
    rss_feeds = relationship("RSSFeed", back_populates="collection")
    comments = relationship("Comment", back_populates="collection")
    messages = relationship("Message", back_populates="collection")

class UserCollection(Base):
    __tablename__ = "user_collections"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    collection_id = Column(Integer, ForeignKey("collections.id"))
    
    # Permissions
    can_read = Column(Boolean, default=True)
    can_add_feeds = Column(Boolean, default=False)
    can_edit_feeds = Column(Boolean, default=False)
    can_delete_feeds = Column(Boolean, default=False)
    can_comment = Column(Boolean, default=True)
    
    joined_at = Column(DateTime, default=func.now())
    
    # Relations
    user = relationship("User", back_populates="user_collections")
    collection = relationship("Collection", back_populates="user_collections")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    color = Column(String(7), default='#007bff')
    created_at = Column(DateTime, default=func.now())
    
    # Relations
    feeds = relationship("RSSFeed", secondary=feed_categories, back_populates="categories")

class RSSFeed(Base):
    __tablename__ = "rss_feeds"
    
    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id"))
    
    # Métadonnées du flux
    title = Column(String(200), nullable=False)
    url = Column(String(500), unique=True, nullable=False)
    description = Column(Text)
    site_url = Column(String(500))
    
    # Configuration
    update_frequency = Column(Integer, default=60)  # Minutes
    is_active = Column(Boolean, default=True)
    
    # Métadonnées automatiques
    last_updated = Column(DateTime)
    last_fetch_status = Column(String(20), default='pending')
    error_message = Column(Text)
    
    added_by_user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relations
    collection = relationship("Collection", back_populates="rss_feeds")
    added_by_user = relationship("User")
    articles = relationship("Article", back_populates="feed")
    categories = relationship("Category", secondary=feed_categories, back_populates="feeds")

class Article(Base):
    __tablename__ = "articles"
    
    id = Column(Integer, primary_key=True, index=True)
    feed_id = Column(Integer, ForeignKey("rss_feeds.id"))
    
    # Contenu de l'article
    title = Column(String(300), nullable=False)
    link = Column(String(500), nullable=False)
    description = Column(Text)
    content = Column(Text)
    author = Column(String(100))
    
    # Dates
    published_date = Column(DateTime)
    fetched_at = Column(DateTime, default=func.now())
    
    # Métadonnées
    guid = Column(String(500))
    
    # Relations
    feed = relationship("RSSFeed", back_populates="articles")
    user_articles = relationship("UserArticle", back_populates="article")
    comments = relationship("Comment", back_populates="article")

class UserArticle(Base):
    __tablename__ = "user_articles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    article_id = Column(Integer, ForeignKey("articles.id"))
    
    is_read = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False)
    read_at = Column(DateTime)
    favorited_at = Column(DateTime)
    
    # Relations
    user = relationship("User", back_populates="user_articles")
    article = relationship("Article", back_populates="user_articles")

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    collection_id = Column(Integer, ForeignKey("collections.id"))
    
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relations
    article = relationship("Article", back_populates="comments")
    user = relationship("User", back_populates="comments")
    collection = relationship("Collection", back_populates="comments")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    
    # Relations
    collection = relationship("Collection", back_populates="messages")
    user = relationship("User", back_populates="messages")