# Documentation du Backend PRISM'FINANCE

## Vue d'ensemble

Le backend de PRISM'FINANCE est construit avec FastAPI, un framework web Python moderne qui offre des performances élevées grâce à l'asynchronicité et à la validation automatique des données via Pydantic. Il sert de couche d'API RESTful pour l'application frontend React.

## Technologies utilisées

- **FastAPI** : Framework web Python rapide et moderne
- **Pydantic** : Validation des données et sérialisation/désérialisation
- **Motor** : Driver MongoDB asynchrone pour Python
- **PyJWT** : Gestion des tokens JWT
- **Passlib** : Hachage sécurisé des mots de passe
- **Python-multipart** : Gestion des formulaires multipart pour l'upload de fichiers
- **Mammoth** : Extraction de texte et manipulation de documents Word

## Structure des fichiers

```
/app/backend/
├── server.py             # Point d'entrée principal de l'API
├── models.py             # Modèles de données Pydantic (intégré dans server.py)
├── requirements.txt      # Dépendances Python
├── .env                  # Variables d'environnement
└── uploads/              # Dossier pour les fichiers uploadés
    ├── templates/        # Templates de contrats
    ├── documents/        # Documents fournisseurs
    └── contracts/        # Contrats générés
```

## Configuration et initialisation

Le backend est configuré dans la fonction de démarrage de FastAPI :

```python
@app.on_event("startup")
async def startup_db_client():
    # Création des index dans MongoDB
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.suppliers.create_index("id", unique=True)
    await db.templates.create_index("id", unique=True)
    await db.contracts.create_index("id", unique=True)
    await db.notifications.create_index("id", unique=True)
    await db.general_conditions.create_index("id", unique=True)
    
    # Création de l'utilisateur admin par défaut si nécessaire
    # ...
```

## Routeurs FastAPI

Les endpoints API sont organisés en plusieurs routeurs pour une meilleure séparation des préoccupations :

```python
auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])
users_router = APIRouter(prefix="/api/users", tags=["Users"])
companies_router = APIRouter(prefix="/api/companies", tags=["Companies"])
suppliers_router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])
templates_router = APIRouter(prefix="/api/templates", tags=["Templates"])
contracts_router = APIRouter(prefix="/api/contracts", tags=["Contracts"])
documents_router = APIRouter(prefix="/api/documents", tags=["Documents"])
purchase_orders_router = APIRouter(prefix="/api/purchase-orders", tags=["Purchase Orders"])
notifications_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
general_conditions_router = APIRouter(prefix="/api/general-conditions", tags=["General Conditions"])
```

Chaque routeur est ensuite inclus dans l'application FastAPI principale.

## Système d'authentification

L'authentification utilise les JSON Web Tokens (JWT) :

```python
# JWT Configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "mysecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 jour

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")
```

### Fonctions d'authentification principales

1. **verify_password** : Vérifie un mot de passe en clair contre un hash stocké
2. **get_password_hash** : Génère un hash sécurisé d'un mot de passe
3. **get_user_by_email** : Récupère un utilisateur par son email
4. **authenticate_user** : Authentifie un utilisateur par email et mot de passe
5. **create_access_token** : Crée un token JWT
6. **get_current_user** : Récupère l'utilisateur actuel à partir du token JWT
7. **get_admin_user** : Vérifie que l'utilisateur actuel est un admin

## Endpoints API principaux

### Authentification

- **POST /api/auth/token** : Connexion utilisateur et génération de token JWT
- **POST /api/auth/register** : Inscription d'un nouvel utilisateur
- **POST /api/auth/reset-password-request** : Demande de réinitialisation de mot de passe
- **POST /api/auth/reset-password** : Réinitialisation du mot de passe

### Utilisateurs

