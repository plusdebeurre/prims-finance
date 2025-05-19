# Architecture technique de PRISM'FINANCE

## Vue d'ensemble de l'architecture

PRISM'FINANCE est conçu selon une architecture moderne à trois niveaux :

1. **Frontend** : Une application React moderne avec Tailwind CSS
2. **Backend** : Une API REST construite avec FastAPI (Python)
3. **Base de données** : MongoDB pour le stockage de données NoSQL

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│             │      │             │      │             │
│   Frontend  │◄────►│   Backend   │◄────►│  MongoDB    │
│   (React)   │      │  (FastAPI)  │      │             │
│             │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
```

## Communication entre les couches

### Frontend ↔ Backend
- La communication se fait via des requêtes HTTP/HTTPS
- Les endpoints API sont accessibles via la base URL `/api/*`
- L'authentification se fait via des tokens JWT
- Toutes les requêtes API sont centralisées dans un fichier `api.js`
- Les réponses/erreurs sont traitées de façon cohérente

### Backend ↔ Base de données
- Connection à MongoDB via le driver asyncio
- Les requêtes sont optimisées avec des index
- Les opérations sur la base de données sont asynchrones
- L'isolation des données se fait grâce à l'architecture multi-tenant

## Structure du projet

```
/app/
├── backend/              # Code backend FastAPI
│   ├── server.py         # Point d'entrée de l'API
│   ├── models.py         # Modèles de données Pydantic
│   ├── requirements.txt  # Dépendances Python
│   ├── .env              # Variables d'environnement
│   └── uploads/          # Fichiers uploadés (templates, documents, contrats)
│
├── frontend/             # Application React
│   ├── public/           # Fichiers statiques
│   ├── src/              # Code source React
│   │   ├── contexts/     # Contextes React (Auth, Language)
│   │   ├── api.js        # Centralisation des appels API
│   │   ├── App.js        # Composant principal
│   │   └── App.css       # Styles CSS/Tailwind
│   ├── package.json      # Dépendances NPM
│   └── .env              # Variables d'environnement
│
├── doc/                  # Documentation
└── README.md             # Documentation principale
```

## Architecture du backend

Le backend est construit avec FastAPI, un framework web Python moderne. L'architecture du backend suit les principes suivants :

1. **Routage API** : Les routes sont organisées de manière logique en utilisant des routeurs FastAPI.
2. **Validation des données** : Les modèles Pydantic sont utilisés pour la validation des données entrantes et sortantes.
3. **Middleware** : CORS et autres middlewares pour gérer les requêtes.
4. **Authentification** : Système basé sur JWT avec différents niveaux d'accès.
5. **Opérations asynchrones** : Toutes les opérations sont asynchrones pour de meilleures performances.

### Principaux composants backend

- **server.py** : Point d'entrée principal, contient toutes les routes API
- **models.py** : Définition des modèles de données avec Pydantic
- **Système d'authentification** : Gestion des JWT, hachage des mots de passe, et contrôle d'accès basé sur les rôles
- **Gestionnaire de fichiers** : Pour les uploads de documents, templates et contrats

## Architecture du frontend

Le frontend est construit avec React et Tailwind CSS. L'architecture suit les principes suivants :

1. **Composants** : Organisation modulaire avec des composants réutilisables
2. **Contextes** : Utilisation des contextes React pour la gestion d'état globale (authentification, langue)
3. **API centralisée** : Tous les appels API sont centralisés dans un fichier api.js
4. **Styles** : Utilisation de Tailwind CSS pour un styling cohérent et responsive
5. **Routage** : React Router pour la navigation entre les pages

### Principaux composants frontend

- **App.js** : Point d'entrée principal, définit les routes et les composants principaux
- **AuthProvider** : Gestion de l'authentification et des permissions
- **LanguageProvider** : Gestion des traductions et changement de langue
- **API centralisée** : Toutes les requêtes API sont regroupées en un seul endroit

## Architecture multi-tenant

PRISM'FINANCE utilise une architecture multi-tenant pour isoler les données de chaque entreprise:

1. **Isolation au niveau des requêtes** : Chaque requête est filtrée par l'ID de l'entreprise
2. **Isolation des données** : Les données d'une entreprise ne sont jamais exposées à une autre entreprise
3. **Rôles utilisateur** : Super Admin, Admin, et Fournisseur avec différents niveaux d'accès

## Flux de données

1. **Authentication** :
   ```
   Frontend → POST /api/auth/token → Backend → JWT → Frontend
   ```

2. **Récupération des données** :
   ```
   Frontend → GET /api/resource → Backend → MongoDB → Backend → Frontend
   ```

3. **Modification des données** :
   ```
   Frontend → POST/PUT /api/resource → Backend → Validation → MongoDB → Réponse → Frontend
   ```

## Sécurité

- **JWT** : Tokens signés pour l'authentification
- **HTTPS** : Toutes les communications sont chiffrées
- **Hachage des mots de passe** : Bcrypt pour le stockage sécurisé
- **Validation des données** : Toutes les entrées sont validées côté backend
- **CORS** : Configuration stricte pour limiter les origines autorisées

## Performances

- **Requêtes asynchrones** : Le backend utilise des opérations asynchrones
- **Caching** : Certaines données sont mises en cache pour améliorer les performances
- **Optimisation des requêtes** : Les requêtes MongoDB sont optimisées avec des index
- **Lazy loading** : Le chargement des composants se fait à la demande

## Internationalisation

L'application supporte deux langues : Français (par défaut) et Anglais. L'architecture d'internationalisation repose sur :

1. **Contexte de langue** : Un contexte React pour gérer la langue actuelle
2. **Fichiers de traduction** : Les traductions sont définies dans `LanguageContext.js`
3. **Helper de traduction** : Une fonction `t()` pour accéder aux traductions

## Évolutivité

L'architecture est conçue pour être évolutive :

1. **API modulaire** : Nouveaux endpoints facilement ajoutables
2. **Composants réutilisables** : Facilite l'ajout de nouvelles fonctionnalités
3. **Architecture découplée** : Frontend et backend peuvent évoluer indépendamment
