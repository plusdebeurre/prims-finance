# Documentation du Frontend PRISM'FINANCE

## Vue d'ensemble

Le frontend de PRISM'FINANCE est une application React moderne qui offre une interface utilisateur riche pour interagir avec le backend FastAPI. Il utilise Tailwind CSS pour le styling, Axios pour les requêtes API, et React Router pour la navigation.

## Technologies utilisées

- **React** : Bibliothèque UI pour la construction d'interfaces utilisateur
- **React Router** : Navigation entre les différentes pages
- **Axios** : Client HTTP pour les requêtes API
- **Tailwind CSS** : Framework CSS utilitaire pour le styling
- **Context API** : Gestion d'état globale (authentification, langue)

## Structure des fichiers

```
/app/frontend/
├── public/               # Fichiers statiques
├── src/                  # Code source React
│   ├── contexts/         # Contextes React
│   │   └── LanguageContext.js # Contexte d'internationalisation
│   ├── api.js            # Service API centralisé
│   ├── App.js            # Composant principal et routing
│   ├── App.css           # Styles CSS/Tailwind
│   ├── index.js          # Point d'entrée
│   └── index.css         # Styles globaux
├── package.json          # Dépendances NPM
├── tailwind.config.js    # Configuration Tailwind
├── postcss.config.js     # Configuration PostCSS
└── .env                  # Variables d'environnement
```

## Points d'entrée principaux

### index.js

Le point d'entrée de l'application qui initialise React :

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### App.js

Le composant principal qui contient la logique de routing et les providers :

```javascript
function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<>
                <Navbar />
                <Home />
              </>} />
              {/* Autres routes... */}
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
```

## Architecture des composants

L'application est composée de plusieurs composants React organisés hiérarchiquement. Voici les principaux :

### Providers de contexte

1. **AuthProvider** : Gère l'état d'authentification et les opérations liées
2. **LanguageProvider** : Gère la langue actuelle et les traductions

### Composants de navigation

1. **Navbar** : Barre de navigation principale avec menu et liens
2. **ProtectedRoute** : Composant HOC pour protéger les routes nécessitant une authentification

### Composants de page

1. **LandingPage** : Page d'accueil pour les utilisateurs non connectés
2. **Login** : Formulaire de connexion
3. **Home** : Dashboard principal après connexion
4. **SuppliersList** : Liste des fournisseurs
5. **SupplierForm** : Formulaire d'ajout/modification de fournisseur
6. **SupplierDetail** : Détails d'un fournisseur
7. **ContractsList** : Liste des contrats
8. **GenerateContractForm** : Formulaire de génération de contrat
9. **ContractDetail** : Détails d'un contrat
10. **TemplatesList** : Liste des templates
11. **GeneralConditions** : Conditions générales

## Service API centralisé

Toutes les requêtes API sont centralisées dans le fichier `api.js` :

```javascript
// Configuration de l'URL backend
export const BACKEND_URL = "https://9fa6a152-5e96-448d-a89b-d3e858a0d36a.preview.emergentagent.com";
export const API = `${BACKEND_URL}/api`;

// Configuration d'axios
axios.defaults.baseURL = BACKEND_URL;

// Intercepteur pour assurer HTTPS
axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('http:')) {
    config.url = config.url.replace('http:', 'https:');
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Fonctions API pour l'authentification
export const authAPI = {
  login: async (email, password) => {
    // ...
  },
  getUserInfo: async () => {
    // ...
  }
};

// Fonctions API pour les fournisseurs
export const suppliersAPI = {
  getAll: async () => {
    // ...
  },
  getById: async (id) => {
    // ...
  },
  // ...
};

// Autres groupes de fonctions API...
```

Cette approche offre plusieurs avantages :
1. **Centralisation** : Tous les appels API sont dans un seul fichier
2. **Réutilisabilité** : Les fonctions API peuvent être importées partout
3. **Maintenance** : Facile à maintenir et à mettre à jour
4. **Cohérence** : Format d'URL et gestion des erreurs cohérents

## Contextes React

### AuthContext

Gère l'état d'authentification et les opérations liées :

```javascript
const AuthContext = React.createContext(null);

const useAuth = () => {
  return React.useContext(AuthContext);
};

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérification du token au chargement
  useEffect(() => {
    // ...
  }, []);

  // Fonction de connexion
  const login = async (email, password) => {
    // ...
  };

  // Fonction de déconnexion
  const logout = () => {
    // ...
  };

  // Valeur du contexte
  const value = {
    currentUser,
    login,
    logout,
    isAdmin: currentUser?.isAdmin || false,
    isLoggedIn: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
```

### LanguageContext

Gère la langue actuelle et les traductions :

```javascript
const LanguageContext = createContext();

export const useLanguage = () => {
  return useContext(LanguageContext);
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('fr'); // Français par défaut
  
  // Fonction pour changer de langue
  const changeLanguage = (newLanguage) => {
    // ...
  };
  
  // Fonction pour obtenir une traduction
  const t = (key) => {
    return translations[language][key] || key;
  };
  
  // Chargement de la préférence de langue sauvegardée
  useEffect(() => {
    // ...
  }, []);
  
  const value = {
    language,
    changeLanguage,
    t
  };
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
```

## Routing et navigation

L'application utilise React Router pour la navigation. Voici comment les routes sont définies :

```javascript
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<LandingPage />} />
  <Route path="/dashboard" element={<>
    <Navbar />
    <Home />
  </>} />
  <Route path="/suppliers" element={
    <ProtectedRoute requireAdmin={true}>
      <Navbar />
      <SuppliersList />
    </ProtectedRoute>
  } />
  {/* Autres routes... */}
</Routes>
```

