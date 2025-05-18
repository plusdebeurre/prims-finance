import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "./App.css";

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
      const response = await axios.post(`${API}/auth/token`, new URLSearchParams({
        'username': email,
        'password': password
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
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
      navigate("/");
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
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-sm dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="gradient-text text-xl">
                PRISM'FINANCE ✨
              </Link>
            </div>
            {isLoggedIn && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {isAdmin && (
                  <>
                    <Link to="/suppliers" className={`nav-link ${isActive("/suppliers")}`}>
                      Suppliers 🏢
                    </Link>
                    <Link to="/contracts" className={`nav-link ${isActive("/contracts")}`}>
                      Contracts 📝
                    </Link>
                    <Link to="/templates" className={`nav-link ${isActive("/templates")}`}>
                      Templates 📄
                    </Link>
                    <Link to="/general-conditions" className={`nav-link ${isActive("/general-conditions")}`}>
                      Terms 📋
                    </Link>
                  </>
                )}
                {!isAdmin && (
                  <>
                    <Link to="/profile" className={`nav-link ${isActive("/profile")}`}>
                      My Profile 👤
                    </Link>
                    <Link to="/my-contracts" className={`nav-link ${isActive("/my-contracts")}`}>
                      My Contracts 📝
                    </Link>
                    <Link to="/my-invoices" className={`nav-link ${isActive("/my-invoices")}`}>
                      My Invoices 💰
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {!isLoggedIn ? (
              <button 
                className="btn-primary"
                onClick={() => navigate("/login")}
              >
                Sign In
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
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Login Page
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If already logged in, redirect to home
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const success = await login(email, password);
      if (success) {
        navigate("/");
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold tracking-tight gradient-text mb-2">
          PRISM'FINANCE
        </h1>
        <h2 className="mt-2 text-center text-xl font-semibold text-gray-700 dark:text-gray-300">
          Sign in to your account ✨
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="modern-card py-8 px-4 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="notification error">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="admin@prismfinance.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="loader mr-2"></span>
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="text-sm text-center text-gray-600 dark:text-gray-400">
              <p>Demo Credentials:</p>
              <p className="mt-1 font-medium text-[#004A58] dark:text-[#80CED7]">
                Email: admin@prismfinance.com<br />
                Password: admin123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Home Page
const Home = () => {
  const { isLoggedIn, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-900">
      <main>
        {/* Hero section */}
        <div className="hero">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="relative shadow-xl sm:rounded-2xl sm:overflow-hidden">
              <div className="absolute inset-0">
                <img
                  className="h-full w-full object-cover"
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80"
                  alt="People working on laptops"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#004A58] to-[#006d83] mix-blend-multiply" />
              </div>
              <div className="hero-content">
                <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  <span className="block">PRISM'FINANCE ✨</span>
                  <span className="block text-[#a1dbe1]">Supplier Management</span>
                </h1>
                <p className="mt-6 max-w-lg mx-auto text-center text-xl text-white sm:max-w-3xl">
                  Manage your suppliers, contracts, and compliance documents in one elegant platform
                </p>
                <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                  <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                    {isLoggedIn ? (
                      <>
                        <button
                          onClick={() => navigate(isAdmin ? "/suppliers" : "/profile")}
                          className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-[#004A58] bg-white hover:bg-[#F5F5F5] sm:px-8"
                        >
                          {isAdmin ? "View Suppliers 🏢" : "My Profile 👤"}
                        </button>
                        <button
                          onClick={() => navigate(isAdmin ? "/contracts" : "/my-contracts")}
                          className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-[#004A58] bg-opacity-60 hover:bg-opacity-70 sm:px-8"
                        >
                          {isAdmin ? "Manage Contracts 📝" : "My Contracts 📝"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate("/login")}
                          className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-[#004A58] bg-white hover:bg-[#F5F5F5] sm:px-8"
                        >
                          Sign In 🔑
                        </button>
                        <button
                          onClick={() => navigate("/login")}
                          className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-[#004A58] bg-opacity-60 hover:bg-opacity-70 sm:px-8"
                        >
                          Get Started 🚀
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features section */}
        <div className="py-12 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-[#004A58] font-semibold tracking-wide uppercase dark:text-[#80CED7]">Features ✨</h2>
              <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                Simplify Your Supplier Management
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto dark:text-gray-400">
                PRISM'FINANCE helps businesses manage suppliers efficiently and compliantly with French regulations
              </p>
            </div>

            <div className="mt-10">
              <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                <div className="modern-card">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-[#004A58] to-[#006d83] text-white mb-5">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Contract Management 📝</h3>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                    Generate and manage contracts from customizable templates with automatic variable detection
                  </p>
                </div>

                <div className="modern-card">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-[#004A58] to-[#006d83] text-white mb-5">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Supplier Portal 🏢</h3>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                    Provide suppliers with a secure interface to update information and accept your terms
                  </p>
                </div>

                <div className="modern-card">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-[#004A58] to-[#006d83] text-white mb-5">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Compliance Dashboard 📊</h3>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                    Track supplier compliance status with visual indicators and automated alerts
                  </p>
                </div>

                <div className="modern-card">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-[#004A58] to-[#006d83] text-white mb-5">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Automated Notifications 🔔</h3>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                    Receive alerts for document expiration and compliance status changes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Suppliers List
const SuppliersList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get(`${API}/suppliers`);
        setSuppliers(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader mr-3 h-8 w-8 border-4"></div>
        <span className="text-lg text-gray-600 dark:text-gray-400">Loading suppliers...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Suppliers 🏢</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">A list of all suppliers in your account including their name, SIRET, and status.</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => navigate('/suppliers/new')}
            className="btn-primary"
          >
            Add supplier
          </button>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th scope="col">
                      Name
                    </th>
                    <th scope="col">
                      SIRET
                    </th>
                    <th scope="col">
                      Email
                    </th>
                    <th scope="col">
                      Status
                    </th>
                    <th scope="col">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center">
                          <svg className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p>No suppliers found. Add your first supplier to get started.</p>
                          <button 
                            onClick={() => navigate('/suppliers/new')} 
                            className="mt-4 btn-primary"
                          >
                            Add your first supplier
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((supplier) => (
                      <tr key={supplier.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                          {supplier.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{supplier.siret}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{supplier.emails[0]}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="status-badge success">
                            Active
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => navigate(`/suppliers/${supplier.id}`)}
                            className="text-[#004A58] hover:text-[#00353F] dark:text-[#80CED7] dark:hover:text-white"
                          >
                            View<span className="sr-only">, {supplier.name}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Supplier Detail View
const SupplierDetail = () => {
  const { supplierId } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const response = await axios.get(`${API}/suppliers/${supplierId}`);
        setSupplier(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching supplier:", error);
        setError("Failed to load supplier details");
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [supplierId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader mr-3 h-8 w-8 border-4"></div>
        <span className="text-lg text-gray-600 dark:text-gray-400">Loading supplier details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="notification error">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate('/suppliers')}
            className="btn-primary"
          >
            Back to Suppliers
          </button>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="notification warning">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-yellow-800">Supplier not found</p>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate('/suppliers')}
            className="btn-primary"
          >
            Back to Suppliers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{supplier.name}</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => navigate(`/suppliers/edit/${supplier.id}`)}
            className="btn-primary"
          >
            Edit Supplier
          </button>
          <button
            onClick={() => navigate('/suppliers')}
            className="btn-secondary"
          >
            Back to Suppliers
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm overflow-hidden sm:rounded-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Supplier Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Details and documents.</p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-900">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">{supplier.name}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-800">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">SIRET</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">{supplier.siret}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-900">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">VAT Number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">{supplier.vat_number}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-800">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                {supplier.emails.map((email, index) => (
                  <div key={index}>{email}</div>
                ))}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-900">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Profession</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">{supplier.profession || "Not specified"}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-800">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                {supplier.address ? (
                  <div>
                    {supplier.address}<br />
                    {supplier.postal_code} {supplier.city}<br />
                    {supplier.country}
                  </div>
                ) : (
                  "Not specified"
                )}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-900">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Banking Information</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                <div>IBAN: {supplier.iban}</div>
                {supplier.bic && <div>BIC: {supplier.bic}</div>}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-800">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">VAT Information</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                <div>VAT Rates: {supplier.vat_rates.join(", ")}%</div>
                {supplier.vat_exigibility && <div>VAT Exigibility: {supplier.vat_exigibility}</div>}
                {supplier.payment_rule && <div>Payment Rule: {supplier.payment_rule}</div>}
              </dd>
            </div>
            {supplier.notes && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-900">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">{supplier.notes}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Contract Variables</h2>
        {Object.keys(supplier.contract_variables || {}).length > 0 ? (
          <div className="bg-white shadow-sm overflow-hidden sm:rounded-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="px-4 py-5 sm:px-6">
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(supplier.contract_variables).map(([key, value]) => (
                  <li key={key} className="col-span-1 flex shadow-sm rounded-md">
                    <div className="bg-[#004A58] flex-shrink-0 flex items-center justify-center w-16 text-white text-sm font-medium rounded-l-md">
                      {key.substring(0, 2)}
                    </div>
                    <div className="flex-1 flex items-center justify-between border-t border-r border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-r-md truncate">
                      <div className="flex-1 px-4 py-2 text-sm truncate">
                        <p className="text-gray-500 dark:text-gray-400">{key}</p>
                        <p className="text-gray-900 dark:text-white font-medium">{value}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 px-4 py-5 rounded-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">No contract variables defined yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Supplier Form
const SupplierForm = () => {
  const { supplierId } = useParams();
  const [formData, setFormData] = useState({
    name: "",
    siret: "",
    vat_number: "",
    profession: "",
    iban: "",
    bic: "",
    vat_rates: [20.0],
    emails: [""],
    address: "",
    postal_code: "",
    city: "",
    country: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!supplierId);
  const navigate = useNavigate();
  const isEditing = !!supplierId;

  useEffect(() => {
    // If editing, fetch the supplier data
    if (isEditing) {
      const fetchSupplier = async () => {
        try {
          const response = await axios.get(`${API}/suppliers/${supplierId}`);
          setFormData(response.data);
          setInitialLoading(false);
        } catch (error) {
          console.error("Error fetching supplier:", error);
          setInitialLoading(false);
        }
      };

      fetchSupplier();
    }
  }, [supplierId, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "emails[0]") {
      setFormData({
        ...formData,
        emails: [value]
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.siret) newErrors.siret = "SIRET is required";
    if (!formData.vat_number) newErrors.vat_number = "VAT number is required";
    if (!formData.iban) newErrors.iban = "IBAN is required";
    if (!formData.emails[0]) newErrors["emails[0]"] = "Email is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (isEditing) {
        await axios.put(`${API}/suppliers/${supplierId}`, formData);
      } else {
        await axios.post(`${API}/suppliers`, formData);
      }
      navigate("/suppliers");
    } catch (error) {
      console.error("Error saving supplier:", error);
      setErrors({
        submit: error.response?.data?.detail || "An error occurred while saving the supplier"
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader mr-3 h-8 w-8 border-4"></div>
        <span className="text-lg text-gray-600 dark:text-gray-400">Loading supplier details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              {isEditing ? "Edit Supplier" : "Add Supplier"}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {isEditing 
                ? "Update supplier information. Required fields are marked with an asterisk (*)."
                : "Add a new supplier to your account. Required fields are marked with an asterisk (*)."}
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow-sm sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6 dark:bg-gray-800">
                {errors.submit && (
                  <div className="notification error">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{errors.submit}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="name" className="form-label">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`form-input ${errors.name ? 'border-red-300' : ''}`}
                      placeholder="Définir un nom"
                    />
                    {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="siret" className="form-label">
                      SIRET *
                    </label>
                    <input
                      type="text"
                      name="siret"
                      id="siret"
                      value={formData.siret}
                      onChange={handleChange}
                      className={`form-input ${errors.siret ? 'border-red-300' : ''}`}
                      placeholder="Entrer le SIRET"
                    />
                    {errors.siret && <p className="mt-2 text-sm text-red-600">{errors.siret}</p>}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="vat_number" className="form-label">
                      VAT Number *
                    </label>
                    <input
                      type="text"
                      name="vat_number"
                      id="vat_number"
                      value={formData.vat_number}
                      onChange={handleChange}
                      className={`form-input ${errors.vat_number ? 'border-red-300' : ''}`}
                      placeholder="Définir un numéro de TVA"
                    />
                    {errors.vat_number && <p className="mt-2 text-sm text-red-600">{errors.vat_number}</p>}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="profession" className="form-label">
                      Profession
                    </label>
                    <input
                      type="text"
                      name="profession"
                      id="profession"
                      value={formData.profession}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Renseigner la profession"
                    />
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="address" className="form-label">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      id="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <label htmlFor="postal_code" className="form-label">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postal_code"
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <label htmlFor="city" className="form-label">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      id="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <label htmlFor="country" className="form-label">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      id="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="iban" className="form-label">
                      IBAN *
                    </label>
                    <input
                      type="text"
                      name="iban"
                      id="iban"
                      value={formData.iban}
                      onChange={handleChange}
                      className={`form-input ${errors.iban ? 'border-red-300' : ''}`}
                      placeholder="XXXX XXXX XXXX XXXX XXXX XXXX XXX"
                    />
                    {errors.iban && <p className="mt-2 text-sm text-red-600">{errors.iban}</p>}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="bic" className="form-label">
                      BIC
                    </label>
                    <input
                      type="text"
                      name="bic"
                      id="bic"
                      value={formData.bic}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="emails[0]" className="form-label">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="emails[0]"
                      id="emails[0]"
                      value={formData.emails[0]}
                      onChange={handleChange}
                      className={`form-input ${errors["emails[0]"] ? 'border-red-300' : ''}`}
                      placeholder="email@example.com"
                    />
                    {errors["emails[0]"] && <p className="mt-2 text-sm text-red-600">{errors["emails[0]"]}</p>}
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="notes" className="form-label">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Ajouter des notes à ce fournisseur"
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 dark:bg-gray-700">
                <button
                  type="button"
                  onClick={() => navigate('/suppliers')}
                  className="btn-secondary mr-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <span className="loader mr-2"></span>
                      Saving...
                    </span>
                  ) : (
                    isEditing ? 'Update' : 'Save'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Contracts List
const ContractsList = () => {
  const [contracts, setContracts] = useState([]);
  const [suppliers, setSuppliers] = useState({});
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contractsRes, suppliersRes, templatesRes] = await Promise.all([
          axios.get(`${API}/contracts`),
          axios.get(`${API}/suppliers`),
          axios.get(`${API}/contract-templates`)
        ]);
        
        // Create lookup maps for suppliers and templates
        const suppliersMap = {};
        suppliersRes.data.forEach(supplier => {
          suppliersMap[supplier.id] = supplier;
        });
        
        const templatesMap = {};
        templatesRes.data.forEach(template => {
          templatesMap[template.id] = template;
        });
        
        setContracts(contractsRes.data);
        setSuppliers(suppliersMap);
        setTemplates(templatesMap);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSupplierName = (supplierId) => {
    return suppliers[supplierId]?.name || 'Unknown';
  };

  const getTemplateName = (templateId) => {
    return templates[templateId]?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader mr-3 h-8 w-8 border-4"></div>
        <span className="text-lg text-gray-600 dark:text-gray-400">Loading contracts...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Contracts 📝</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">A list of all contracts in your account including their status and supplier.</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => navigate('/contracts/new')}
            className="btn-primary"
            disabled={Object.keys(templates).length === 0 || Object.keys(suppliers).length === 0}
          >
            Generate contract
          </button>
        </div>
      </div>
      {(Object.keys(templates).length === 0 || Object.keys(suppliers).length === 0) && (
        <div className="mt-4 p-4 border border-yellow-400 bg-yellow-50 rounded-md dark:bg-yellow-900 dark:border-yellow-700">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Missing requirements</h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  {Object.keys(templates).length === 0 && "You need to upload at least one contract template. "}
                  {Object.keys(suppliers).length === 0 && "You need to add at least one supplier. "}
                  {Object.keys(templates).length === 0 && <Link to="/templates" className="font-medium underline">Go to Templates</Link>}
                  {Object.keys(templates).length === 0 && Object.keys(suppliers).length === 0 && " | "}
                  {Object.keys(suppliers).length === 0 && <Link to="/suppliers" className="font-medium underline">Go to Suppliers</Link>}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th scope="col">
                      Supplier
                    </th>
                    <th scope="col">
                      Template
                    </th>
                    <th scope="col">
                      Status
                    </th>
                    <th scope="col">
                      Created
                    </th>
                    <th scope="col">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center">
                          <svg className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p>No contracts found. Generate your first contract to get started.</p>
                          {Object.keys(templates).length > 0 && Object.keys(suppliers).length > 0 && (
                            <button 
                              onClick={() => navigate('/contracts/new')} 
                              className="mt-4 btn-primary"
                            >
                              Generate your first contract
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    contracts.map((contract) => (
                      <tr key={contract.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                          {getSupplierName(contract.supplier_id)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {getTemplateName(contract.template_id)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`status-badge ${
                            contract.status === 'signed' 
                              ? 'success' 
                              : contract.status === 'draft' 
                                ? 'warning' 
                                : 'info'
                          }`}>
                            {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(contract.created_at).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => navigate(`/contracts/${contract.id}`)}
                            className="text-[#004A58] hover:text-[#00353F] dark:text-[#80CED7] dark:hover:text-white"
                          >
                            View<span className="sr-only">, contract</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Contract Detail View
const ContractDetail = () => {
  const { contractId } = useParams();
  const [contract, setContract] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const contractRes = await axios.get(`${API}/contracts/${contractId}`);
        setContract(contractRes.data);
        
        // Fetch supplier and template data
        const [supplierRes, templateRes] = await Promise.all([
          axios.get(`${API}/suppliers/${contractRes.data.supplier_id}`),
          axios.get(`${API}/contract-templates/${contractRes.data.template_id}`)
        ]);
        
        setSupplier(supplierRes.data);
        setTemplate(templateRes.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching contract:", error);
        setError("Failed to load contract details");
        setLoading(false);
      }
    };

    fetchData();
  }, [contractId]);

  const handleSignContract = async () => {
    try {
      await axios.post(`${API}/contracts/${contractId}/sign`);
      const contractRes = await axios.get(`${API}/contracts/${contractId}`);
      setContract(contractRes.data);
    } catch (error) {
      console.error("Error signing contract:", error);
      setError("Failed to sign contract");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader mr-3 h-8 w-8 border-4"></div>
        <span className="text-lg text-gray-600 dark:text-gray-400">Loading contract...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="notification error">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate('/contracts')}
            className="btn-primary"
          >
            Back to Contracts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Contract: {template?.name}
        </h1>
        <div className="flex space-x-4">
          {contract.status !== 'signed' && (
            <button
              onClick={handleSignContract}
              className="btn-primary"
            >
              Sign Contract
            </button>
          )}
          <button
            onClick={() => navigate('/contracts')}
            className="btn-secondary"
          >
            Back to Contracts
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm overflow-hidden sm:rounded-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Contract Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Details and status.</p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-900">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Supplier</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                {supplier?.name}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-800">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Template</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                {template?.name}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-900">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2">
                <span className={`status-badge ${
                  contract.status === 'signed' 
                    ? 'success' 
                    : contract.status === 'draft' 
                      ? 'warning' 
                      : 'info'
                }`}>
                  {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                </span>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-800">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                {new Date(contract.created_at).toLocaleString()}
              </dd>
            </div>
            {contract.signed_at && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-900">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Signed</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                  {new Date(contract.signed_at).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="bg-white shadow-sm overflow-hidden sm:rounded-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Contract Preview</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {contract.content ? (
            <div 
              className="p-4 border border-gray-200 rounded-lg dark:border-gray-700 bg-white dark:bg-gray-900 prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: atob(contract.content) }}
            />
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2">Contract content preview is not available</p>
            </div>
          )}
        </div>
      </div>

      {Object.keys(contract.variables).length > 0 && (
        <div className="mt-8 bg-white shadow-sm overflow-hidden sm:rounded-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Contract Variables</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(contract.variables).map(([key, value]) => (
                <li key={key} className="col-span-1 flex shadow-sm rounded-md">
                  <div className="bg-[#004A58] flex-shrink-0 flex items-center justify-center w-16 text-white text-sm font-medium rounded-l-md">
                    {key.substring(0, 2)}
                  </div>
                  <div className="flex-1 flex items-center justify-between border-t border-r border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-r-md truncate">
                    <div className="flex-1 px-4 py-2 text-sm truncate">
                      <p className="text-gray-500 dark:text-gray-400">{key}</p>
                      <p className="text-gray-900 dark:text-white font-medium">{value}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Templates List
const TemplatesList = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get(`${API}/contract-templates`);
        setTemplates(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching templates:", error);
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!templateName || !file) {
      setUploadError("Template name and file are required");
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    
    const formData = new FormData();
    formData.append('name', templateName);
    formData.append('file', file);
    
    try {
      await axios.post(`${API}/contract-templates`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Refresh the templates list
      const response = await axios.get(`${API}/contract-templates`);
      setTemplates(response.data);
      
      // Reset the form
      setTemplateName("");
      setFile(null);
      
      // Show success message
      setUploadSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error("Error uploading template:", error);
      setUploadError(error.response?.data?.detail || "An error occurred while uploading the template");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader mr-3 h-8 w-8 border-4"></div>
        <span className="text-lg text-gray-600 dark:text-gray-400">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Contract Templates 📄</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">Upload and manage contract templates with variable placeholders.</p>
        </div>
      </div>
      
      <div className="mt-8 bg-white shadow-sm sm:rounded-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Upload New Template</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
            <p>Upload a .docx file containing placeholders in the format {"{{VariableName}}"}.</p>
          </div>
          
          {uploadError && (
            <div className="mt-4 notification error">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{uploadError}</p>
              </div>
            </div>
          )}
          
          {uploadSuccess && (
            <div className="mt-4 notification success">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Template uploaded successfully!</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="mt-5">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="templateName" className="form-label">Template Name</label>
                <input
                  type="text"
                  name="templateName"
                  id="templateName"
                  className="form-input"
                  placeholder="Service Contract"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              
              <div className="sm:col-span-6">
                <label className="form-label">Template File</label>
                <div className="file-upload">
                  <input
                    type="file"
                    name="file"
                    id="file"
                    accept=".docx,.doc"
                    onChange={handleFileChange}
                  />
                  <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                    <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-1">{file ? file.name : "Drag and drop a file here, or click to select a file"}</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">Word document (.docx, .doc)</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                className="btn-primary"
                disabled={isUploading}
              >
                {isUploading ? (
                  <span className="flex items-center">
                    <span className="loader mr-2"></span>
                    Uploading...
                  </span>
                ) : (
                  "Upload Template"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th scope="col">
                      Name
                    </th>
                    <th scope="col">
                      Variables
                    </th>
                    <th scope="col">
                      Created
                    </th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {templates.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center">
                          <svg className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p>No templates found. Upload your first template to get started.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    templates.map((template) => (
                      <tr key={template.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                          {template.name}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {template.variables.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {template.variables.map((variable, index) => (
                                <span key={index} className="tag">
                                  {variable}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600">No variables detected</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(template.created_at).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => navigate(`/contracts/new?template=${template.id}`)}
                            className="text-[#004A58] hover:text-[#00353F] dark:text-[#80CED7] dark:hover:text-white"
                          >
                            Use<span className="sr-only">, {template.name}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Generate Contract Form
const GenerateContractForm = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [variables, setVariables] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const templateIdFromUrl = params.get('template');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, templatesRes] = await Promise.all([
          axios.get(`${API}/suppliers`),
          axios.get(`${API}/contract-templates`)
        ]);
        
        setSuppliers(suppliersRes.data);
        setTemplates(templatesRes.data);
        
        // If template ID is provided in URL, select it
        if (templateIdFromUrl) {
          const template = templatesRes.data.find(t => t.id === templateIdFromUrl);
          if (template) {
            setSelectedTemplate(template);
            
            // Initialize variables object with empty strings
            const vars = {};
            template.variables.forEach(variable => {
              vars[variable] = "";
            });
            setVariables(vars);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [templateIdFromUrl]);

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template);
    
    // Initialize variables object with empty strings
    const vars = {};
    template.variables.forEach(variable => {
      vars[variable] = "";
    });
    setVariables(vars);
  };

  const handleSupplierChange = (e) => {
    setSelectedSupplier(e.target.value);
  };

  const handleVariableChange = (e) => {
    const { name, value } = e.target;
    setVariables({
      ...variables,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTemplate || !selectedSupplier) {
      setError("Template and supplier are required");
      return;
    }
    
    setGenerating(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('supplier_id', selectedSupplier);
    formData.append('template_id', selectedTemplate.id);
    formData.append('variables', JSON.stringify(variables));
    
    try {
      const response = await axios.post(`${API}/contracts/generate`, formData);
      navigate(`/contracts/${response.data.id}`);
    } catch (error) {
      console.error("Error generating contract:", error);
      setError(error.response?.data?.detail || "An error occurred while generating the contract");
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader mr-3 h-8 w-8 border-4"></div>
        <span className="text-lg text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  if (templates.length === 0 || suppliers.length === 0) {
    return (
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm sm:rounded-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Missing Requirements</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              <p>
                {templates.length === 0 && "You need to upload at least one contract template. "}
                {suppliers.length === 0 && "You need to add at least one supplier. "}
              </p>
            </div>
            <div className="mt-5">
              {templates.length === 0 && (
                <Link
                  to="/templates"
                  className="btn-primary mr-4"
                >
                  Add Templates
                </Link>
              )}
              {suppliers.length === 0 && (
                <Link
                  to="/suppliers"
                  className="btn-primary"
                >
                  Add Suppliers
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Generate Contract</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Select a template and supplier, then fill in the variable values to generate a contract.
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow-sm sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6 dark:bg-gray-800">
                {error && (
                  <div className="notification error">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="template" className="form-label">
                    Template
                  </label>
                  <select
                    id="template"
                    name="template"
                    className="form-select"
                    value={selectedTemplate?.id || ""}
                    onChange={handleTemplateChange}
                  >
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="supplier" className="form-label">
                    Supplier
                  </label>
                  <select
                    id="supplier"
                    name="supplier"
                    className="form-select"
                    value={selectedSupplier}
                    onChange={handleSupplierChange}
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTemplate && selectedTemplate.variables.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 dark:text-gray-300">Variable Values</h3>
                    <div className="space-y-4">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable}>
                          <label htmlFor={variable} className="form-label">
                            {variable}
                          </label>
                          <input
                            type="text"
                            name={variable}
                            id={variable}
                            value={variables[variable] || ""}
                            onChange={handleVariableChange}
                            className="form-input"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 dark:bg-gray-700">
                <button
                  type="button"
                  onClick={() => navigate('/contracts')}
                  className="btn-secondary mr-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating || !selectedTemplate || !selectedSupplier}
                  className="btn-primary"
                >
                  {generating ? (
                    <span className="flex items-center">
                      <span className="loader mr-2"></span>
                      Generating...
                    </span>
                  ) : (
                    "Generate Contract"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// General Conditions Component
const GeneralConditions = () => {
  const [conditions, setConditions] = useState({
    id: "",
    version: "1.0",
    content: "",
    is_active: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchConditions = async () => {
      try {
        const response = await axios.get(`${API}/general-conditions/active`);
        setConditions(response.data);
        setLoading(false);
      } catch (error) {
        if (error.response?.status === 404) {
          // No active general conditions found, that's okay
          setLoading(false);
        } else {
          console.error("Error fetching general conditions:", error);
          setError("Failed to load general conditions");
          setLoading(false);
        }
      }
    };

    fetchConditions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConditions({
      ...conditions,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      await axios.post(`${API}/general-conditions`, conditions);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving general conditions:", error);
      setError(error.response?.data?.detail || "An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader mr-3 h-8 w-8 border-4"></div>
        <span className="text-lg text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">General Conditions 📋</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage the general conditions that suppliers must accept before uploading invoices.
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow-sm sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6 dark:bg-gray-800">
                {error && (
                  <div className="notification error">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="notification success">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">General conditions saved successfully!</p>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="version" className="form-label">
                    Version
                  </label>
                  <input
                    type="text"
                    name="version"
                    id="version"
                    value={conditions.version}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div>
                  <label htmlFor="content" className="form-label">
                    Content
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    rows={10}
                    value={conditions.content}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter the text of your general conditions..."
                  />
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      checked={conditions.is_active}
                      onChange={(e) => setConditions({...conditions, is_active: e.target.checked})}
                      className="form-checkbox"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_active" className="font-medium text-gray-700 dark:text-gray-300">Active</label>
                    <p className="text-gray-500 dark:text-gray-400">Make these general conditions active. This will deactivate any previously active conditions.</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 dark:bg-gray-700">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? (
                    <span className="flex items-center">
                      <span className="loader mr-2"></span>
                      Saving...
                    </span>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<>
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
  );
}

export default App;
