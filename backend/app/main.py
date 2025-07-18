from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models
from .routers import auth

# Créer les tables
Base.metadata.create_all(bind=engine)

# Créer l'application FastAPI
app = FastAPI(
    title="RSS Aggregator API",
    description="API pour gérer des flux RSS et collections partagées",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routes
app.include_router(auth.router)

# Route de test
@app.get("/")
def read_root():
    return {"message": "Hello from RSS Aggregator API! 🚀", "database": "connected"}

# Route de santé
@app.get("/health")
def health_check():
    return {"status": "healthy", "api": "running", "database": "connected"}

# Route de test pour le frontend
@app.get("/api/test")
def api_test():
    return {"message": "API connection successful!", "data": ["flux1", "flux2", "flux3"]}

# Route de test pour vérifier la base de données
@app.get("/api/db-test")
def test_database():
    from .database import SessionLocal
    from . import models
    
    try:
        db = SessionLocal()
        user_count = db.query(models.User).count()
        collection_count = db.query(models.Collection).count()
        db.close()
        
        return {
            "status": "Database connected successfully!",
            "tables_created": True,
            "user_count": user_count,
            "collection_count": collection_count
        }
    except Exception as e:
        return {"status": "Database error", "error": str(e)}