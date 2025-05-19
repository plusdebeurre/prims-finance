# PRISM'FINANCE - Documentation

## Vue d'ensemble

PRISM'FINANCE est un système de gestion financière multi-tenant conçu pour faciliter la relation entre les entreprises et leurs fournisseurs à travers divers documents et processus financiers. Cette application offre une plateforme complète pour gérer les contrats, les documents, les fournisseurs et les commandes d'achat.

## Table des matières

1. [Architecture technique](./architecture.md)
2. [Backend FastAPI](./backend.md)
3. [Frontend React](./frontend.md)
4. [API et endpoints](./api.md)
5. [Modèles de données](./models.md)
6. [Système d'authentification](./authentication.md)
7. [Architecture multi-tenant](./multi-tenant.md)
8. [Internationalisation](./i18n.md)
9. [Plan de développement](./roadmap.md)
10. [Guide de déploiement](./deployment.md)

## Fonctionnalités principales

### 1. Architecture multi-tenant
- Support pour plusieurs entreprises avec leurs propres fournisseurs et documents
- Contrôle d'accès basé sur les rôles (RBAC) avec trois types d'utilisateurs : Fournisseur, Admin et Super Admin

### 2. Système d'authentification
- Authentification basée sur JWT
- Accès spécifique aux fonctionnalités et données selon le rôle
- Gestion des mots de passe (réinitialisation, modification)
- Inscription pour les fournisseurs

### 3. Support multi-langue
- Basculement entre le français (par défaut) et l'anglais
- Tout le texte de l'interface est internationalisé

### 4. Gestion des fournisseurs
- Inscription et gestion de profil des fournisseurs
- Téléchargement et vérification de documents (SIRET, documents d'entreprise)
- Suivi des statuts (actif, inactif, en attente, bloqué)

### 5. Gestion des contrats
- Génération de contrats basée sur des modèles
- Remplissage automatique des variables à partir des données fournisseur
- Flux de travail de signature numérique
- Suivi du statut des contrats (brouillon, en attente de signature, signé, expiré, annulé)
- Génération et téléchargement de PDF

### 6. Gestion des documents
- Téléchargement et stockage de documents catégorisés
- Workflow d'approbation
- Suivi du statut des documents

### 7. Système de bons de commande
- Création et gestion des bons de commande
- Suivi des articles avec calculs de taxes
- Workflow de statut (brouillon, envoyé, accepté, exécuté, annulé)

### 8. Système de notifications
- Notifications en temps réel pour les événements importants
- Boîte de réception des notifications avec statut lu/non lu

## Accès au système

L'application dispose de plusieurs comptes utilisateur avec différents niveaux d'accès :

1. **Super Admin :**
   - Email : morgan@bleupetrol.com
   - Mot de passe : SuperAdmin123!

2. **Admin :**
   - Email : admin@prismfinance.com
   - Mot de passe : admin123

3. **Utilisateur de test :**
   - Email : test@example.com
   - Mot de passe : password123

## Démarrage rapide

Pour démarrer l'application en développement :

```bash
# Démarrer le serveur backend
sudo supervisorctl start backend

# Démarrer le frontend
sudo supervisorctl start frontend

# Démarrer la base de données MongoDB
sudo supervisorctl start mongodb

# Démarrer tous les services
sudo supervisorctl start all
```

L'application sera accessible à l'adresse suivante :
- Frontend : https://prism-finance.preview.emergentagent.com
- Backend API : https://9fa6a152-5e96-448d-a89b-d3e858a0d36a.preview.emergentagent.com/api
- Documentation API : https://9fa6a152-5e96-448d-a89b-d3e858a0d36a.preview.emergentagent.com/api/docs

## Licence

Ce projet est propriétaire et confidentiel. Tous droits réservés.
