import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "./App.css";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";

// API Configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext(null);

const useAuth = () => {
  return React.useContext(AuthContext);
};

// Auth Provider
const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    if (token && user) {
      setCurrentUser(JSON.parse(user));
      // Configure axios to use token in all requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log("Attempting to login with:", email, "Backend URL:", API);
      const response = await axios.post(`${API}/auth/token`, new URLSearchParams({
        'username': email,
        'password': password
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      console.log("Login response:", response.data);
      const { access_token, user_id, is_admin, name } = response.data;
      
      // Store token and user info
      localStorage.setItem("token", access_token);
      
      const user = {
        id: user_id,
        name: name || email,
        isAdmin: is_admin
      };
      
      localStorage.setItem("user", JSON.stringify(user));
      
      // Set current user
      setCurrentUser(user);
      
      // Configure axios to use token in all requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    delete axios.defaults.headers.common["Authorization"];
  };

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

// ProtectedRoute Component
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
  
  if (!currentUser) {
    return null;
  }
  
  if (requireAdmin && !isAdmin) {
    return null;
  }
  
  return children;
};

// Components
const Navbar = () => {
  const { currentUser, logout, isAdmin, isLoggedIn } = useAuth();
  const { t, language, changeLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleLanguage = () => {
    changeLanguage(language === 'fr' ? 'en' : 'fr');
  };

  return (
    <nav className="bg-white shadow-sm dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="gradient-text text-xl">
                {t('app_name')} ✨
              </Link>
            </div>
            {isLoggedIn && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {isAdmin && (
                  <>
                    <Link to="/suppliers" className={`nav-link ${isActive("/suppliers")}`}>
                      {t('suppliers')} 🏢
                    </Link>
                    <Link to="/contracts" className={`nav-link ${isActive("/contracts")}`}>
                      {t('contracts')} 📝
                    </Link>
                    <Link to="/templates" className={`nav-link ${isActive("/templates")}`}>
                      {t('templates')} 📄
                    </Link>
                    <Link to="/general-conditions" className={`nav-link ${isActive("/general-conditions")}`}>
                      {t('terms')} 📋
                    </Link>
                  </>
                )}
                {!isAdmin && (
                  <>
                    <Link to="/profile" className={`nav-link ${isActive("/profile")}`}>
                      {t('profile')} 👤
                    </Link>
                    <Link to="/my-contracts" className={`nav-link ${isActive("/my-contracts")}`}>
                      {t('my_contracts')} 📝
                    </Link>
                    <Link to="/my-invoices" className={`nav-link ${isActive("/my-invoices")}`}>
                      {t('my_invoices')} 💰
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button
              className="ml-3 px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 flex items-center"
              onClick={toggleLanguage}
            >
              <span className="mr-2">{language === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
              <span>{language === 'fr' ? 'FR' : 'EN'}</span>
            </button>
            
            {!isLoggedIn ? (
              <button 
                className="btn-primary ml-3"
                onClick={() => navigate("/login")}
              >
                {t('sign_in')}
              </button>
            ) : (
              <div className="flex items-center">
                <span className="mr-4 text-sm text-gray-700 dark:text-gray-300">
                  {currentUser.name} {isAdmin && "👑"}
                </span>
                <button 
                  className="btn-secondary"
                  onClick={handleLogout}
                >
                  {t('sign_out')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Home Component
const Home = () => {
  const { currentUser, isAdmin } = useAuth();
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          {t('dashboard')}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300 mb-2">
              {isAdmin ? t('pending_contracts') : t('my_contracts')}
            </h3>
            <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">
              0
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-700 dark:text-green-300 mb-2">
              {isAdmin ? t('suppliers') : t('my_invoices')}
            </h3>
            <p className="text-3xl font-bold text-green-800 dark:text-green-200">
              0
            </p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-purple-700 dark:text-purple-300 mb-2">
              {t('pending_approvals')}
            </h3>
            <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">
              0
            </p>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
            {t('recent_activity')}
          </h2>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                {t('no_results')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Login Component
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
    
    if (!email || !password) {
      setError(t('required_field'));
      return;
    }
    
    setLoading(true);
    setError("");
    
    const success = await login(email, password);
    
    if (success) {
      navigate("/dashboard");
    } else {
      setError(t('login_failed'));
    }
    
    setLoading(false);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl gradient-text font-extrabold">
            {t('app_name')} ✨
          </h1>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
            {t('sign_in')}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">{t('email')}</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-input rounded-t-md"
                placeholder={t('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">{t('password')}</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="form-input rounded-b-md"
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}
          
          <div>
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? t('loading') : t('sign_in')}
            </button>
          </div>
          
          <div className="text-center text-sm">
            <a href="#" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              {t('forgot_password')}
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

// Supplier Components
const SuppliersList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get(`${API}/suppliers`);
        setSuppliers(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        setError(error.toString());
        setLoading(false);
      }
    };
    
    fetchSuppliers();
  }, []);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          {t('loading')}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t('suppliers')}
        </h1>
        <button
          className="btn-primary"
          onClick={() => navigate("/suppliers/new")}
        >
          {t('add_supplier')}
        </button>
      </div>
      
      {suppliers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-gray-600 dark:text-gray-300 text-center">
            {t('no_results')}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="table-header">{t('company_name')}</th>
                <th className="table-header">{t('siret_number')}</th>
                <th className="table-header">{t('contact_person')}</th>
                <th className="table-header">{t('status')}</th>
                <th className="table-header">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="table-cell">{supplier.company_name}</td>
                  <td className="table-cell">{supplier.siret || "-"}</td>
                  <td className="table-cell">{supplier.contact_name || "-"}</td>
                  <td className="table-cell">
                    <span className={`status-badge status-${supplier.status}`}>
                      {t(`status_${supplier.status}`)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        className="btn-icon"
                        onClick={() => navigate(`/suppliers/${supplier.id}`)}
                        title={t('view')}
                      >
                        👁️
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => navigate(`/suppliers/edit/${supplier.id}`)}
                        title={t('edit')}
                      >
                        ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const SupplierForm = () => {
  const { supplierId } = useParams();
  const [supplier, setSupplier] = useState({
    company_name: "",
    siret: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    postal_code: "",
    city: "",
    country: "",
    status: "pending"
  });
  const [loading, setLoading] = useState(supplierId ? true : false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  useEffect(() => {
    if (supplierId) {
      const fetchSupplier = async () => {
        try {
          const response = await axios.get(`${API}/suppliers/${supplierId}`);
          setSupplier(response.data);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching supplier:", error);
          setError(error.toString());
          setLoading(false);
        }
      };
      
      fetchSupplier();
    }
  }, [supplierId]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSupplier(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!supplier.company_name || !supplier.email) {
      setError(t('required_field'));
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      if (supplierId) {
        await axios.put(`${API}/suppliers/${supplierId}`, supplier);
      } else {
        await axios.post(`${API}/suppliers`, supplier);
      }
      
      navigate("/suppliers");
    } catch (error) {
      console.error("Error saving supplier:", error);
      setError(error.toString());
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          {t('loading')}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          {supplierId ? t('edit_supplier') : t('add_supplier')}
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="form-label">{t('company_name')} *</label>
              <input
                type="text"
                name="company_name"
                className="form-input"
                value={supplier.company_name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <label className="form-label">{t('siret_number')}</label>
              <input
                type="text"
                name="siret"
                className="form-input"
                value={supplier.siret}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                Le SIRET est un numéro d'identification d'entreprise à 14 chiffres.
              </p>
            </div>
            
            <div>
              <label className="form-label">{t('contact_person')}</label>
              <input
                type="text"
                name="contact_name"
                className="form-input"
                value={supplier.contact_name}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="form-label">{t('email')} *</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={supplier.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <label className="form-label">{t('phone')}</label>
              <input
                type="text"
                name="phone"
                className="form-input"
                value={supplier.phone}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="form-label">{t('address')}</label>
              <input
                type="text"
                name="address"
                className="form-input"
                value={supplier.address}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="form-label">{t('postal_code')}</label>
              <input
                type="text"
                name="postal_code"
                className="form-input"
                value={supplier.postal_code}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="form-label">{t('city')}</label>
              <input
                type="text"
                name="city"
                className="form-input"
                value={supplier.city}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="form-label">{t('country')}</label>
              <input
                type="text"
                name="country"
                className="form-input"
                value={supplier.country}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="form-label">{t('status')}</label>
              <select
                name="status"
                className="form-input"
                value={supplier.status}
                onChange={handleChange}
              >
                <option value="pending">{t('status_pending')}</option>
                <option value="active">{t('status_active')}</option>
                <option value="inactive">{t('status_inactive')}</option>
                <option value="blocked">{t('status_rejected')}</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/suppliers")}
            >
              {t('cancel')}
            </button>
            
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('saving')}
                </span>
              ) : (
                t('save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SupplierDetail = () => {
  const { supplierId } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const response = await axios.get(`${API}/suppliers/${supplierId}`);
        setSupplier(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching supplier:", error);
        setError(error.toString());
        setLoading(false);
      }
    };
    
    fetchSupplier();
  }, [supplierId]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          {t('loading')}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t('supplier_details')}
          </h1>
          <div className="flex space-x-2">
            <button
              className="btn-secondary"
              onClick={() => navigate(`/suppliers/edit/${supplierId}`)}
            >
              {t('edit')} ✏️
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate("/suppliers")}
            >
              {t('back')}
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('company_name')}
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {supplier.company_name}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('siret_number')}
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {supplier.siret || "-"}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('contact_person')}
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {supplier.contact_name || "-"}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('email')}
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {supplier.email}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('phone')}
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {supplier.phone || "-"}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('status')}
              </p>
              <span className={`status-badge status-${supplier.status}`}>
                {t(`status_${supplier.status}`)}
              </span>
            </div>
            
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('address')}
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {[
                  supplier.address,
                  supplier.postal_code,
                  supplier.city,
                  supplier.country
                ].filter(Boolean).join(", ") || "-"}
              </p>
            </div>
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
              {t('supplier_documents')}
            </h2>
            
            {supplier.documents && supplier.documents.length > 0 ? (
              <div className="bg-white dark:bg-gray-700 shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="table-header">{t('document_name')}</th>
                      <th className="table-header">{t('document_category')}</th>
                      <th className="table-header">{t('document_date')}</th>
                      <th className="table-header">{t('status')}</th>
                      <th className="table-header">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {supplier.documents.map((doc) => (
                      <tr key={doc.id}>
                        <td className="table-cell">{doc.name}</td>
                        <td className="table-cell">{doc.category}</td>
                        <td className="table-cell">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                        <td className="table-cell">
                          <span className={`status-badge status-${doc.status}`}>
                            {t(`status_${doc.status}`)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <button className="btn-icon" title={t('view')}>
                            👁️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  {t('no_results')}
                </p>
              </div>
            )}
            
            <div className="mt-4">
              <button className="btn-primary">
                {t('add_document')} 📄
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Contract Components
const ContractsList = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await axios.get(`${API}/contracts`);
        setContracts(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching contracts:", error);
        setError(error.toString());
        setLoading(false);
      }
    };
    
    fetchContracts();
  }, []);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          {t('loading')}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t('contracts')}
        </h1>
        <button
          className="btn-primary"
          onClick={() => navigate("/contracts/new")}
        >
          {t('generate_contract')}
        </button>
      </div>
      
      {contracts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-gray-600 dark:text-gray-300 text-center">
            {t('no_results')}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="table-header">{t('contract_name')}</th>
                <th className="table-header">{t('suppliers')}</th>
                <th className="table-header">{t('start_date')}</th>
                <th className="table-header">{t('end_date')}</th>
                <th className="table-header">{t('status')}</th>
                <th className="table-header">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {contracts.map((contract) => (
                <tr key={contract.id}>
                  <td className="table-cell">{contract.name}</td>
                  <td className="table-cell">{contract.supplier_id}</td>
                  <td className="table-cell">
                    {contract.start_date ? new Date(contract.start_date).toLocaleDateString() : "-"}
                  </td>
                  <td className="table-cell">
                    {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : "-"}
                  </td>
                  <td className="table-cell">
                    <span className={`status-badge status-${contract.status}`}>
                      {t(`status_${contract.status}`)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        className="btn-icon"
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                        title={t('view')}
                      >
                        👁️
                      </button>
                      {contract.status === "draft" && (
                        <button
                          className="btn-icon"
                          title={t('generate_contract')}
                        >
                          📄
                        </button>
                      )}
                      {contract.status === "pending_signature" && (
                        <button
                          className="btn-icon"
                          title={t('sign_contract')}
                        >
                          ✍️
                        </button>
                      )}
                      {contract.status === "signed" && (
                        <button
                          className="btn-icon"
                          title={t('download_contract')}
                        >
                          ⬇️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const GenerateContractForm = () => {
  const [templates, setTemplates] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    supplier_id: "",
    template_id: "",
    start_date: "",
    end_date: "",
    variable_values: {}
  });
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesResponse, suppliersResponse] = await Promise.all([
          axios.get(`${API}/templates`),
          axios.get(`${API}/suppliers`)
        ]);
        
        setTemplates(templatesResponse.data);
        setSuppliers(suppliersResponse.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.toString());
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === "template_id") {
      const template = templates.find(t => t.id === value);
      setSelectedTemplate(template || null);
      
      // Initialize variable values
      if (template) {
        const initialVariableValues = {};
        template.variables.forEach(variable => {
          initialVariableValues[variable] = "";
        });
        
        setFormData(prev => ({
          ...prev,
          variable_values: initialVariableValues
        }));
      }
    }
  };
  
  const handleVariableChange = (variable, value) => {
    setFormData(prev => ({
      ...prev,
      variable_values: {
        ...prev.variable_values,
        [variable]: value
      }
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.supplier_id || !formData.template_id) {
      setError(t('required_field'));
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      await axios.post(`${API}/contracts`, formData);
      
      navigate("/contracts");
    } catch (error) {
      console.error("Error saving contract:", error);
      setError(error.toString());
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          {t('loading')}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          {t('generate_contract')}
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="form-label">{t('contract_name')} *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <label className="form-label">{t('suppliers')} *</label>
              <select
                name="supplier_id"
                className="form-input"
                value={formData.supplier_id}
                onChange={handleChange}
                required
              >
                <option value="">{t('select')}</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.company_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="form-label">{t('templates')} *</label>
              <select
                name="template_id"
                className="form-input"
                value={formData.template_id}
                onChange={handleChange}
                required
              >
                <option value="">{t('select')}</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="form-label">{t('start_date')}</label>
              <input
                type="date"
                name="start_date"
                className="form-input"
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="form-label">{t('end_date')}</label>
              <input
                type="date"
                name="end_date"
                className="form-input"
                value={formData.end_date}
                onChange={handleChange}
              />
            </div>
          </div>
          
          {selectedTemplate && selectedTemplate.variables.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                {t('contract_variables')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedTemplate.variables.map(variable => (
                  <div key={variable}>
                    <label className="form-label">{variable}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.variable_values[variable] || ""}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/contracts")}
            >
              {t('cancel')}
            </button>
            
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('saving')}
                </span>
              ) : (
                t('save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ContractDetail = () => {
  const { contractId } = useParams();
  const [contract, setContract] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const contractResponse = await axios.get(`${API}/contracts/${contractId}`);
        setContract(contractResponse.data);
        
        // Fetch supplier details
        const supplierResponse = await axios.get(`${API}/suppliers/${contractResponse.data.supplier_id}`);
        setSupplier(supplierResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.toString());
        setLoading(false);
      }
    };
    
    fetchData();
  }, [contractId]);
  
  const handleGenerateContract = async () => {
    try {
      await axios.post(`${API}/contracts/${contractId}/generate`);
      
      // Refresh contract data
      const response = await axios.get(`${API}/contracts/${contractId}`);
      setContract(response.data);
    } catch (error) {
      console.error("Error generating contract:", error);
      setError(error.toString());
    }
  };
  
  const handleSignContract = async () => {
    try {
      await axios.post(`${API}/contracts/${contractId}/sign`);
      
      // Refresh contract data
      const response = await axios.get(`${API}/contracts/${contractId}`);
      setContract(response.data);
    } catch (error) {
      console.error("Error signing contract:", error);
      setError(error.toString());
    }
  };
  
  const handleDownloadContract = () => {
    window.open(`${API}/contracts/${contractId}/download`, '_blank');
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          {t('loading')}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t('contract_details')}
          </h1>
          <div className="flex space-x-2">
            {contract.status === "draft" && (
              <button
                className="btn-primary"
                onClick={handleGenerateContract}
              >
                {t('generate_contract')} 📄
              </button>
            )}
            {contract.status === "pending_signature" && (
              <button
                className="btn-primary"
                onClick={handleSignContract}
              >
                {t('sign_contract')} ✍️
              </button>
            )}
            {contract.file_path && (
              <button
                className="btn-secondary"
                onClick={handleDownloadContract}
              >
                {t('download_contract')} ⬇️
              </button>
            )}
            <button
              className="btn-secondary"
              onClick={() => navigate("/contracts")}
            >
              {t('back')}
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('contract_name')}
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {contract.name}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('status')}
              </p>
              <span className={`status-badge status-${contract.status}`}>
                {t(`status_${contract.status}`)}
              </span>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('suppliers')}
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {supplier ? supplier.company_name : contract.supplier_id}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('created_at')}
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {new Date(contract.created_at).toLocaleDateString()}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('start_date')}
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {contract.start_date ? new Date(contract.start_date).toLocaleDateString() : "-"}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('end_date')}
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : "-"}
              </p>
            </div>
            
            {contract.signed_at && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('signed_at')}
                </p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {new Date(contract.signed_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
          
          {contract.variable_values && Object.keys(contract.variable_values).length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                {t('contract_variables')}
              </h2>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(contract.variable_values).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {key}
                      </p>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {value || "-"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Template Components
const TemplatesList = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useLanguage();
  
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get(`${API}/templates`);
        setTemplates(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching templates:", error);
        setError(error.toString());
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);
  
  const handleUploadTemplate = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("name", e.target.name.value);
    formData.append("description", e.target.description.value);
    formData.append("template_type", e.target.template_type.value);
    formData.append("template_file", e.target.template_file.files[0]);
    
    try {
      await axios.post(`${API}/templates`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      
      // Refresh templates
      const response = await axios.get(`${API}/templates`);
      setTemplates(response.data);
      
      // Reset form
      e.target.reset();
    } catch (error) {
      console.error("Error uploading template:", error);
      setError(error.toString());
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          {t('loading')}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              {t('templates')}
            </h1>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            {templates.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  {t('no_results')}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="table-header">{t('template_name')}</th>
                      <th className="table-header">{t('document_type')}</th>
                      <th className="table-header">{t('template_variables')}</th>
                      <th className="table-header">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {templates.map((template) => (
                      <tr key={template.id}>
                        <td className="table-cell">{template.name}</td>
                        <td className="table-cell">{template.type}</td>
                        <td className="table-cell">
                          {template.variables.length > 0 ? (
                            <span className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-full">
                              {template.variables.length} {t('variables')}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="table-cell">
                          <div className="flex space-x-2">
                            <button
                              className="btn-icon"
                              title={t('view')}
                            >
                              👁️
                            </button>
                            <button
                              className="btn-icon text-red-500"
                              title={t('delete')}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
              {t('add_template')}
            </h2>
            
            <form onSubmit={handleUploadTemplate}>
              <div className="space-y-4">
                <div>
                  <label className="form-label">{t('template_name')} *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">{t('description')}</label>
                  <textarea
                    name="description"
                    className="form-input"
                    rows="3"
                  ></textarea>
                </div>
                
                <div>
                  <label className="form-label">{t('document_type')} *</label>
                  <select
                    name="template_type"
                    className="form-input"
                    required
                  >
                    <option value="contract">{t('contracts')}</option>
                    <option value="invoice">{t('invoice')}</option>
                    <option value="purchase_order">{t('purchase_orders')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">{t('template_file')} *</label>
                  <input
                    type="file"
                    name="template_file"
                    className="form-input"
                    accept=".docx,.doc,.pdf,.txt"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: .docx, .doc, .pdf, .txt
                  </p>
                </div>
                
                <div>
                  <button type="submit" className="btn-primary w-full">
                    {t('upload')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// General Conditions Component
const GeneralConditions = () => {
  const [generalConditions, setGeneralConditions] = useState({
    content: "",
    version: "1.0"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useLanguage();
  
  useEffect(() => {
    const fetchGeneralConditions = async () => {
      try {
        const response = await axios.get(`${API}/general-conditions/active`);
        setGeneralConditions(response.data);
        setLoading(false);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // No active general conditions
          setLoading(false);
        } else {
          console.error("Error fetching general conditions:", error);
          setError(error.toString());
          setLoading(false);
        }
      }
    };
    
    fetchGeneralConditions();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setGeneralConditions(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!generalConditions.content || !generalConditions.version) {
      setError(t('required_field'));
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      await axios.post(`${API}/general-conditions`, generalConditions);
      
      setSaving(false);
    } catch (error) {
      console.error("Error saving general conditions:", error);
      setError(error.toString());
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          {t('loading')}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          {t('terms')}
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label">{t('version')} *</label>
            <input
              type="text"
              name="version"
              className="form-input"
              value={generalConditions.version}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="form-label">{t('content')} *</label>
            <textarea
              name="content"
              className="form-input h-96"
              value={generalConditions.content}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('saving')}
                </span>
              ) : (
                t('save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Landing Page Component
const LandingPage = () => {
  const navigate = useNavigate();
  const { t, language, changeLanguage } = useLanguage();
  
  const toggleLanguage = () => {
    changeLanguage(language === 'fr' ? 'en' : 'fr');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="gradient-text text-xl">
                  {t('app_name')} ✨
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <button
                className="ml-3 px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 flex items-center"
                onClick={toggleLanguage}
              >
                <span className="mr-2">{language === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
                <span>{language === 'fr' ? 'FR' : 'EN'}</span>
              </button>
              
              <button 
                className="btn-primary ml-3"
                onClick={() => navigate("/login")}
              >
                {t('sign_in')}
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold sm:text-5xl md:text-6xl">
              <span className="block">PRISM'FINANCE</span>
              <span className="block text-indigo-200 mt-2 text-2xl sm:text-3xl">
                {t('landing_tagline')}
              </span>
            </h1>
            <div className="mt-10">
              <a
                href="#features"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-gray-50 shadow-md"
              >
                {t('landing_learn_more')}
              </a>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center ml-4 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-800 hover:bg-indigo-900 shadow-md"
              >
                {t('landing_login_button')}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div id="features" className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              {t('landing_features_title')}
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-300">
              {t('landing_features_subtitle')}
            </p>
          </div>
          
          <div className="mt-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-md">
                <div className="text-4xl mb-4">📄</div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  {t('landing_feature1_title')}
                </h3>
                <p className="text-gray-500 dark:text-gray-300">
                  {t('landing_feature1_desc')}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-md">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  {t('landing_feature2_title')}
                </h3>
                <p className="text-gray-500 dark:text-gray-300">
                  {t('landing_feature2_desc')}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-md">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  {t('landing_feature3_title')}
                </h3>
                <p className="text-gray-500 dark:text-gray-300">
                  {t('landing_feature3_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-base text-gray-400 dark:text-gray-500">
              &copy; 2025 PRISM'FINANCE. {t('landing_footer_rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Main App Component
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
              <Route path="/suppliers" element={
                <ProtectedRoute requireAdmin={true}>
                  <Navbar />
                  <SuppliersList />
                </ProtectedRoute>
              } />
              <Route path="/suppliers/new" element={
                <ProtectedRoute requireAdmin={true}>
                  <Navbar />
                  <SupplierForm />
                </ProtectedRoute>
              } />
              <Route path="/suppliers/edit/:supplierId" element={
                <ProtectedRoute requireAdmin={true}>
                  <Navbar />
                  <SupplierForm />
                </ProtectedRoute>
              } />
              <Route path="/suppliers/:supplierId" element={
                <ProtectedRoute requireAdmin={true}>
                  <Navbar />
                  <SupplierDetail />
                </ProtectedRoute>
              } />
              <Route path="/contracts" element={
                <ProtectedRoute requireAdmin={true}>
                  <Navbar />
                  <ContractsList />
                </ProtectedRoute>
              } />
              <Route path="/contracts/new" element={
                <ProtectedRoute requireAdmin={true}>
                  <Navbar />
                  <GenerateContractForm />
                </ProtectedRoute>
              } />
              <Route path="/contracts/:contractId" element={
                <ProtectedRoute>
                  <Navbar />
                  <ContractDetail />
                </ProtectedRoute>
              } />
              <Route path="/templates" element={
                <ProtectedRoute requireAdmin={true}>
                  <Navbar />
                  <TemplatesList />
                </ProtectedRoute>
              } />
              <Route path="/general-conditions" element={
                <ProtectedRoute requireAdmin={true}>
                  <Navbar />
                  <GeneralConditions />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
