import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TemplateForm({ isEditing }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    language: 'fr'
  });
  const [file, setFile] = useState(null);
  const [variables, setVariables] = useState([]);

  useEffect(() => {
    if (isEditing && id) {
      fetchTemplateData();
    }

    // Check if user has appropriate role
    if (!currentUser?.isAdmin && !currentUser?.isSuperAdmin) {
      setError('You do not have permission to access this page');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  }, [isEditing, id, currentUser]);

  const fetchTemplateData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/templates/${id}`);
      const template = response.data;
      
      setFormData({
        name: template.name,
        description: template.description || '',
        is_active: template.is_active,
        language: template.language || 'fr'
      });
      
      // Fetch variables if available
      if (template.variables) {
        setVariables(template.variables);
      }
    } catch (error) {
      console.error('Error fetching template data:', error);
      setError('Failed to load template data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    
    // If a file is selected, analyze it for variables
    if (e.target.files[0]) {
      extractVariables(e.target.files[0]);
    }
  };

  const extractVariables = async (file) => {
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API}/templates/extract-variables`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setVariables(response.data.variables || []);
    } catch (error) {
      console.error('Error extracting variables:', error);
      setError('Failed to extract variables from the template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isEditing && !id) {
      setError('Template ID is missing');
      return;
    }
    
    if (!formData.name.trim()) {
      setError('Please enter a template name');
      return;
    }
    
    if (!isEditing && !file) {
      setError('Please select a template file');
      return;
    }
    
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const templateFormData = new FormData();
      templateFormData.append('name', formData.name);
      templateFormData.append('description', formData.description);
      templateFormData.append('is_active', formData.is_active.toString());
      templateFormData.append('language', formData.language);
      
      if (file) {
        templateFormData.append('file', file);
      }
      
      let response;
      
      if (isEditing) {
        response = await axios.put(`${API}/templates/${id}`, templateFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await axios.post(`${API}/templates`, templateFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      setSuccess(`Template ${isEditing ? 'updated' : 'created'} successfully`);
      
      // Navigate to template details after a short delay
      setTimeout(() => {
        navigate(`/templates/${response.data.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error saving template:', error);
      setError(error.response?.data?.detail || `Failed to ${isEditing ? 'update' : 'create'} template`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader mr-3 h-8 w-8 border-4"></div>
        <span className="text-lg">Loading...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          {isEditing ? 'Edit Contract Template' : 'Create New Contract Template'}
        </h1>
        <button
          type="button"
          className="btn-secondary mt-4 md:mt-0"
          onClick={() => navigate('/templates')}
        >
          Back to Templates
        </button>
      </div>
      
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
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="modern-card p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Template Information
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="form-label">
                Template Name*
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
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                className="form-input"
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label htmlFor="language" className="form-label">
                Language
              </label>
              <select
                id="language"
                name="language"
                className="form-select"
                value={formData.language}
                onChange={handleChange}
              >
                <option value="fr">French</option>
                <option value="en">English</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  className="form-checkbox"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <span className="ml-2">
                  Active Template
                </span>
              </label>
              <p className="form-hint">
                Only active templates can be used to create contracts
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="template-file" className="form-label">
                Template File {!isEditing && '*'}
              </label>
              <input
                id="template-file"
                type="file"
                accept=".docx"
                className="form-input"
                onChange={handleFileChange}
              />
              <p className="form-hint">
                Upload a DOCX file with variables in format: {"{{variable_name}}"}
              </p>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="loader mr-3 h-4 w-4 border-2"></div>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update Template' : 'Create Template'
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="modern-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Template Variables
          </h2>
          
          {variables.length > 0 ? (
            <div>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                The following variables were detected in the template:
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <ul className="space-y-2">
                  {variables.map((variable, index) => (
                    <li key={index} className="flex items-center">
                      <span className="contract-variable">{variable}</span>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        Include this variable in contracts created from this template
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 rounded-md dark:bg-yellow-900 dark:text-yellow-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">Variable Formatting</h3>
                    <div className="mt-2 text-sm">
                      <p>
                        Variables in your template file should be formatted as {"{{variable_name}}"}.
                      </p>
                      <p className="mt-1">
                        Example: {"Dear {{client_name}}, We are pleased to provide our services..."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            file ? (
              <div className="text-center py-6">
                <div className="loader mx-auto h-8 w-8 border-4 mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">
                  Analyzing template for variables...
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Upload a template file to extract variables
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Variables should be in format {"{{variable_name}}"}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