### ProtectedRoute

Un composant qui protège les routes nécessitant une authentification :

```javascript
const ProtectedRoute = ({ children, requireAdmin }) => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    } else if (requireAdmin && !isAdmin) {
      navigate("/dashboard");
    }
  }, [currentUser, isAdmin, navigate, requireAdmin]);
  
  if (!currentUser || (requireAdmin && !isAdmin)) {
    return null;
  }
  
  return children;
};
```

## Formulaires et validation

Les formulaires sont gérés avec des états React et validés avant soumission :

```javascript
// État du formulaire
const [formData, setFormData] = useState({
  name: "",
  supplier_id: "",
  template_id: "",
  // ...
});

// Gestion des changements de champs
const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

// Soumission du formulaire avec validation
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validation
  if (!formData.name || !formData.supplier_id || !formData.template_id) {
    setError(t('required_field'));
    return;
  }
  
  // Soumission
  try {
    await contractsAPI.create(formData);
    navigate("/contracts");
  } catch (error) {
    setError(error.toString());
  }
};
```

## Styles avec Tailwind CSS

L'application utilise Tailwind CSS pour le styling. Voici quelques exemples :

```jsx
// Bouton primaire
<button className="btn-primary">
  {t('save')}
</button>

// Carte 
<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
    {t('dashboard')}
  </h1>
  {/* ... */}
</div>

// Grille responsive
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* ... */}
</div>
```

Les classes sont configurées dans `App.css` avec des composants Tailwind :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Boutons */
.btn-primary {
  @apply px-4 py-2 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 focus:ring-offset-indigo-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg dark:bg-indigo-700 dark:hover:bg-indigo-600;
}

/* Autres composants... */
```

## Gestion des erreurs

Les erreurs sont gérées à plusieurs niveaux :

1. **Validation côté client** : Avant de soumettre les formulaires
2. **Try/catch** : Autour des appels API
3. **Affichage des erreurs** : Messages d'erreur dans l'UI
4. **Intercepteur Axios** : Pour la gestion globale des erreurs API

```javascript
try {
  // Appel API
} catch (error) {
  console.error("Error:", error);
  setError(error.toString());
} finally {
  setLoading(false);
}
```

## Composants principaux en détail

### LandingPage

```javascript
const LandingPage = () => {
  const navigate = useNavigate();
  const { t, language, changeLanguage } = useLanguage();
  
  const toggleLanguage = () => {
    changeLanguage(language === 'fr' ? 'en' : 'fr');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Barre de navigation */}
      <nav className="bg-white shadow-sm dark:bg-gray-800">
        {/* ... */}
      </nav>
      
      {/* Section héros */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        {/* ... */}
      </div>
      
      {/* Section fonctionnalités */}
      <div id="features" className="py-16 bg-white dark:bg-gray-800">
        {/* ... */}
      </div>
      
      {/* Pied de page */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        {/* ... */}
      </footer>
    </div>
  );
};
```

### Login

```javascript
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email || !password) {
      setError(t('required_field'));
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const success = await login(email, password);
      
      if (success) {
        navigate("/dashboard");
      } else {
        setError(t('login_failed'));
      }
    } catch (err) {
      setError(t('login_failed') + ": " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ... */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {/* ... */}
        </form>
      </div>
    </div>
  );
};
```

### SuppliersList

```javascript
const SuppliersList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await suppliersAPI.getAll();
        setSuppliers(response.data);
      } catch (error) {
        setError(error.toString());
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuppliers();
  }, []);
  
  // Rendu conditionnel selon l'état
  if (loading) return <div>{t('loading')}</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t('suppliers')}</h1>
        <button
          className="btn-primary"
          onClick={() => navigate("/suppliers/new")}
        >
          {t('add_supplier')}
        </button>
      </div>
      
      {suppliers.length === 0 ? (
        <div>{t('no_results')}</div>
      ) : (
        <table className="min-w-full">
          <thead>
            {/* ... */}
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                {/* ... */}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
```

## Mode sombre et responsive design

L'application supporte le mode sombre et le design responsive :

```css
/* Mode sombre */
.dark {
  --primary-color: #818cf8;
  --primary-hover: #6366f1;
  --secondary-color: #94a3b8;
  --secondary-hover: #64748b;
}

/* Classes responsives */
@media (min-width: 768px) {
  .md\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

## Internationalisation

Voir [Internationalisation](./i18n.md) pour plus de détails sur le système d'internationalisation.

## Performance et optimisation

Plusieurs techniques sont utilisées pour optimiser les performances :

1. **Lazy loading** : Chargement des composants à la demande
2. **Memoing** : Utilisation de `useMemo` et `useCallback` pour éviter les re-renders inutiles
3. **Optimistic UI** : Mise à jour de l'UI avant la confirmation du serveur
4. **Debouncing** : Pour les entrées utilisateur qui déclenchent des API calls

## Test et débogage

Plusieurs mécanismes de débogage sont en place :

1. **Console logs** : Logs stratégiquement placés
2. **Affichage des erreurs** : Messages d'erreur dans l'UI
3. **Intercepteur Axios** : Logs des requêtes et réponses

## Déploiement

Le frontend est déployé avec Supervisor pour garantir qu'il reste en exécution :

```
[program:frontend]
command=yarn start
environment=HOST="0.0.0.0",PORT="3000",REACT_APP_BACKEND_URL="http://localhost:8001"
directory=/app/frontend
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/frontend.err.log
stdout_logfile=/var/log/supervisor/frontend.out.log
```

Voir [Guide de déploiement](./deployment.md) pour plus d'informations sur le déploiement complet.
