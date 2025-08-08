# Documentation Technique - RSS Aggregator

## 1. Informations de Déploiement

### Prérequis Système
- **Docker** : Version 20.10 ou supérieure
- **Docker Compose** : Version 2.0 ou supérieure
- **Ports requis** : 3000 (Frontend), 8000 (Backend), 5432 (Database)
- **RAM minimale** : 2 GB
- **Espace disque** : 1 GB libre

### Variables d'Environnement

Créer un fichier `.env` à la racine du projet :

```env
# Base de données
POSTGRES_DB=rss_database
POSTGRES_USER=rss_user
POSTGRES_PASSWORD=votre_mot_de_passe_securise

# Backend
DATABASE_URL=postgresql://rss_user:votre_mot_de_passe_securise@database:5432/rss_database
SECRET_KEY=votre_clef_secrete_jwt_longue_et_complexe

# OAuth2 Google (optionnel)
GOOGLE_CLIENT_ID=votre_client_id_google
GOOGLE_CLIENT_SECRET=votre_client_secret_google

# Frontend
REACT_APP_API_URL=http://localhost:8000
```

### Déploiement

```bash
# 1. Cloner le repository
git clone https://github.com/votre-username/rss-aggregator.git
cd rss-aggregator

# 2. Créer le fichier .env (voir section précédente)

# 3. Lancer l'application
docker-compose up --build -d

# 4. Vérifier le déploiement
docker-compose ps
docker-compose logs -f

# 5. Accéder à l'application
# Frontend: http://localhost:3000
# API: http://localhost:8000
# Docs API: http://localhost:8000/docs
```

### Configuration OAuth2 Google

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Créer un nouveau projet ou sélectionner un projet existant
3. Activer l'API Google+ et l'API OAuth2
4. Créer des identifiants OAuth2 :
   - Type : Application Web
   - Origines autorisées : `http://localhost:3000`
   - URI de redirection : `http://localhost:8000/auth/oauth/google/callback`
5. Ajouter les identifiants dans le fichier `.env`

## 2. Architecture Système

### Vue d'ensemble

L'application suit une architecture 3-tiers classique :

```
[Frontend React] ↔ [API FastAPI] ↔ [Base PostgreSQL]
       ↓               ↓              ↓
   Port 3000      Port 8000      Port 5432
```

### Composants Principaux

#### Frontend (React + Bootstrap)
- **Responsabilités** : Interface utilisateur, routage, gestion d'état local
- **Technologie** : React 18, React Router, Bootstrap 5, Axios
- **Architecture** : SPA (Single Page Application) avec Context API
- **Containerisation** : Nginx + build React optimisé

#### Backend (FastAPI + Python)
- **Responsabilités** : API REST, logique métier, authentification, parsing RSS
- **Technologie** : FastAPI, SQLAlchemy, Pydantic, JWT, feedparser
- **Architecture** : Modèle en couches (routers → services → models)
- **Base** : Python 3.11 avec uvicorn

#### Base de Données (PostgreSQL)
- **Responsabilités** : Persistance, relations complexes, recherche full-text
- **Technologie** : PostgreSQL 15 avec extensions
- **Modèle** : Relationnel avec 8 tables principales

## 3. Justification des Choix Techniques

### Backend - FastAPI
**Pourquoi FastAPI ?**
- Performance élevée (comparable à Node.js)
- Documentation automatique (Swagger/OpenAPI)
- Validation automatique avec Pydantic
- Support natif de l'asynchrone
- Typage Python moderne

**Alternatives considérées :**
- Django REST : Trop lourd pour cette application
- Flask : Manque de fonctionnalités modernes

### Frontend - React
**Pourquoi React ?**
- Écosystème mature et stable
- Performance avec Virtual DOM
- Composants réutilisables
- Hooks modernes pour la gestion d'état
- Intégration facile avec Bootstrap

**Alternatives considérées :**
- Vue.js : Moins d'expérience équipe
- Angular : Trop complexe pour ce projet

### Base de Données - PostgreSQL
**Pourquoi PostgreSQL ?**
- Relations complexes (8 tables liées)
- Recherche full-text native
- Support JSON pour flexibilité
- Performance sur gros volumes
- Fiabilité et intégrité ACID

**Alternatives considérées :**
- MySQL : Recherche full-text moins avancée
- MongoDB : Pas adapté aux relations complexes

### Parsing RSS - feedparser
**Pourquoi feedparser ?**
- Standard de facto pour RSS/Atom en Python
- Gestion robuste des formats malformés
- Support de tous les standards RSS
- Parsing intelligent des dates

### Authentification - JWT + OAuth2
**Pourquoi cette combinaison ?**
- JWT : Stateless, scalable, sécurisé
- OAuth2 : UX moderne, sécurité déléguée
- Flexibilité : Support des deux modes

## 4. Schéma de Base de Données

### Modèle Relationnel

