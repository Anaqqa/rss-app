# backend/app/main.py - Version mise à jour avec toutes les routes
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models
from .routers import auth, collections, feeds, articles, export, stats


# Créer les tables
Base.metadata.create_all(bind=engine)

# Créer l'application FastAPI
app = FastAPI(
    title="RSS Aggregator API",
    description="API pour gérer des flux RSS et collections partagées avec recherche plein texte",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure toutes les routes
app.include_router(auth.router)
app.include_router(collections.router)
app.include_router(feeds.router)
app.include_router(articles.router)
app.include_router(export.router)
app.include_router(stats.router)

# Route de test
@app.get("/")
def read_root():
    return {
        "message": "RSS Aggregator API avec recherche plein texte! 🚀", 
        "database": "connected",
        "features": [
            "Authentification JWT",
            "Collections partagées", 
            "Flux RSS automatiques",
            "Recherche plein texte",
            "Filtrage avancé",
            "Import/Export OPML"
        ]
    }

# Route de santé
@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "api": "running", 
        "database": "connected",
        "search": "enabled"
    }

# Route de test pour vérifier la base de données
@app.get("/api/db-test")
def test_database():
    from .database import SessionLocal
    from . import models
    
    try:
        db = SessionLocal()
        user_count = db.query(models.User).count()
        collection_count = db.query(models.Collection).count()
        feed_count = db.query(models.RSSFeed).count()
        article_count = db.query(models.Article).count()
        db.close()
        
        return {
            "status": "Database connected successfully!",
            "tables_created": True,
            "stats": {
                "users": user_count,
                "collections": collection_count,
                "feeds": feed_count,
                "articles": article_count
            }
        }
    except Exception as e:
        return {"status": "Database error", "error": str(e)}