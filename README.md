# RSS Feed Manager 📰

Application web de gestion de flux RSS avec collections partagées, développée avec React et Node.js.

## 🚀 Démarrage Rapide

### Prérequis
- Docker et Docker Compose installés
- Git installé

### Installation

1. **Cloner le projet**
```bash
git clone https://github.com/YOUR_USERNAME/rss-app.git
cd rss-app
```

2. **Configuration environnement**
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer les variables si nécessaire
nano .env
```

3. **Lancer l'application**
```bash
# Démarrer tous les services
docker-compose up --build

# Ou en arrière-plan
docker-compose up -d --build
```

4. **Accéder à l'application**
- **Frontend** : http://localhost:3000
- **API Backend** : http://localhost:5000
- **Base de données** : localhost:5432
- **Redis** : localhost:6379

## 🏗️ Architecture

### Services Docker
- **Frontend** : React 18 + TypeScript + Tailwind CSS
- **Backend** : Node.js + Express + TypeScript
- **Base de données** : PostgreSQL 15
- **Cache** : Redis 7

### Structure du projet
```
rss-app/
├── docker-compose.yml      # Configuration Docker
├── backend/               # API REST Node.js
│   ├── src/              # Code source TypeScript
│   ├── prisma/           # Schéma base de données
│   └── Dockerfile        # Image Docker backend
├── frontend/             # Application React
│   ├── src/              # Code source TypeScript
│   ├── public/           # Fichiers statiques
│   └── Dockerfile        # Image Docker frontend
└── database/             # Scripts d'initialisation
```

## ✨ Fonctionnalités

### Phase 1 : Infrastructure ✅
- [x] Configuration Docker complète
- [x] Base de données PostgreSQL
- [x] Cache Redis
- [x] Structure des projets

### Phase 2 : Backend API (En cours)
- [ ] Authentification JWT + OAuth2
- [ ] Gestion des utilisateurs
- [ ] API des collections de flux
- [ ] Parser RSS automatique
- [ ] Système de permissions

### Phase 3 : Frontend React (À venir)
- [ ] Interface utilisateur responsive
- [ ] Gestion des flux RSS
- [ ] Chat temps réel
- [ ] Import/Export OPML

### Phase 4 : Fonctionnalités avancées (À venir)
- [ ] Recherche full-text
- [ ] Notifications
- [ ] Thème sombre
- [ ] Application mobile

## 🛠️ Développement

### Commandes utiles
```bash
# Logs des services
docker-compose logs -f [service_name]

# Redémarrer un service
docker-compose restart [service_name]

# Accéder au shell d'un container
docker-compose exec backend sh
docker-compose exec frontend sh

# Arrêter tous les services
docker-compose down

# Supprimer les volumes (⚠️ perte de données)
docker-compose down -v
```

### Prochaines étapes de développement
1. Configuration des packages Node.js
2. Schéma Prisma et migrations
3. Implémentation de l'API REST
4. Développement de l'interface React

## 📋 Statut du Projet

- **Phase actuelle** : Infrastructure Docker ✅
- **Prochaine étape** : Configuration des packages et base de données
- **Progression** : 15% (Jour 1/7 du planning optimisé)

## 🤝 Contribution

Ce projet est développé dans le cadre d'un projet académique.

### Workflow Git
- `main` : Branche principale (stable)
- `develop` : Branche de développement
- `feature/*` : Branches de fonctionnalités

### Standards de code
- TypeScript strict mode
- ESLint + Prettier
- Tests unitaires requis
- Documentation des APIs

## 📝 Licence

Projet académique - Usage éducatif uniquement

---

