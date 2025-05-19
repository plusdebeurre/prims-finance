import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TemplateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [variables, setVariables] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    // Check if user has appropriate role
    if (!currentUser?.isAdmin && !currentUser?.isSuperAdmin) {
      navigate('/dashboard');
      return;
    }

    fetchTemplate();
  }, [id, currentUser]);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/templates/${id}`);
      setTemplate(response.data);
      
      // Get template variables
      const variablesResponse = await axios.get(`${API}/templates/${id}/variables`);
      setVariables(variablesResponse.data.variables || []);
    } catch (error) {
      console.error('Error fetching template:', error);
      setError('Failed to load template details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      const response = await axios.get(`${API}/templates/${id}/preview`);
      setPreviewHtml(response.data.html_content);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      setError('Failed to generate template preview');
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`${API}/templates/${id}/download`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${template.name}.docx`);
      
      // Append to html page
      document.body.appendChild(link);
      
      // Start download
      link.click();
      
      // Clean up and remove the link
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading template:', error);
      setError('Failed to download template');
    }
  };

  const handleStatusToggle = async () => {
    try {
      await axios.put(`${API}/templates/${id}/toggle-status`);
      // Update template status
      setTemplate(prev => ({
        ...prev,
        is_active: !prev.is_active
      }));
    } catch (error) {
      console.error('Error toggling template status:', error);
      setError('Failed to update template status');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/templates/${id}`);
      setShowDeleteModal(false);
      navigate('/templates');
    } catch (error) {
      console.error('Error deleting template:', error);
      setError('Failed to delete template');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader mr-3 h-8 w-8 border-4"></div>
        <span className="text-lg">Loading template details...</span>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-md dark:bg-red-900 dark:text-red-100">
          {error || 'Template not found'}
        </div>
        <div className="mt-4">
          <Link to="/templates" className="btn-primary">
            Back to Templates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{template.name}</h1>
          <div className="mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              template.is_active 
                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
            }`}>
              {template.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              Created on {new Date(template.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <button
            onClick={handleStatusToggle}
            className={`btn-sm ${
              template.is_active 
                ? 'btn-danger' 
                : 'btn-secondary'
            }`}
          >
            {template.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button
            className="btn-secondary btn-sm"
            onClick={handlePreview}
          >
            Preview
          </button>
          <button
            className="btn-secondary btn-sm"
            onClick={handleDownload}
          >
            Download
          </button>
          <Link
            to={`/templates/${id}/edit`}
            className="btn-secondary btn-sm"
          >
            Edit
          </Link>
          <Link
            to={`/contracts/new?template=${id}`}
            className="btn-primary btn-sm"
          >
            Create Contract
          </Link>
          <button
            className="btn-danger btn-sm"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-md dark:bg-red-900 dark:border-red-700 dark:text-red-100">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="modern-card p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Template Information
          </h2>
          
          {template.description && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Description
              </h3>
              <p className="text-base text-gray-900 dark:text-white">
                {template.description}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Language
              </h3>
              <p className="text-base text-gray-900 dark:text-white">
                {template.language === 'fr' ? 'French' : 'English'}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Created By
              </h3>
              <p className="text-base text-gray-900 dark:text-white">
                {template.created_by?.name || 'Unknown'}
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Usage
            </h3>
            <p className="text-base text-gray-900 dark:text-white">
              Used in {template.contracts_count || 0} contracts
            </p>
          </div>
          
          {template.contracts_count > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 rounded-md dark:bg-yellow-900 dark:text-yellow-100">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">
                    This template is used in existing contracts. Changes to the template will not affect contracts already created.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="modern-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Template Variables
          </h2>
          
          {variables.length > 0 ? (
            <div>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                The following variables are available in this template:
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {variables.map((variable, index) => (
                    <div key={index} className="flex items-center">
                      <span className="contract-variable">{variable}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-md font-medium mb-2 text-gray-900 dark:text-white">
                  How to use this template
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  When creating a contract with this template, you'll need to provide values for all the variables listed above.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  These variables will be automatically filled with supplier data when available, but you can also manually edit them during contract creation.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                No variables found in this template
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Delete Template
              </h3>
            </div>
            <div className="modal-body">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete this template? This action cannot be undone.
              </p>
              {template.contracts_count > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-md dark:bg-yellow-900 dark:text-yellow-100">
                  <p className="text-sm">
                    <strong>Warning:</strong> This template is used in {template.contracts_count} existing contracts. Deleting it may affect these contracts.
                  </p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="modal-backdrop" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Template Preview
              </h3>
            </div>
            <div className="modal-body overflow-y-auto max-h-[70vh]">
              <div 
                className="contract-preview"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowPreviewModal(false)}
              >
                Close Preview
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setShowPreviewModal(false);
                  window.print();
                }}
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
