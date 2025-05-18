import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AppLayout({ children }) {
  const { currentUser, logout } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [language, setLanguage] = useState('fr');
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

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API}/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      ));
      setUnreadNotifications(Math.max(0, unreadNotifications - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification click for navigation
  const handleNotificationNav = (notification) => {
    markAsRead(notification.id);
    setShowNotifications(false);

    // Navigate based on target type
    if (notification.target_type && notification.target_id) {
      navigate(`/${notification.target_type}s/${notification.target_id}`);
    }
  };

  // Toggle language
  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
    // In a real app, you would also update i18n settings here
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white shadow dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/dashboard" className="gradient-text text-xl font-bold">
                  PRISM'FINANCE ✨
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {/* Admin Navigation */}
                {currentUser && (currentUser.isAdmin || currentUser.isSuperAdmin) && (
                  <>
                    <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                      Dashboard 📊
                    </Link>
                    <Link to="/suppliers" className={`nav-link ${isActive('/suppliers') ? 'active' : ''}`}>
                      Suppliers 🏢
                    </Link>
                    <Link to="/contracts" className={`nav-link ${isActive('/contracts') ? 'active' : ''}`}>
                      Contracts 📝
                    </Link>
                    <Link to="/templates" className={`nav-link ${isActive('/templates') ? 'active' : ''}`}>
                      Templates 📄
                    </Link>
                    <Link to="/purchase-orders" className={`nav-link ${isActive('/purchase-orders') ? 'active' : ''}`}>
                      Purchase Orders 📋
                    </Link>
                    <Link to="/invoices" className={`nav-link ${isActive('/invoices') ? 'active' : ''}`}>
                      Invoices 💰
                    </Link>
                  </>
                )}

                {/* Super Admin Navigation */}
                {currentUser && currentUser.isSuperAdmin && (
                  <Link to="/companies" className={`nav-link ${isActive('/companies') ? 'active' : ''}`}>
                    Companies 🏢
                  </Link>
                )}

                {/* Supplier Navigation */}
                {currentUser && currentUser.isSupplier && (
                  <>
                    <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                      Dashboard 📊
                    </Link>
                    <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
                      My Profile 👤
                    </Link>
                    <Link to="/my-documents" className={`nav-link ${isActive('/my-documents') ? 'active' : ''}`}>
                      Documents 📄
                    </Link>
                    <Link to="/my-contracts" className={`nav-link ${isActive('/my-contracts') ? 'active' : ''}`}>
                      Contracts 📝
                    </Link>
                    <Link to="/my-purchase-orders" className={`nav-link ${isActive('/my-purchase-orders') ? 'active' : ''}`}>
                      Orders 📋
                    </Link>
                    <Link to="/my-invoices" className={`nav-link ${isActive('/my-invoices') ? 'active' : ''}`}>
                      Invoices 💰
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              {/* Language Selector */}
              <button 
                onClick={toggleLanguage}
                className="rounded-full p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {language === 'fr' ? '🇫🇷' : '🇬🇧'}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={handleNotificationClick}
                  className="rounded-full p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 relative"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        <button 
                          onClick={() => setShowNotifications(false)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            No notifications
                          </div>
                        ) : (
                          notifications.map(notification => (
                            <button 
                              key={notification.id}
                              onClick={() => handleNotificationNav(notification)}
                              className={`w-full text-left px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${!notification.read ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : ''}`}
                            >
                              <div className="flex justify-between">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(notification.created_at).toLocaleString(undefined, { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {notification.message}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                          <button 
                            onClick={async () => {
                              try {
                                await axios.put(`${API}/notifications/read-all`);
                                setNotifications(notifications.map(n => ({ ...n, read: true })));
                                setUnreadNotifications(0);
                              } catch (error) {
                                console.error('Error marking all as read:', error);
                              }
                            }}
                            className="text-xs text-[#004A58] hover:text-[#006d83] dark:text-[#80CED7] dark:hover:text-white"
                          >
                            Mark all as read
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                  {currentUser?.name}
                </span>
                <button
                  onClick={logout}
                  className="btn-secondary text-sm"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} PRISM'FINANCE. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
