import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ContractDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [signatureInfo, setSignatureInfo] = useState({
    name: '',
    title: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    fetchContract();
  }, [id]);

  const fetchContract = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/contracts/${id}`);
      setContract(response.data);
    } catch (error) {
      console.error('Error fetching contract:', error);
      setError('Failed to load contract details');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      const response = await axios.get(`${API}/contracts/${id}/preview`);
      setPreviewHtml(response.data.html_content);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      setError(error.response?.data?.detail || 'Failed to generate contract preview');
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`${API}/contracts/${id}/download`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${contract.name}.pdf`);
      
      // Append to html page
      document.body.appendChild(link);
      
      // Start download
      link.click();
      
      // Clean up and remove the link
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading contract:', error);
      setError('Failed to download contract');
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setSendingEmail(true);
    
    try {
      await axios.post(`${API}/contracts/${id}/send`, {
        message: emailMessage
      });
      setSuccess('Contract sent successfully');
      setShowSendModal(false);
      setEmailMessage('');
      
      // Refresh contract to update status
      fetchContract();
    } catch (error) {
      console.error('Error sending contract:', error);
      setError(error.response?.data?.detail || 'Failed to send contract');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSignContract = async (e) => {
    e.preventDefault();
    setSigning(true);
    
    try {
      await axios.post(`${API}/contracts/${id}/sign/admin`, {
        name: signatureInfo.name,
        title: signatureInfo.title,
        date: signatureInfo.date
      });
      
      setSuccess('Contract signed successfully');
      setShowSignModal(false);
      
      // Refresh contract to update status
      fetchContract();
    } catch (error) {
      console.error('Error signing contract:', error);
      setError(error.response?.data?.detail || 'Failed to sign contract');
    } finally {
      setSigning(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/contracts/${id}`);
      setShowDeleteModal(false);
      navigate('/contracts');
    } catch (error) {
      console.error('Error deleting contract:', error);
      setError(error.response?.data?.detail || 'Failed to delete contract');
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader mr-3 h-8 w-8 border-4"></div>
        <span className="text-lg">Loading contract details...</span>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-md dark:bg-red-900 dark:text-red-100">
          {error || 'Contract not found'}
        </div>
        <div className="mt-4">
          <Link to="/contracts" className="btn-secondary">
            Back to Contracts
          </Link>
        </div>
      </div>
    );
  }

  // Determine status color
  const getStatusColor = () => {
    switch (contract.status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'Pending Signature':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'Signed':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'Expired':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{contract.name}</h1>
          <div className="mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {contract.status}
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              Created on {new Date(contract.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
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
          {contract.status === 'Draft' && (
            <>
              <button
                className="btn-primary btn-sm"
                onClick={() => setShowSendModal(true)}
              >
                Send to Supplier
              </button>
              <Link
                to={`/contracts/${id}/edit`}
                className="btn-secondary btn-sm"
              >
                Edit
              </Link>
              <button
                className="btn-danger btn-sm"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete
              </button>
            </>
          )}
          {contract.status === 'Pending Signature' && !contract.admin_signature && (
            <button
              className="btn-primary btn-sm"
              onClick={() => setShowSignModal(true)}
            >
              Sign Contract
            </button>
          )}
        </div>
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
        <div className="lg:col-span-2">
          <div className="modern-card p-6">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Contract Details
            </h2>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Template
              </h3>
              <p className="text-base text-gray-900 dark:text-white">
                {contract.template?.name || 'N/A'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Created By
                </h3>
                <p className="text-base text-gray-900 dark:text-white">
                  {contract.created_by?.name || 'N/A'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Last Updated
                </h3>
                <p className="text-base text-gray-900 dark:text-white">
                  {contract.updated_at 
                    ? new Date(contract.updated_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
            
            <h3 className="text-md font-medium mb-2 text-gray-900 dark:text-white">
              Contract Variables
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 mb-6">
              {contract.variables && Object.keys(contract.variables).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(contract.variables).map(([key, value], index) => (
                    <div key={index}>
                      <span className="contract-variable">{key}</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No variables found for this contract
                </p>
              )}
            </div>
            
            <h3 className="text-md font-medium mb-2 text-gray-900 dark:text-white">
              Signature Status
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Supplier Signature
                  </h4>
                  {contract.supplier_signature ? (
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-gray-900 dark:text-white">
                          Signed by {contract.supplier_signature.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {contract.supplier_signature.title} on {new Date(contract.supplier_signature.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400">
                        Not signed yet
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Admin Signature
                  </h4>
                  {contract.admin_signature ? (
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-gray-900 dark:text-white">
                          Signed by {contract.admin_signature.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {contract.admin_signature.title} on {new Date(contract.admin_signature.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400">
                        Not signed yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="modern-card p-6">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Supplier Information
            </h2>
            
            {contract.supplier ? (
              <>
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Company Name
                  </h3>
                  <p className="text-base text-gray-900 dark:text-white">
                    {contract.supplier.company_data?.name || 'N/A'}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Company Type
                  </h3>
                  <p className="text-base text-gray-900 dark:text-white">
                    {contract.supplier.company_data?.company_type || 'N/A'}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Contact Email
                  </h3>
                  <p className="text-base text-gray-900 dark:text-white">
                    {contract.supplier.email || 'N/A'}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Representative
                  </h3>
                  <p className="text-base text-gray-900 dark:text-white">
                    {contract.supplier.company_data?.representative_name || 'N/A'}
                    {contract.supplier.company_data?.representative_role && 
                      ` (${contract.supplier.company_data.representative_role})`}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Address
                  </h3>
                  <p className="text-base text-gray-900 dark:text-white">
                    {contract.supplier.company_data?.address || 'N/A'}
                    {contract.supplier.company_data?.postal_code && 
                      `, ${contract.supplier.company_data.postal_code}`}
                    {contract.supplier.company_data?.city && 
                      ` ${contract.supplier.company_data.city}`}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Registration
                  </h3>
                  <p className="text-base text-gray-900 dark:text-white">
                    {contract.supplier.company_data?.registration_number || 'N/A'}
                    {contract.supplier.company_data?.registration_city && 
                      ` (${contract.supplier.company_data.registration_city})`}
                  </p>
                </div>
                
                <div className="mt-4">
                  <Link
                    to={`/suppliers/${contract.supplier.id}`}
                    className="btn-secondary btn-sm w-full"
                  >
                    View Supplier Details
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                Supplier information not available
              </p>
            )}
          </div>
          
          <div className="modern-card p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Activity Log
            </h2>
            
            {contract.activity_log && contract.activity_log.length > 0 ? (
              <div className="space-y-4">
                {contract.activity_log.map((activity, index) => (
                  <div key={index} className="flex">
                    <div className="mr-3 flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        {activity.type === 'status_update' ? (
                          <svg className="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        ) : activity.type === 'signature' ? (
                          <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : activity.type === 'email' ? (
                          <svg className="h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.user_name} • {new Date(activity.timestamp).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No activity recorded for this contract
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="modal-backdrop" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Contract Preview
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
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Delete Contract
              </h3>
            </div>
            <div className="modal-body">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete this contract? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Send Contract Modal */}
      {showSendModal && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Send Contract to Supplier
              </h3>
            </div>
            <form onSubmit={handleSendEmail}>
              <div className="modal-body">
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  This will send the contract to {contract.supplier?.email} for review and signature.
                </p>
                <div className="mb-4">
                  <label htmlFor="emailMessage" className="form-label">
                    Additional Message (optional)
                  </label>
                  <textarea
                    id="emailMessage"
                    rows="4"
                    className="form-input"
                    placeholder="Enter any additional instructions or message for the recipient"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowSendModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={sendingEmail}
                >
                  {sendingEmail ? (
                    <>
                      <div className="loader mr-3 h-4 w-4 border-2"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Contract'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Sign Contract Modal */}
      {showSignModal && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Sign Contract
              </h3>
            </div>
            <form onSubmit={handleSignContract}>
              <div className="modal-body">
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  This action represents your legal signature on this contract.
                </p>
                <div className="mb-4">
                  <label htmlFor="signerName" className="form-label">
                    Your Full Name*
                  </label>
                  <input
                    id="signerName"
                    type="text"
                    className="form-input"
                    required
                    value={signatureInfo.name}
                    onChange={(e) => setSignatureInfo({...signatureInfo, name: e.target.value})}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="signerTitle" className="form-label">
                    Your Title/Position*
                  </label>
                  <input
                    id="signerTitle"
                    type="text"
                    className="form-input"
                    required
                    value={signatureInfo.title}
                    onChange={(e) => setSignatureInfo({...signatureInfo, title: e.target.value})}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="signingDate" className="form-label">
                    Date*
                  </label>
                  <input
                    id="signingDate"
                    type="date"
                    className="form-input"
                    required
                    value={signatureInfo.date}
                    onChange={(e) => setSignatureInfo({...signatureInfo, date: e.target.value})}
                  />
                </div>
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md dark:bg-yellow-900 dark:text-yellow-100">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm">
                        By clicking "Sign Contract", you acknowledge that this represents your legal signature and you are authorized to sign this document.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowSignModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={signing}
                >
                  {signing ? (
                    <>
                      <div className="loader mr-3 h-4 w-4 border-2"></div>
                      Signing...
                    </>
                  ) : (
                    'Sign Contract'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