- **GET /api/users/me** : Informations sur l'utilisateur actuel
- **PUT /api/users/me** : Mise à jour des informations de l'utilisateur actuel
- **GET /api/users/** : Liste de tous les utilisateurs (admin seulement)
- **POST /api/users/** : Création d'un nouvel utilisateur (admin seulement)

### Fournisseurs

- **POST /api/suppliers/** : Création d'un nouveau fournisseur
- **GET /api/suppliers/** : Liste des fournisseurs
- **GET /api/suppliers/{supplier_id}** : Détails d'un fournisseur
- **PUT /api/suppliers/{supplier_id}** : Mise à jour d'un fournisseur
- **POST /api/suppliers/{supplier_id}/documents** : Upload de documents fournisseur

### Templates

- **POST /api/templates/** : Création d'un nouveau template
- **GET /api/templates/** : Liste des templates
- **GET /api/templates/{template_id}** : Détails d'un template
- **DELETE /api/templates/{template_id}** : Suppression d'un template

### Contrats

- **POST /api/contracts/** : Création d'un nouveau contrat
- **GET /api/contracts/** : Liste des contrats
- **GET /api/contracts/{contract_id}** : Détails d'un contrat
- **PUT /api/contracts/{contract_id}** : Mise à jour d'un contrat
- **POST /api/contracts/{contract_id}/generate** : Génération d'un contrat
- **POST /api/contracts/{contract_id}/sign** : Signature d'un contrat
- **GET /api/contracts/{contract_id}/download** : Téléchargement d'un contrat

### Notifications

- **GET /api/notifications/** : Liste des notifications
- **PUT /api/notifications/{notification_id}** : Marquer une notification comme lue
- **PUT /api/notifications/mark-all-read** : Marquer toutes les notifications comme lues

### Conditions générales

- **POST /api/general-conditions/** : Création de conditions générales
- **GET /api/general-conditions/active** : Récupération des conditions générales actives

## Gestion des modèles de données

Les modèles de données sont définis avec Pydantic, qui offre une validation automatique des données et la génération de schémas OpenAPI. Chaque modèle correspond à une entité dans le système.

Voir [Modèles de données](./models.md) pour plus de détails.

## Opérations sur la base de données

Toutes les opérations sur la base de données sont asynchrones grâce à Motor, le driver MongoDB asynchrone pour Python. Par exemple :

```python
# Insertion d'un nouvel utilisateur
await db.users.insert_one(new_user.dict())

# Récupération d'un utilisateur par son email
user = await db.users.find_one({"email": email})

# Mise à jour d'un utilisateur
await db.users.update_one(
    {"id": user_id},
    {"$set": update_data}
)

# Récupération d'une liste d'utilisateurs
users = await db.users.find(query).skip(skip).limit(limit).to_list(limit)
```

## Gestion des fichiers

Le backend gère trois types de fichiers :

1. **Templates** : Modèles de documents pour la génération de contrats
2. **Documents** : Documents uploadés par les fournisseurs
3. **Contrats** : Contrats générés à partir des templates

Les fichiers sont stockés dans le système de fichiers local dans le dossier `/app/backend/uploads/`.

### Upload de fichiers

Les fichiers sont uploadés via FastAPI en utilisant `UploadFile` :

```python
@templates_router.post("/", response_model=Template)
async def create_template(
    name: str = Form(...),
    description: str = Form(None),
    template_type: str = Form(...),
    template_file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_admin_user)
):
    # Sauvegarde du fichier template
    file_extension = os.path.splitext(template_file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_extension}"
    file_path = TEMPLATES_DIR / file_name
    
    with open(file_path, "wb") as f:
        f.write(await template_file.read())
    
    # ...
```

### Extraction de variables

Pour les templates de contrat au format DOCX, le backend extrait automatiquement les variables au format `{{variable_name}}` :

```python
def extract_variables_from_docx(file_path):
    try:
        with open(file_path, "rb") as docx_file:
            result = mammoth.extract_raw_text(docx_file)
            text = result.value
            # Recherche des variables au format {{variable_name}}
            variables = re.findall(r'{{([^}]+)}}', text)
            return list(set(variables))  # Suppression des doublons
    except Exception as e:
        logging.error(f"Error extracting variables from template: {str(e)}")
        return []  # Retourne une liste vide en cas d'erreur
```

### Remplacement de variables et génération de contrats

Lors de la génération d'un contrat, les variables du template sont remplacées par les valeurs fournies :

```python
async def replace_variables_in_docx(template_path, output_path, variable_values):
    try:
        with open(template_path, "rb") as docx_file:
            result = mammoth.convert_to_html(docx_file)
            html = result.value
            
        # Remplacement des variables dans le HTML
        for var_name, var_value in variable_values.items():
            html = html.replace(f"{{{{{var_name}}}}}", var_value)
            
        # Conversion du HTML en DOCX (simplifié)
        with open(output_path, "w") as output_file:
            output_file.write(html)
            
        return True
    except Exception as e:
        logging.error(f"Error replacing variables: {str(e)}")
        return False
```

## Gestion des erreurs

Les erreurs sont gérées de manière cohérente avec des codes HTTP appropriés et des messages d'erreur descriptifs :

```python
if not supplier:
    raise HTTPException(status_code=404, detail="Supplier not found")

if contract["status"] != "pending_signature":
    raise HTTPException(status_code=400, detail="Contract is not in pending signature status")

existing_user = await get_user_by_email(user.email)
if existing_user:
    raise HTTPException(status_code=400, detail="Email already registered")
```

## Middlewares

Le backend utilise plusieurs middlewares, notamment CORS pour permettre les requêtes cross-origin :

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Documentation API

La documentation API est générée automatiquement par FastAPI et est accessible à `/api/docs`. Elle inclut tous les endpoints, modèles, paramètres et réponses possibles.

## Test et débogage

Le backend inclut un endpoint de santé pour vérifier que l'API fonctionne correctement :

```python
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
```

## Déploiement

Le backend est déployé avec Supervisor pour garantir qu'il reste en exécution :

```
[program:backend]
command=/root/.venv/bin/uvicorn backend.server:app --host 0.0.0.0 --port 8001
directory=/app
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/backend.err.log
stdout_logfile=/var/log/supervisor/backend.out.log
```

Voir [Guide de déploiement](./deployment.md) pour plus d'informations sur le déploiement complet.
