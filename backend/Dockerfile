# backend/Dockerfile
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci

# Générer le client Prisma
RUN npx prisma generate

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 5000

# Commande par défaut
CMD ["npm", "run", "dev"]