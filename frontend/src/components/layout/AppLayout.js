import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AppLayout({ children }) {
  const { currentUser, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check for active path
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Fetch notification count
  useEffect(() => {
    if (!currentUser) return;

    const fetchNotificationCount = async () => {
      try {
        const response = await axios.get(`${API}/notifications/count`);
        setUnreadNotifications(response.data.count);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    fetchNotificationCount();
    // Set up polling for new notifications every minute
    const interval = setInterval(fetchNotificationCount, 60000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Handle notification click
  const handleNotificationClick = () => {
    if (showNotifications) {
      setShowNotifications(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${API}/notifications`);
        setNotifications(response.data);
        setShowNotifications(true);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await axios.post(`${API}/notifications/mark-all-read`);
      // Update notification count and state
      setUnreadNotifications(0);
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({
          ...notification,
          read: true
        }))
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white shadow dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link to="/dashboard" className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004A58] to-[#006d83] dark:from-[#80CED7] dark:to-[#006d83]">
                    PRISM'FINANCE
                  </span>
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:ml-6 md:flex md:space-x-4">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/dashboard')
                      ? 'border-[#004A58] text-gray-900 dark:border-[#80CED7] dark:text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                  }`}
                >
                  {t.dashboard}
                </Link>
                
                {(currentUser?.isAdmin || currentUser?.isSuperAdmin) && (
                  <>
                    <Link
                      to="/suppliers"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive('/suppliers')
                          ? 'border-[#004A58] text-gray-900 dark:border-[#80CED7] dark:text-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      {t.suppliers}
                    </Link>
                    
                    <Link
                      to="/contracts"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive('/contracts')
                          ? 'border-[#004A58] text-gray-900 dark:border-[#80CED7] dark:text-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      {t.contracts}
                    </Link>
                    
                    <Link
                      to="/templates"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive('/templates')
                          ? 'border-[#004A58] text-gray-900 dark:border-[#80CED7] dark:text-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      {t.templates}
                    </Link>
                    
                    <Link
                      to="/purchase-orders"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive('/purchase-orders')
                          ? 'border-[#004A58] text-gray-900 dark:border-[#80CED7] dark:text-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      {t.purchaseOrders}
                    </Link>
                    
                    <Link
                      to="/invoices"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive('/invoices')
                          ? 'border-[#004A58] text-gray-900 dark:border-[#80CED7] dark:text-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      {t.invoices}
                    </Link>
                  </>
                )}
                
                {currentUser?.isSupplier && (
                  <>
                    <Link
                      to="/my-contracts"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive('/my-contracts')
                          ? 'border-[#004A58] text-gray-900 dark:border-[#80CED7] dark:text-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      {t.myContracts}
                    </Link>
                    
                    <Link
                      to="/my-purchase-orders"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive('/my-purchase-orders')
                          ? 'border-[#004A58] text-gray-900 dark:border-[#80CED7] dark:text-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      {t.myPurchaseOrders}
                    </Link>
                    
                    <Link
                      to="/my-invoices"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive('/my-invoices')
                          ? 'border-[#004A58] text-gray-900 dark:border-[#80CED7] dark:text-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      {t.myInvoices}
                    </Link>
                    
                    <Link
                      to="/my-documents"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive('/my-documents')
                          ? 'border-[#004A58] text-gray-900 dark:border-[#80CED7] dark:text-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      {t.myDocuments}
                    </Link>
                  </>
                )}
                
                {currentUser?.isSuperAdmin && (
                  <Link
                    to="/companies"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/companies')
                        ? 'border-[#004A58] text-gray-900 dark:border-[#80CED7] dark:text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                    }`}
                  >
                    Companies
                  </Link>
                )}
              </nav>
            </div>
            
            {/* Right Side Items */}
            <div className="flex items-center">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="rounded-full p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                aria-label="Toggle language"
              >
                {language === 'fr' ? '🇫🇷' : '🇬🇧'}
              </button>
              
              {/* Notifications */}
              <div className="ml-4 relative">
                <button
                  onClick={handleNotificationClick}
                  className="rounded-full p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
                  aria-label="Notifications"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-xs text-white text-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                
                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {t.notificationTitle}
                        </h3>
                        {notifications.length > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-[#004A58] hover:text-[#006d83] dark:text-[#80CED7] dark:hover:text-white"
                          >
                            {t.markAllRead}
                          </button>
                        )}
                      </div>
                      
                      {notifications.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          {t.noNotifications}
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto">
                          {notifications.map((notification) => (
                            <Link
                              key={notification.id}
                              to={notification.link || '#'}
                              className={`block px-4 py-2 text-sm ${
                                notification.read
                                  ? 'text-gray-700 dark:text-gray-300'
                                  : 'text-gray-900 bg-gray-50 dark:text-white dark:bg-gray-700'
                              } hover:bg-gray-100 dark:hover:bg-gray-700`}
                            >
                              <div className="font-medium">{notification.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(notification.created_at).toLocaleString()}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Profile Dropdown */}
              <div className="ml-4 relative">
                <div>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex text-sm rounded-full focus:outline-none"
                    id="user-menu"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {currentUser?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </button>
                </div>
                
                {showProfileMenu && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                        <div className="font-medium">{currentUser?.name || currentUser?.email}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {currentUser?.isSupplier ? 'Supplier' : currentUser?.isAdmin ? 'Admin' : currentUser?.isSuperAdmin ? 'Super Admin' : 'User'}
                        </div>
                      </div>
                      
                      {currentUser?.isSupplier && (
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                          role="menuitem"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          {t.profile}
                        </Link>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        {t.logout}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mobile menu button */}
              <div className="md:hidden ml-4">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 focus:outline-none"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open main menu</span>
                  <svg
                    className={`${showMobileMenu ? 'hidden' : 'block'} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <svg
                    className={`${showMobileMenu ? 'block' : 'hidden'} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className={`${showMobileMenu ? 'block' : 'hidden'} md:hidden border-t border-gray-200 dark:border-gray-700`}>
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/dashboard"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/dashboard')
                  ? 'border-[#004A58] text-[#004A58] bg-[#004A58]/10 dark:border-[#80CED7] dark:text-[#80CED7] dark:bg-[#80CED7]/10'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600'
              }`}
              onClick={() => setShowMobileMenu(false)}
            >
              {t.dashboard}
            </Link>
            
            {(currentUser?.isAdmin || currentUser?.isSuperAdmin) && (
              <>
                <Link
                  to="/suppliers"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/suppliers')
                      ? 'border-[#004A58] text-[#004A58] bg-[#004A58]/10 dark:border-[#80CED7] dark:text-[#80CED7] dark:bg-[#80CED7]/10'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t.suppliers}
                </Link>
                
                <Link
                  to="/contracts"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/contracts')
                      ? 'border-[#004A58] text-[#004A58] bg-[#004A58]/10 dark:border-[#80CED7] dark:text-[#80CED7] dark:bg-[#80CED7]/10'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t.contracts}
                </Link>
                
                <Link
                  to="/templates"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/templates')
                      ? 'border-[#004A58] text-[#004A58] bg-[#004A58]/10 dark:border-[#80CED7] dark:text-[#80CED7] dark:bg-[#80CED7]/10'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t.templates}
                </Link>
                
                <Link
                  to="/purchase-orders"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/purchase-orders')
                      ? 'border-[#004A58] text-[#004A58] bg-[#004A58]/10 dark:border-[#80CED7] dark:text-[#80CED7] dark:bg-[#80CED7]/10'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t.purchaseOrders}
                </Link>
                
                <Link
                  to="/invoices"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/invoices')
                      ? 'border-[#004A58] text-[#004A58] bg-[#004A58]/10 dark:border-[#80CED7] dark:text-[#80CED7] dark:bg-[#80CED7]/10'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t.invoices}
                </Link>
              </>
            )}
            
            {currentUser?.isSupplier && (
              <>
                <Link
                  to="/my-contracts"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/my-contracts')
                      ? 'border-[#004A58] text-[#004A58] bg-[#004A58]/10 dark:border-[#80CED7] dark:text-[#80CED7] dark:bg-[#80CED7]/10'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t.myContracts}
                </Link>
                
                <Link
                  to="/my-purchase-orders"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/my-purchase-orders')
                      ? 'border-[#004A58] text-[#004A58] bg-[#004A58]/10 dark:border-[#80CED7] dark:text-[#80CED7] dark:bg-[#80CED7]/10'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t.myPurchaseOrders}
                </Link>
                
                <Link
                  to="/my-invoices"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/my-invoices')
                      ? 'border-[#004A58] text-[#004A58] bg-[#004A58]/10 dark:border-[#80CED7] dark:text-[#80CED7] dark:bg-[#80CED7]/10'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t.myInvoices}
                </Link>
                
                <Link
                  to="/my-documents"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/my-documents')
                      ? 'border-[#004A58] text-[#004A58] bg-[#004A58]/10 dark:border-[#80CED7] dark:text-[#80CED7] dark:bg-[#80CED7]/10'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t.myDocuments}
                </Link>
              </>
            )}
            
            {currentUser?.isSuperAdmin && (
              <Link
                to="/companies"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive('/companies')
                    ? 'border-[#004A58] text-[#004A58] bg-[#004A58]/10 dark:border-[#80CED7] dark:text-[#80CED7] dark:bg-[#80CED7]/10'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                Companies
              </Link>
            )}
          </div>
          
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {currentUser?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800 dark:text-white">
                  {currentUser?.name || currentUser?.email}
                </div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {currentUser?.isSupplier ? 'Supplier' : currentUser?.isAdmin ? 'Admin' : currentUser?.isSuperAdmin ? 'Super Admin' : 'User'}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {currentUser?.isSupplier && (
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t.profile}
                </Link>
              )}
              
              <button
                onClick={() => {
                  handleLogout();
                  setShowMobileMenu(false);
                }}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
              >
                {t.logout}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="py-6">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()} PRISM'FINANCE. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">
                Terms
              </a>
              <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">
                Privacy
              </a>
              <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">
                Security
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
