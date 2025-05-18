import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Register() {
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generalConditions, setGeneralConditions] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    company_name: '',
    company_type: 'SAS', // Default value
    address: '',
    postal_code: '',
    city: '',
    country: 'France', // Default value
    registration_number: '',
    registration_city: '',
    representative_name: '',
    representative_role: '',
    phone: '',
    accept_conditions: false
  });

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
    }

    // Fetch active general conditions
    const fetchGeneralConditions = async () => {
      try {
        const response = await axios.get(`${API}/general-conditions/active`);
        setGeneralConditions(response.data);
      } catch (error) {
        console.error('Error fetching general conditions:', error);
      }
    };

    fetchGeneralConditions();
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const validateForm = () => {
    // Reset previous error
    setError('');

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // Check if password is strong enough
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    // Check if terms are accepted
    if (!formData.accept_conditions) {
      setError('You must accept the general conditions');
      return false;
    }

    // Check required fields
    const requiredFields = [
      'email', 'password', 'name', 'company_name', 'address', 
      'postal_code', 'city', 'country', 'registration_number', 
      'representative_name', 'representative_role', 'phone'
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`Please fill in all required fields`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Create the registration data object
      const registrationData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: 'supplier',
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
        },
        accepted_conditions_id: generalConditions?.id
      };
      
      // Call the signup function from AuthContext
      await signup(registrationData);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create an account');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white gradient-text">
            PRISM'FINANCE ✨
          </h1>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
            Create your Supplier Account
          </h2>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md dark:bg-red-900 dark:text-red-100 dark:border-red-700">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Account Information
              </h3>
              
              <div className="mb-4">
                <label htmlFor="email" className="form-label">
                  Email Address*
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="name" className="form-label">
                  Your Full Name*
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="password" className="form-label">
                  Password*
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="form-input"
                  value={formData.password}
                  onChange={handleChange}
                />
                <p className="form-hint">
                  Must be at least 8 characters long
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password*
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="form-input"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Company Information
              </h3>
              
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
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Legal Information
              </h3>
              
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
            
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Terms & Conditions
              </h3>
              
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md h-64 overflow-y-auto">
                {generalConditions ? (
                  <>
                    <h4 className="font-bold mb-2">
                      {generalConditions.title} (v{generalConditions.version})
                    </h4>
                    <div className="whitespace-pre-line">
                      {generalConditions.content}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    Loading general conditions...
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="accept_conditions"
                    className="form-checkbox"
                    checked={formData.accept_conditions}
                    onChange={handleChange}
                    required
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    I have read and accept the general conditions*
                  </span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/login" className="text-[#004A58] hover:text-[#006d83] dark:text-[#80CED7]">
                Already have an account? Sign in
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <div className="loader mr-3 h-4 w-4 border-2"></div>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
