import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ContractForm({ isEditing }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [templates, setTemplates] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [contractVariables, setContractVariables] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    template_id: '',
    supplier_id: '',
    status: 'Draft',
    variables: {}
  });
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get(`${API}/templates`);
        setTemplates(response.data);
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };

    const fetchSuppliers = async () => {
      try {
        const response = await axios.get(`${API}/suppliers`);
        setSuppliers(response.data);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      }
    };

    fetchTemplates();
    fetchSuppliers();

    if (isEditing && id) {
      fetchContract(id);
    }
  }, [isEditing, id]);

  const fetchContract = async (contractId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/contracts/${contractId}`);
      const contract = response.data;
      
      setFormData({
        name: contract.name,
        template_id: contract.template_id,
        supplier_id: contract.supplier_id,
        status: contract.status,
        variables: contract.variables || {}
      });
      
      // Fetch template variables
      if (contract.template_id) {
        fetchTemplateVariables(contract.template_id);
      }
      
      // Set selected supplier
      if (contract.supplier_id) {
        const supplier = suppliers.find(s => s.id === contract.supplier_id);
        setSelectedSupplier(supplier || null);
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
      setError('Failed to load contract data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateVariables = async (templateId) => {
    try {
      const response = await axios.get(`${API}/templates/${templateId}/variables`);
      setContractVariables(response.data.variables || []);
    } catch (error) {
      console.error('Error fetching template variables:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'template_id' && value) {
      fetchTemplateVariables(value);
      
      // Reset variables when template changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        variables: {}
      }));
    } else if (name === 'supplier_id' && value) {
      const supplier = suppliers.find(s => s.id === value);
      setSelectedSupplier(supplier || null);
      
      // Auto-fill variables if supplier is selected and variables are present
      if (supplier && contractVariables.length > 0) {
        const autoFilledVariables = { ...formData.variables };
        
        // Map supplier data to contract variables
        contractVariables.forEach(variable => {
          // Strip the {{ and }} from the variable name
          const varName = variable.replace(/[{}]/g, '').trim();
          
          // Try to match with supplier data
          if (varName === 'nom_entreprise' && supplier.company_data?.name) {
            autoFilledVariables[variable] = supplier.company_data.name;
          } else if (varName === 'forme_juridique' && supplier.company_data?.company_type) {
            autoFilledVariables[variable] = supplier.company_data.company_type;
          } else if (varName === 'capital_social') {
            autoFilledVariables[variable] = 'À remplir';
          } else if (varName === 'adresse_siege' && supplier.company_data?.address) {
            autoFilledVariables[variable] = supplier.company_data.address;
          } else if (varName === 'code_postal' && supplier.company_data?.postal_code) {
            autoFilledVariables[variable] = supplier.company_data.postal_code;
          } else if (varName === 'ville' && supplier.company_data?.city) {
            autoFilledVariables[variable] = supplier.company_data.city;
          } else if (varName === 'pays' && supplier.company_data?.country) {
            autoFilledVariables[variable] = supplier.company_data.country;
          } else if (varName === 'rcs_numero' && supplier.company_data?.registration_number) {
            autoFilledVariables[variable] = supplier.company_data.registration_number;
          } else if (varName === 'rcs_ville' && supplier.company_data?.registration_city) {
            autoFilledVariables[variable] = supplier.company_data.registration_city;
          } else if (varName === 'representant_nom' && supplier.company_data?.representative_name) {
            autoFilledVariables[variable] = supplier.company_data.representative_name;
          } else if (varName === 'representant_role' && supplier.company_data?.representative_role) {
            autoFilledVariables[variable] = supplier.company_data.representative_role;
          } else if (varName === 'email_contact' && supplier.email) {
            autoFilledVariables[variable] = supplier.email;
          } else if (varName === 'telephone' && supplier.company_data?.phone) {
            autoFilledVariables[variable] = supplier.company_data.phone;
          }
          // If no match was found, leave as is or empty
          else if (!autoFilledVariables[variable]) {
            autoFilledVariables[variable] = '';
          }
        });
        
        setFormData(prev => ({
          ...prev,
          [name]: value,
          variables: autoFilledVariables
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleVariableChange = (variableName, value) => {
    setFormData(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [variableName]: value
      }
    }));
  };

  const generatePreview = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/contracts/preview`, {
        template_id: formData.template_id,
        variables: formData.variables
      });
      
      setPreviewHtml(response.data.html_content);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      setError(error.response?.data?.detail || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Please enter a contract name');
      return;
    }
    
    if (!formData.template_id) {
      setError('Please select a template');
      return;
    }
    
    if (!formData.supplier_id) {
      setError('Please select a supplier');
      return;
    }
    
    // Check if all variables have values
    const missingVariables = contractVariables.filter(
      variable => !formData.variables[variable] || formData.variables[variable].trim() === ''
    );
    
    if (missingVariables.length > 0) {
      setError(`Please fill in all contract variables. Missing: ${missingVariables.join(', ')}`);
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      let response;
      
      if (isEditing) {
        response = await axios.put(`${API}/contracts/${id}`, formData);
      } else {
        response = await axios.post(`${API}/contracts`, formData);
      }
      
      setSuccess('Contract saved successfully');
      navigate(`/contracts/${response.data.id}`);
    } catch (error) {
      console.error('Error saving contract:', error);
      setError(error.response?.data?.detail || 'Failed to save contract');
      setLoading(false);
    }
  };

  if (loading && !showPreview) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader mr-3 h-8 w-8 border-4"></div>
        <span className="text-lg">Loading...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          {isEditing ? 'Edit Contract' : 'Create New Contract'}
        </h1>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate('/contracts')}
        >
          Cancel
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
      
      {/* Contract Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="modern-card p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Contract Details
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="form-label">
                Contract Name*
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
              <label htmlFor="template_id" className="form-label">
                Template*
              </label>
              <select
                id="template_id"
                name="template_id"
                required
                className="form-select"
                value={formData.template_id}
                onChange={handleChange}
              >
                <option value="">Select Template</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="supplier_id" className="form-label">
                Supplier*
              </label>
              <select
                id="supplier_id"
                name="supplier_id"
                required
                className="form-select"
                value={formData.supplier_id}
                onChange={handleChange}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.company_data?.name || supplier.name} ({supplier.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Draft">Draft</option>
                <option value="Pending Signature">Pending Signature</option>
                <option value="Signed">Signed</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                className="btn-secondary"
                onClick={generatePreview}
                disabled={!formData.template_id || loading}
              >
                Preview Contract
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loader mr-3 h-4 w-4 border-2"></div>
                    Saving...
                  </>
                ) : (
                  isEditing ? 'Update Contract' : 'Create Contract'
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="modern-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Contract Variables
          </h2>
          
          {formData.template_id ? (
            contractVariables.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {contractVariables.map((variable, index) => {
                  // Check if this variable has been auto-filled
                  const isAutoFilled = selectedSupplier && formData.variables[variable] && 
                    formData.variables[variable].trim() !== '';
                  
                  return (
                    <div key={index} className="mb-4">
                      <label htmlFor={`variable-${index}`} className="form-label flex items-center">
                        <span className="contract-variable mr-2">
                          {variable}
                        </span>
                        {isAutoFilled && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                            Auto-filled
                          </span>
                        )}
                      </label>
                      <input
                        id={`variable-${index}`}
                        type="text"
                        className={isAutoFilled ? "form-auto-filled" : "form-input"}
                        value={formData.variables[variable] || ''}
                        onChange={(e) => handleVariableChange(variable, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  No variables found in the selected template
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-6">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
              </svg>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Select a template to see contract variables
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Contract Preview Modal */}
      {showPreview && (
        <div className="modal-backdrop" onClick={() => setShowPreview(false)}>
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
                onClick={() => setShowPreview(false)}
              >
                Close Preview
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setShowPreview(false);
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
