import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MyDocuments() {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadType, setUploadType] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Categories for documents
  const categories = [
    { id: 'all', name: 'All Documents' },
    { id: 'justificatifs', name: 'Justificatifs' },
    { id: 'devis', name: 'Devis' },
    { id: 'factures', name: 'Factures' },
    { id: 'autre', name: 'Autre' }
  ];

  // Document types based on company type
  const companyTypeRequirements = {
    'SAS': ['Attestation URSSAF', 'Kbis', 'Assurance RC Pro', 'RIB'],
    'SARL': ['Attestation URSSAF', 'Kbis', 'Assurance RC Pro', 'RIB'],
    'EURL': ['Attestation URSSAF', 'Kbis', 'Assurance RC Pro', 'RIB'],
    'Auto-entrepreneur': ['Attestation URSSAF', 'Attestation Auto-entrepreneur', 'RIB'],
    'Entreprise individuelle': ['Attestation URSSAF', 'Kbis', 'RIB'],
    'Artiste-auteur': ['Attestation Maison des Artistes', 'Attestation affiliation', 'RIB']
  };

  useEffect(() => {
    fetchDocuments();
    
    // Set required documents based on company type
    if (currentUser?.company_data?.company_type) {
      const companyType = currentUser.company_data.company_type;
      const required = companyTypeRequirements[companyType] || [];
      setRequiredDocuments(required);
    }
  }, [currentUser]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/supplier/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadName.trim()) {
      setError('Please enter a document name');
      return;
    }
    
    if (!uploadType) {
      setError('Please select a document type');
      return;
    }
    
    if (!uploadFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploadLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('name', uploadName);
      formData.append('type', uploadType);
      formData.append('category', selectedCategory === 'all' ? 'autre' : selectedCategory);

      await axios.post(`${API}/supplier/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Document uploaded successfully');
      setShowUploadModal(false);
      setUploadName('');
      setUploadType('');
      setUploadFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Reload documents
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      setError(error.response?.data?.detail || 'Failed to upload document');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await axios.delete(`${API}/supplier/documents/${id}`);
      setSuccess('Document deleted successfully');
      
      // Update documents list
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
      setError(error.response?.data?.detail || 'Failed to delete document');
    }
  };

  // Filter documents based on selected category and search query
  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         doc.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Check which required documents are missing
  const getMissingDocuments = () => {
    const uploadedDocumentTypes = documents.map(doc => doc.type);
    return requiredDocuments.filter(type => !uploadedDocumentTypes.includes(type));
  };

  const missingDocuments = getMissingDocuments();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold mb-2 md:mb-0">My Documents</h1>
        <button
          className="btn-primary"
          onClick={() => setShowUploadModal(true)}
        >
          Upload New Document
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

      {/* Required Documents Alert */}
      {missingDocuments.length > 0 && (
        <div className="p-4 mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-100">Required documents missing</h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
                <p>Please upload the following required documents:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {missingDocuments.map((doc, index) => (
                    <li key={index}>{doc}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Document Filters */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <div className="md:col-span-3">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  selectedCategory === category.id
                    ? 'bg-[#004A58] text-white dark:bg-[#80CED7] dark:text-gray-900'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search documents..."
              className="form-input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Documents List */}
      <div className="modern-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loader mr-3 h-8 w-8 border-4"></div>
            <span className="text-lg">Loading documents...</span>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No documents found</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {selectedCategory === 'all' && searchQuery === '' ? 
                'Get started by uploading your first document.' : 
                'Try changing your search or filter criteria.'}
            </p>
            {selectedCategory === 'all' && searchQuery === '' && (
              <div className="mt-6">
                <button
                  className="btn-primary"
                  onClick={() => setShowUploadModal(true)}
                >
                  Upload Document
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {filteredDocuments.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md">
                          <svg className="h-6 w-6 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {document.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {document.file_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{document.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {document.category.charAt(0).toUpperCase() + document.category.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(document.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        document.status === 'Approved' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                          : document.status === 'Pending' 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                          : document.status === 'Rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                      }`}>
                        {document.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <a
                          href={document.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          View
                        </a>
                        {document.status === 'Pending' && (
                          <button
                            onClick={() => handleDelete(document.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
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
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Upload New Document
              </h3>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body">
                {error && (
                  <div className="p-3 mb-4 bg-red-50 text-red-700 border border-red-200 rounded-md dark:bg-red-900 dark:text-red-100 dark:border-red-700">
                    {error}
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="uploadName" className="form-label">
                    Document Name*
                  </label>
                  <input
                    id="uploadName"
                    type="text"
                    className="form-input"
                    required
                    value={uploadName}
                    onChange={e => setUploadName(e.target.value)}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="uploadType" className="form-label">
                    Document Type*
                  </label>
                  <select
                    id="uploadType"
                    className="form-select"
                    required
                    value={uploadType}
                    onChange={e => setUploadType(e.target.value)}
                  >
                    <option value="">Select Document Type</option>
                    {requiredDocuments.map((type, index) => (
                      <option key={`required-${index}`} value={type}>
                        {type} (Required)
                      </option>
                    ))}
                    <option value="Devis">Devis</option>
                    <option value="Facture">Facture</option>
                    <option value="Contrat">Contrat</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="uploadFile" className="form-label">
                    File*
                  </label>
                  <input
                    id="uploadFile"
                    type="file"
                    className="form-input"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    required
                  />
                  <p className="form-hint">
                    Accepted formats: PDF, DOCX, JPG, PNG (max 10MB)
                  </p>
                </div>
                
                <div className="mb-2">
                  <label htmlFor="uploadCategory" className="form-label">
                    Document Category
                  </label>
                  <select
                    id="uploadCategory"
                    className="form-select"
                    value={selectedCategory === 'all' ? 'autre' : selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                  >
                    <option value="justificatifs">Justificatifs</option>
                    <option value="devis">Devis</option>
                    <option value="factures">Factures</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={uploadLoading}
                >
                  {uploadLoading ? (
                    <>
                      <div className="loader mr-3 h-4 w-4 border-2"></div>
                      Uploading...
                    </>
                  ) : (
                    'Upload Document'
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
