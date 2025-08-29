
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models
from .routers import auth, collections, feeds, articles, export, stats, messages, comments



Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="RSS Aggregator API",
    description="API pour gérer des flux RSS et collections partagées avec messagerie instantanée et commentaires",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(collections.router)
app.include_router(feeds.router)
app.include_router(articles.router)
app.include_router(messages.router)  
app.include_router(comments.router)  
app.include_router(export.router)
app.include_router(stats.router)


@app.get("/")
def read_root():
    return {
        "message": "RSS Aggregator API avec messagerie et commentaires! 🚀", 
        "database": "connected",
        "features": [
            "Authentification JWT",
            "Collections partagées", 
            "Flux RSS automatiques",
            "Recherche plein texte",
            "Filtrage avancé",
            "Import/Export OPML",
            "Messagerie instantanée",  
            "Commentaires sur articles"  
        ]
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "api": "running", 
        "database": "connected",
        "search": "enabled",
        "messaging": "enabled",  
        "comments": "enabled"    
    }


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
        message_count = db.query(models.Message).count()  
        comment_count = db.query(models.Comment).count()  
        db.close()
        
        return {
            "status": "Database connected successfully!",
            "tables_created": True,
            "stats": {
                "users": user_count,
                "collections": collection_count,
                "feeds": feed_count,
                "articles": article_count,
                "messages": message_count,    
                "comments": comment_count     
            }
        }
    except Exception as e:
        return {"status": "Database error", "error": str(e)}