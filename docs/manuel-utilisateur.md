# Manuel Utilisateur - RSS Aggregator

## Table des Matières
1. [Premiers Pas](#premiers-pas)
2. [Gestion des Collections](#gestion-des-collections)
3. [Flux RSS](#flux-rss)
4. [Articles et Lecture](#articles-et-lecture)
5. [Collections Partagées](#collections-partagées)
6. [Messagerie et Commentaires](#messagerie-et-commentaires)
7. [Import/Export](#importexport)
8. [Paramètres et Profil](#paramètres-et-profil)

---

## Premiers Pas

### Création de Compte

1. **Inscription classique**
   - Rendez-vous sur la page d'accueil
   - Cliquez sur "S'inscrire"
   - Remplissez le formulaire :
     - Nom d'utilisateur (unique)
     - Email
     - Mot de passe (minimum 8 caractères)
     - Prénom et nom (optionnel)
   - Cliquez "Créer le compte"

2. **Connexion avec Google**
   - Cliquez sur "Se connecter avec Google"
   - Autorisez l'accès à votre compte Google
   - Votre compte sera créé automatiquement

### Première Connexion

Après votre première connexion, vous arrivez sur le **Tableau de bord** qui affiche :
- Statistiques de vos collections
- Articles récents
- Accès rapide aux fonctionnalités

---

## Gestion des Collections

### Qu'est-ce qu'une Collection ?

Une **collection** est un ensemble de flux RSS organisés par thème. Exemple :
- "Actualités Tech" : flux de sites technologiques
- "Sciences" : revues scientifiques et blogs
- "Équipe Marketing" : flux partagés avec votre équipe

### Créer une Collection

1. Allez dans **"Collections"** dans le menu
2. Cliquez **"➕ Nouvelle Collection"**
3. Remplissez le formulaire :
   - **Nom** : "Actualités Tech" (obligatoire)
   - **Description** : "Flux RSS sur la technologie" (optionnel)
   - **Collection partagée** : Cochez si vous voulez collaborer avec d'autres
4. Cliquez **"Créer"**

### Types de Collections

#### Collection Personnelle 📂
- Visible par vous uniquement
- Gestion complète des flux
- Lecture privée

#### Collection Partagée 👥
- Visible par les membres invités
- Permissions configurables
- Messagerie de groupe
- Commentaires collaboratifs

---

## Flux RSS

### Ajouter un Flux RSS

1. **Ouvrez une collection** en cliquant dessus
2. Cliquez **"➕ Ajouter un flux RSS"**
3. Remplissez les informations :
   - **Titre** : "Le Monde - Tech" (obligatoire)
   - **URL du flux RSS** : `https://www.lemonde.fr/technologies/rss.xml` (obligatoire)
   - **Description** : "Actualités tech du Monde" (optionnel)
   - **URL du site web** : `https://www.lemonde.fr` (optionnel)
   - **Fréquence de mise à jour** : Choisissez l'intervalle (15 min à 24h)
4. Cliquez **"Ajouter le flux"**

### Trouver des Flux RSS

**Sites d'actualités :**
- Le Monde : `https://www.lemonde.fr/rss/une.xml`
- Le Figaro : `https://www.lefigaro.fr/rss/figaro_actualites.xml`
- Libération : `https://www.liberation.fr/arc/outboundfeeds/rss/`

**Sites tech :**
- 01net : `https://www.01net.com/rss/info/flux-rss/flux-actualites.xml`
- Numerama : `https://www.numerama.com/feed/`

**Blogs :**
- La plupart des sites ont un lien "RSS" en pied de page
- Ou ajoutez `/feed` ou `/rss` à l'URL du site

### Gérer vos Flux

Dans l'onglet **"📡 Flux RSS"** d'une collection :

1. **Mettre à jour un flux** : Cliquez **"🔄 Mettre à jour"**
2. **Voir les détails** : Informations sur le statut, dernière mise à jour
3. **Supprimer** : Bouton de suppression (si vous en avez les droits)

---

## Articles et Lecture

### Consulter les Articles

Dans l'onglet **"📰 Articles"** :

1. **Liste des articles** : Triés par date (plus récents en premier)
2. **Statut visuel** :
   - **Gras** : Article non lu
   - **Normal** : Article déjà lu
   - **Bordure bleue** : Article non lu

### Filtrer les Articles

Utilisez la barre de filtrage :

1. **Recherche** : Tapez des mots-clés dans "Rechercher..."
2. **Par flux** : Choisissez un flux spécifique
3. **Par statut** : 
   - "Tous" : Tous les articles
   - "Non lus" : Seulement les articles non lus
   - "Lus" : Seulement les articles lus
4. **Favoris** : Seulement vos articles favoris

### Actions sur les Articles

Pour chaque article :

1. **Lire** : Cliquez sur le titre pour ouvrir l'article original
2. **Marquer comme lu/non lu** : Cliquez l'icône **👁️**
3. **Ajouter aux favoris** : Cliquez l'icône **⭐**
4. **Commenter** (collections partagées) : Cliquez **💭**

---

## Collections Partagées

### Inviter des Membres

**Prérequis** : Être propriétaire d'une collection partagée

1. Ouvrez votre collection partagée
2. Allez dans l'onglet **"👥 Membres"**
3. Dans "Inviter un utilisateur" :
   - **Nom d'utilisateur** : Tapez le nom exact (ex: "alice")
   - **Permissions** : Cochez les autorisations
4. Cliquez **"📧 Inviter"**

### Système de Permissions

#### Permissions Disponibles

- **👁️ Lecture** : Voir les articles (toujours accordée)
- **➕ Ajouter des flux** : Peut ajouter de nouveaux flux RSS
- **✏️ Modifier des flux** : Peut changer les paramètres des flux
- **🗑️ Supprimer des flux** : Peut supprimer des flux
- **💬 Commenter** : Peut envoyer messages et commentaires

#### Exemples de Rôles

**Lecteur** (permissions par défaut) :
- ✅ Lecture
- ✅ Commentaires
- ❌ Gestion des flux

**Contributeur** :
- ✅ Lecture  
- ✅ Commentaires
- ✅ Ajouter des flux
- ❌ Modifier/supprimer les flux des autres

**Éditeur** :
- ✅ Toutes les permissions
- ❌ Sauf suppression (réservée au propriétaire)

### Gérer les Membres

Dans l'onglet **"👥 Membres"** :

1. **Voir les membres** : Liste avec permissions de chacun
2. **Retirer un membre** : Cliquez **"❌ Retirer"**
3. **Modifier les permissions** : Fonctionnalité à venir

---

## Messagerie et Commentaires

### Messagerie de Groupe

**Disponible uniquement** dans les collections partagées.

#### Envoyer un Message

1. Ouvrez une collection partagée
2. Allez dans l'onglet **"💬 Discussion"**
3. Tapez votre message dans la zone de texte
4. Cliquez **"Envoyer"** ou appuyez sur **Entrée**

#### Fonctionnalités

- **Messages en temps réel** : Pas besoin de rafraîchir
- **Historique complet** : Tous les messages sont conservés
- **Suppression** : Vous pouvez supprimer vos propres messages
- **Avatars** : Initiales des utilisateurs

### Commenter les Articles

#### Ajouter un Commentaire

1. Dans une collection partagée, cliquez **💭** sur un article
2. L'onglet **"💭 Commentaires"** s'ouvre
3. Rédigez votre commentaire dans la zone de texte
4. Cliquez **"Publier le commentaire"**

#### Gestion des Commentaires

- **Modifier** : Éditez vos propres commentaires
- **Supprimer** : Supprimez vos commentaires ou modérez (propriétaire)
- **Horodatage** : Date de création et modification

---

## Import/Export

### Exporter vos Données

**Utilisé pour** : Sauvegarde, migration, partage

1. Allez dans **"Export/Import"**
2. Choisissez le format :
   - **OPML** : Standard pour flux RSS (compatible avec tous les lecteurs)
   - **JSON** : Format complet avec toutes les données
3. Sélectionnez les collections à exporter (optionnel)
4. Cliquez **"Télécharger"**

### Importer des Flux

**Sources possibles** : Ancien lecteur RSS, sauvegarde, partage de collègue

1. Allez dans **"Export/Import"**
2. Cliquez **"Choisir un fichier"**
3. Sélectionnez votre fichier OPML ou JSON
4. (Optionnel) Choisissez une collection de destination
5. Cliquez **"Importer"**

**Résultat** : 
- Nouveau flux créés automatiquement
- Vous en devenez le propriétaire
- Articles commencent à être récupérés

---

## Paramètres et Profil

### Modifier votre Profil

1. Cliquez sur votre nom (coin supérieur droit)
2. Sélectionnez **"Profil"**
3. Modifiez :
   - Prénom, nom
   - Préférences d'affichage
   - Taille de police
4. Cliquez **"Sauvegarder"**

### Changer votre Mot de Passe

1. Dans **"Profil"**
2. Section **"Sécurité"**
3. Tapez votre ancien mot de passe
4. Définissez le nouveau mot de passe
5. Confirmez et sauvegardez

### Associer/Dissocier Google

- **Associer** : Reliez votre compte Google pour une connexion simplifiée
- **Dissocier** : Supprimez le lien (nécessite un mot de passe défini)

---

## Conseils d'Utilisation

### Organisation Efficace

1. **Créez des collections thématiques**
   - "Actualités Générales"
   - "Tech & Innovation"  
   - "Équipe Projet X"

2. **Utilisez les filtres**
   - Marquez les articles lus
   - Favorisez les articles importants
   - Recherchez par mots-clés

3. **Collaborez intelligemment**
   - Définissez des permissions claires
   - Utilisez la messagerie pour coordonner
   - Commentez les articles pertinents

### Bonnes Pratiques

1. **Choix des flux** : Préférez les flux officiels des sites
2. **Fréquence** : Adaptez selon l'activité du site (actualités : 1h, blogs : 6h)
3. **Nettoyage** : Supprimez régulièrement les flux inactifs
4. **Permissions** : Donnez le minimum nécessaire aux membres

### Résolution de Problèmes

**Flux ne se met pas à jour** :
- Vérifiez l'URL du flux
- Testez l'URL dans votre navigateur
- Contactez l'administrateur si le problème persiste

**Articles en double** :
- Normal lors de changement d'URL
- Le système filtre automatiquement

**Problème de connexion** :
- Vérifiez votre mot de passe
- Utilisez la connexion Google si configurée
- Contactez le support si nécessaire

---

## Support

**En cas de problème** :
- Consultez cette documentation
- Vérifiez les messages d'erreur
- Contactez l'administrateur système

**Fonctionnalités futures** :
- Notifications push
- Application mobile
- Intégrations avancées