```sql
-- Utilisateurs
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    oauth_provider VARCHAR(20),
    oauth_id VARCHAR(100),
    theme_preference VARCHAR(10) DEFAULT 'light',
    font_size INTEGER DEFAULT 14,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Collections de flux
CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_shared BOOLEAN DEFAULT FALSE,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Permissions des utilisateurs sur les collections
CREATE TABLE user_collections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
    can_read BOOLEAN DEFAULT TRUE,
    can_add_feeds BOOLEAN DEFAULT FALSE,
    can_edit_feeds BOOLEAN DEFAULT FALSE,
    can_delete_feeds BOOLEAN DEFAULT FALSE,
    can_comment BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, collection_id)
);

-- Catégories pour organiser les flux
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#007bff',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Flux RSS
CREATE TABLE rss_feeds (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    url VARCHAR(500) UNIQUE NOT NULL,
    description TEXT,
    site_url VARCHAR(500),
    update_frequency INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP,
    last_fetch_status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    added_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Articles des flux RSS
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    feed_id INTEGER REFERENCES rss_feeds(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    link VARCHAR(500) NOT NULL,
    description TEXT,
    content TEXT,
    author VARCHAR(100),
    published_date TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT NOW(),
    guid VARCHAR(500)
);

-- États des articles par utilisateur
CREATE TABLE user_articles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    favorited_at TIMESTAMP,
    UNIQUE(user_id, article_id)
);

-- Messages de discussion dans les collections
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Commentaires sur les articles
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table de liaison flux-catégories
CREATE TABLE feed_categories (
    feed_id INTEGER REFERENCES rss_feeds(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (feed_id, category_id)
);
```

### Index pour Performance

```sql
-- Index pour les recherches fréquentes
CREATE INDEX idx_articles_feed_published ON articles(feed_id, published_date DESC);
CREATE INDEX idx_user_articles_user_read ON user_articles(user_id, is_read);
CREATE INDEX idx_user_collections_user ON user_collections(user_id);
CREATE INDEX idx_messages_collection_date ON messages(collection_id, created_at DESC);

-- Index full-text pour la recherche
CREATE INDEX idx_articles_search ON articles USING gin(to_tsvector('french', title || ' ' || COALESCE(description, '')));
```

## 5. API REST

### Structure des Routes

```
/auth/           # Authentification
  ├── POST /register
  ├── POST /login
  ├── GET /me
  ├── PUT /me
  └── /oauth/google/
      ├── GET /url
      └── GET /callback

/collections/    # Gestion des collections
  ├── GET /
  ├── POST /
  ├── GET /{id}
  ├── PUT /{id}
  ├── DELETE /{id}
  └── /{id}/
      ├── GET /members
      ├── POST /invite
      └── /members/{member_id}
          ├── DELETE /
          └── PUT /permissions

/feeds/          # Gestion des flux RSS
  ├── GET /collection/{collection_id}
  ├── POST /
  ├── PUT /{id}
  ├── DELETE /{id}
  └── POST /{id}/update

/articles/       # Gestion des articles
  ├── GET /collection/{collection_id}
  ├── GET /search
  └── PUT /{id}/status

/messages/       # Messagerie instantanée
  ├── GET /collection/{collection_id}
  ├── POST /
  └── DELETE /{id}

/comments/       # Commentaires
  ├── GET /article/{article_id}
  ├── GET /collection/{collection_id}
  ├── POST /
  ├── PUT /{id}
  └── DELETE /{id}

/export/         # Export de données
  ├── GET /opml
  └── GET /json

/import/         # Import de données
  ├── POST /opml
  └── POST /json

/stats/          # Statistiques
  ├── GET /dashboard
  └── GET /collection/{collection_id}
```

## 6. Sécurité

### Authentification
- **Hachage des mots de passe** : bcrypt avec salt
- **JWT sécurisé** : RS256, expiration 24h
- **OAuth2** : Flux standard avec state CSRF

### Autorisation
- **Permissions granulaires** : 5 niveaux par collection
- **Vérification systématique** : Middleware sur chaque route
- **Isolation des données** : Un utilisateur ne voit que ses données

### Protection des Données
- **Validation stricte** : Pydantic sur toutes les entrées
- **Échappement SQL** : SQLAlchemy ORM
- **CORS configuré** : Origine contrôlée
- **Rate limiting** : À implémenter en production

## 7. Performance

### Backend
- **Connexions à la DB** : Pool de connexions SQLAlchemy
- **Requêtes optimisées** : Jointures et index appropriés
- **Cache** : À implémenter (Redis)

### Frontend
- **Build optimisé** : Webpack avec minification
- **Lazy loading** : Composants chargés à la demande
- **Debouncing** : Recherche avec délai

### Base de Données
- **Index strategiques** : Sur les colonnes fréquemment interrogées
- **Recherche full-text** : Index GIN PostgreSQL
- **Pagination** : Limit/offset sur toutes les listes

## 8. Monitoring et Logs

### Backend
- **Logs structurés** : Format JSON avec niveaux
- **Métriques** : FastAPI natif + Prometheus ready
- **Health check** : Route `/health`

### Base de Données
- **Monitoring** : pg_stat_activity, pg_stat_user_tables
- **Backup** : Dump automatique recommandé

## 9. Évolutivité

### Améliorations Futures
1. **Cache Redis** : Performance articles
2. **WebSockets** : Messagerie temps réel
3. **Queue system** : Parsing RSS asynchrone
4. **CDN** : Assets statiques
5. **Microservices** : Séparation parsing RSS

### Architecture Scalable
- **API stateless** : Scalabilité horizontale
- **DB séparée** : Réplication possible  
- **Frontend SPA** : CDN distributable