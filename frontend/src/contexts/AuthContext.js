import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth from localStorage
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('authUser');
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        setCurrentUser(userData);
        
        // Set authorization header for all future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        console.error('Error parsing stored user data:', err);
        logout();
      }
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    setError(null);
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await axios.post(`${API}/auth/token`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const { access_token, user_id, role, name, company_id, supplier_id } = response.data;
      
      // Store token and user info
      localStorage.setItem('authToken', access_token);
      
      const userData = {
        id: user_id,
        email,
        name: name || email,
        role,
        isAdmin: role === 'admin',
        isSuperAdmin: role === 'super_admin',
        isSupplier: role === 'supplier',
        company_id,
        supplier_id
      };
      
      localStorage.setItem('authUser', JSON.stringify(userData));
      setCurrentUser(userData);
      
      // Set authorization header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.detail || 
        'An error occurred during login. Please try again.'
      );
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setCurrentUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // Register function
  const register = async (userData) => {
    setError(null);
    
    try {
      const response = await axios.post(`${API}/auth/register`, userData);
      return response.data;
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.detail || 
        'An error occurred during registration. Please try again.'
      );
      throw err;
    }
  };

  // Password reset request
  const requestPasswordReset = async (email) => {
    setError(null);
    
    try {
      const response = await axios.post(`${API}/auth/forgot-password`, { email });
      return response.data;
    } catch (err) {
      console.error('Password reset request error:', err);
      setError(
        err.response?.data?.detail || 
        'An error occurred. Please try again.'
      );
      throw err;
    }
  };

  // Reset password with token
  const resetPassword = async (token, newPassword) => {
    setError(null);
    
    try {
      const response = await axios.post(`${API}/auth/reset-password`, {
        token,
        new_password: newPassword
      });
      return response.data;
    } catch (err) {
      console.error('Password reset error:', err);
      setError(
        err.response?.data?.detail || 
        'An error occurred. Please try again.'
      );
      throw err;
    }
  };

  // Change password (when logged in)
  const changePassword = async (currentPassword, newPassword) => {
    setError(null);
    
    try {
      const response = await axios.put(`${API}/auth/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      });
      return response.data;
    } catch (err) {
      console.error('Password change error:', err);
      setError(
        err.response?.data?.detail || 
        'An error occurred. Please try again.'
      );
      throw err;
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    setError(null);
    
    try {
      const response = await axios.put(`${API}/auth/me`, userData);
      
      // Update stored user data
      const updatedUser = {
        ...currentUser,
        name: userData.name || currentUser.name
      };
      
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      return response.data;
    } catch (err) {
      console.error('Profile update error:', err);
      setError(
        err.response?.data?.detail || 
        'An error occurred. Please try again.'
      );
      throw err;
    }
  };

  // Get current user profile
  const getUserProfile = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      return response.data;
    } catch (err) {
      console.error('Get profile error:', err);
      
      // If unauthorized, logout
      if (err.response?.status === 401) {
        logout();
      }
      
      throw err;
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    register,
    requestPasswordReset,
    resetPassword,
    changePassword,
    updateProfile,
    getUserProfile,
    error,
    setError,
    loading,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
