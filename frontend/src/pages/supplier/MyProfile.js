import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MyProfile() {
  const { currentUser, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company_name: '',
    company_type: '',
    address: '',
    postal_code: '',
    city: '',
    country: '',
    registration_number: '',
    registration_city: '',
    representative_name: '',
    representative_role: '',
    phone: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [changePassword, setChangePassword] = useState(false);

  useEffect(() => {
    if (currentUser) {
      // Populate form with user data
      setFormData({
        ...formData,
        name: currentUser.name || '',
        email: currentUser.email || '',
        company_name: currentUser.company_data?.name || '',
        company_type: currentUser.company_data?.company_type || '',
        address: currentUser.company_data?.address || '',
        postal_code: currentUser.company_data?.postal_code || '',
        city: currentUser.company_data?.city || '',
        country: currentUser.company_data?.country || '',
        registration_number: currentUser.company_data?.registration_number || '',
        registration_city: currentUser.company_data?.registration_city || '',
        representative_name: currentUser.company_data?.representative_name || '',
        representative_role: currentUser.company_data?.representative_role || '',
        phone: currentUser.company_data?.phone || ''
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const validatePassword = () => {
    if (!changePassword) return true;
    
    if (!formData.current_password) {
      setError('Current password is required');
      return false;
    }
    
    if (formData.new_password.length < 8) {
      setError('New password must be at least 8 characters long');
      return false;
    }
    
    if (formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validatePassword()) {
      return;
    }
    
    setLoading(true);
    try {
      const profileData = {
        name: formData.name,
        company_data: {
          name: formData.company_name,
          company_type: formData.company_type,
          address: formData.address,
          postal_code: formData.postal_code,
          city: formData.city,
          country: formData.country,
          registration_number: formData.registration_number,
          registration_city: formData.registration_city,
          representative_name: formData.representative_name,
          representative_role: formData.representative_role,
          phone: formData.phone
        }
      };
      
      if (changePassword) {
        profileData.current_password = formData.current_password;
        profileData.new_password = formData.new_password;
      }
      
      // Update user profile
      await updateUserProfile(profileData);
      
      setSuccess('Profile updated successfully');
      
      // Reset password fields
      setFormData((prevData) => ({
        ...prevData,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
      setChangePassword(false);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold mb-6">My Profile</h1>
      
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-md dark:bg-red-900 dark:border-red-700 dark:text-red-100">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 mb-6 bg-green-50 border border-green-200 text-green-700 rounded-md dark:bg-green-900 dark:border-green-700 dark:text-green-100">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="modern-card p-6">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Personal Information
            </h2>
            
            <div className="mb-4">
              <label htmlFor="name" className="form-label">
                Your Full Name*
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="form-input"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input-disabled"
                value={formData.email}
                disabled
              />
              <p className="form-hint">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>
            
            <div className="pt-4 pb-2">
              <label className="form-label flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox mr-2"
                  checked={changePassword}
                  onChange={() => setChangePassword(!changePassword)}
                />
                Change Password
              </label>
            </div>
            
            {changePassword && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                <div className="mb-4">
                  <label htmlFor="current_password" className="form-label">
                    Current Password*
                  </label>
                  <input
                    id="current_password"
                    name="current_password"
                    type="password"
                    className="form-input"
                    value={formData.current_password}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="new_password" className="form-label">
                    New Password*
                  </label>
                  <input
                    id="new_password"
                    name="new_password"
                    type="password"
                    className="form-input"
                    value={formData.new_password}
                    onChange={handleChange}
                  />
                  <p className="form-hint">
                    Must be at least 8 characters long
                  </p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="confirm_password" className="form-label">
                    Confirm New Password*
                  </label>
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    className="form-input"
                    value={formData.confirm_password}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="modern-card p-6">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Company Information
            </h2>
            
            <div className="mb-4">
              <label htmlFor="company_name" className="form-label">
                Company Name*
              </label>
              <input
                id="company_name"
                name="company_name"
                type="text"
                required
                className="form-input"
                value={formData.company_name}
                onChange={handleChange}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="company_type" className="form-label">
                Company Type*
              </label>
              <select
                id="company_type"
                name="company_type"
                required
                className="form-select"
                value={formData.company_type}
                onChange={handleChange}
              >
                <option value="SAS">SAS</option>
                <option value="SARL">SARL</option>
                <option value="EURL">EURL</option>
                <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                <option value="Entreprise individuelle">Entreprise individuelle</option>
                <option value="Artiste-auteur">Artiste-auteur</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="address" className="form-label">
                Address*
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                className="form-input"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label htmlFor="postal_code" className="form-label">
                  Postal Code*
                </label>
                <input
                  id="postal_code"
                  name="postal_code"
                  type="text"
                  required
                  className="form-input"
                  value={formData.postal_code}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="city" className="form-label">
                  City*
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  className="form-input"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="country" className="form-label">
                Country*
              </label>
              <input
                id="country"
                name="country"
                type="text"
                required
                className="form-input"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label htmlFor="registration_number" className="form-label">
                  Registration Number*
                </label>
                <input
                  id="registration_number"
                  name="registration_number"
                  type="text"
                  required
                  className="form-input"
                  value={formData.registration_number}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="registration_city" className="form-label">
                  Registration City*
                </label>
                <input
                  id="registration_city"
                  name="registration_city"
                  type="text"
                  required
                  className="form-input"
                  value={formData.registration_city}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="representative_name" className="form-label">
                Representative Name*
              </label>
              <input
                id="representative_name"
                name="representative_name"
                type="text"
                required
                className="form-input"
                value={formData.representative_name}
                onChange={handleChange}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="representative_role" className="form-label">
                Representative Role*
              </label>
              <input
                id="representative_role"
                name="representative_role"
                type="text"
                required
                className="form-input"
                value={formData.representative_role}
                onChange={handleChange}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="phone" className="form-label">
                Phone Number*
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <div className="loader mr-3 h-4 w-4 border-2"></div>
                Updating Profile...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
