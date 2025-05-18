import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./App.css";

// API Configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Components
const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-[#004A58] font-bold text-xl">PRISM'FINANCE</Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/suppliers" className="border-transparent text-gray-500 hover:border-[#004A58] hover:text-[#004A58] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Suppliers
              </Link>
              <Link to="/contracts" className="border-transparent text-gray-500 hover:border-[#004A58] hover:text-[#004A58] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Contracts
              </Link>
              <Link to="/templates" className="border-transparent text-gray-500 hover:border-[#004A58] hover:text-[#004A58] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Templates
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button className="bg-[#004A58] text-white px-4 py-2 rounded-md text-sm font-medium">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Home Page
const Home = () => {
  return (
    <div className="bg-white">
      <main>
        {/* Hero section */}
        <div className="relative">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="relative shadow-xl sm:rounded-2xl sm:overflow-hidden">
              <div className="absolute inset-0">
                <img
                  className="h-full w-full object-cover"
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80"
                  alt="People working on laptops"
                />
                <div className="absolute inset-0 bg-[#004A58] mix-blend-multiply" />
              </div>
              <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
                <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  <span className="block text-white">PRISM'FINANCE</span>
                  <span className="block text-[#80CED7]">Supplier Management</span>
                </h1>
                <p className="mt-6 max-w-lg mx-auto text-center text-xl text-white sm:max-w-3xl">
                  Manage your suppliers, contracts, and compliance documents in one simple platform
                </p>
                <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                  <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                    <Link to="/suppliers" className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-[#004A58] bg-white hover:bg-[#F5F5F5] sm:px-8">
                      View Suppliers
                    </Link>
                    <Link to="/contracts" className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#004A58] bg-opacity-60 hover:bg-opacity-70 sm:px-8">
                      Manage Contracts
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features section */}
        <div className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-[#004A58] font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-gray-900 sm:text-4xl">
                Simplify Your Supplier Management
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                PRISM'FINANCE helps businesses manage suppliers efficiently and compliantly with French regulations
              </p>
            </div>

            <div className="mt-10">
              <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-[#004A58] text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Contract Management</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Generate and manage contracts from customizable templates with automatic variable detection
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-[#004A58] text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Supplier Portal</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Provide suppliers with a secure interface to update information and accept your terms
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-[#004A58] text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Compliance Dashboard</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Track supplier compliance status with visual indicators and automated alerts
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-[#004A58] text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Automated Notifications</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Receive alerts for document expiration and compliance status changes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Suppliers List
const SuppliersList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get(`${API}/suppliers`);
        setSuppliers(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading suppliers...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Suppliers</h1>
          <p className="mt-2 text-sm text-gray-700">A list of all suppliers in your account including their name, SIRET, and status.</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => navigate('/suppliers/new')}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#004A58] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#00353F] focus:outline-none focus:ring-2 focus:ring-[#004A58] focus:ring-offset-2 sm:w-auto"
          >
            Add supplier
          </button>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      SIRET
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-sm text-gray-500">
                        No suppliers found. Add your first supplier to get started.
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((supplier) => (
                      <tr key={supplier.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {supplier.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{supplier.siret}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{supplier.emails[0]}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => navigate(`/suppliers/${supplier.id}`)}
                            className="text-[#004A58] hover:text-[#00353F]"
                          >
                            View<span className="sr-only">, {supplier.name}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Supplier Form
const SupplierForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    siret: "",
    vat_number: "",
    profession: "",
    iban: "",
    bic: "",
    vat_rates: [20.0],
    emails: [""],
    address: "",
    postal_code: "",
    city: "",
    country: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "emails[0]") {
      setFormData({
        ...formData,
        emails: [value]
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.siret) newErrors.siret = "SIRET is required";
    if (!formData.vat_number) newErrors.vat_number = "VAT number is required";
    if (!formData.iban) newErrors.iban = "IBAN is required";
    if (!formData.emails[0]) newErrors["emails[0]"] = "Email is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      await axios.post(`${API}/suppliers`, formData);
      navigate("/suppliers");
    } catch (error) {
      console.error("Error creating supplier:", error);
      setErrors({
        submit: error.response?.data?.detail || "An error occurred while creating the supplier"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Supplier Information</h3>
            <p className="mt-1 text-sm text-gray-600">
              Add a new supplier to your account. Required fields are marked with an asterisk (*).
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {errors.submit && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{errors.submit}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md ${errors.name ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-[#004A58] focus:ring-[#004A58] sm:text-sm`}
                      placeholder="Définir un nom"
                    />
                    {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="siret" className="block text-sm font-medium text-gray-700">
                      SIRET *
                    </label>
                    <input
                      type="text"
                      name="siret"
                      id="siret"
                      value={formData.siret}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md ${errors.siret ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-[#004A58] focus:ring-[#004A58] sm:text-sm`}
                      placeholder="Entrer le SIRET"
                    />
                    {errors.siret && <p className="mt-2 text-sm text-red-600">{errors.siret}</p>}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="vat_number" className="block text-sm font-medium text-gray-700">
                      VAT Number *
                    </label>
                    <input
                      type="text"
                      name="vat_number"
                      id="vat_number"
                      value={formData.vat_number}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md ${errors.vat_number ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-[#004A58] focus:ring-[#004A58] sm:text-sm`}
                      placeholder="Définir un numéro de TVA"
                    />
                    {errors.vat_number && <p className="mt-2 text-sm text-red-600">{errors.vat_number}</p>}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="profession" className="block text-sm font-medium text-gray-700">
                      Profession
                    </label>
                    <input
                      type="text"
                      name="profession"
                      id="profession"
                      value={formData.profession}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#004A58] focus:ring-[#004A58] sm:text-sm"
                      placeholder="Renseigner la profession"
                    />
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      id="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#004A58] focus:ring-[#004A58] sm:text-sm"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postal_code"
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#004A58] focus:ring-[#004A58] sm:text-sm"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      id="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#004A58] focus:ring-[#004A58] sm:text-sm"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      id="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#004A58] focus:ring-[#004A58] sm:text-sm"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="iban" className="block text-sm font-medium text-gray-700">
                      IBAN *
                    </label>
                    <input
                      type="text"
                      name="iban"
                      id="iban"
                      value={formData.iban}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md ${errors.iban ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-[#004A58] focus:ring-[#004A58] sm:text-sm`}
                      placeholder="XXXX XXXX XXXX XXXX XXXX XXXX XXX"
                    />
                    {errors.iban && <p className="mt-2 text-sm text-red-600">{errors.iban}</p>}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="bic" className="block text-sm font-medium text-gray-700">
                      BIC
                    </label>
                    <input
                      type="text"
                      name="bic"
                      id="bic"
                      value={formData.bic}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#004A58] focus:ring-[#004A58] sm:text-sm"
                    />
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="emails[0]" className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="emails[0]"
                      id="emails[0]"
                      value={formData.emails[0]}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md ${errors["emails[0]"] ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-[#004A58] focus:ring-[#004A58] sm:text-sm`}
                      placeholder="email@example.com"
                    />
                    {errors["emails[0]"] && <p className="mt-2 text-sm text-red-600">{errors["emails[0]"]}</p>}
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#004A58] focus:ring-[#004A58] sm:text-sm"
                      placeholder="Ajouter des notes à ce fournisseur"
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => navigate('/suppliers')}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004A58] mr-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#004A58] hover:bg-[#00353F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004A58]"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Contracts List
const ContractsList = () => {
  const [contracts, setContracts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contractsRes, suppliersRes, templatesRes] = await Promise.all([
          axios.get(`${API}/contracts`),
          axios.get(`${API}/suppliers`),
          axios.get(`${API}/contract-templates`)
        ]);
        
        setContracts(contractsRes.data);
        setSuppliers(suppliersRes.data);
        setTemplates(templatesRes.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Unknown';
  };

  const getTemplateName = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    return template ? template.name : 'Unknown';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading contracts...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Contracts</h1>
          <p className="mt-2 text-sm text-gray-700">A list of all contracts in your account including their status and supplier.</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => navigate('/contracts/new')}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#004A58] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#00353F] focus:outline-none focus:ring-2 focus:ring-[#004A58] focus:ring-offset-2 sm:w-auto"
            disabled={templates.length === 0 || suppliers.length === 0}
          >
            Generate contract
          </button>
        </div>
      </div>
      {(templates.length === 0 || suppliers.length === 0) && (
        <div className="mt-4 p-4 border border-yellow-400 bg-yellow-50 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Missing requirements</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  {templates.length === 0 && "You need to upload at least one contract template. "}
                  {suppliers.length === 0 && "You need to add at least one supplier. "}
                  {templates.length === 0 && <Link to="/templates" className="font-medium underline">Go to Templates</Link>}
                  {templates.length === 0 && suppliers.length === 0 && " | "}
                  {suppliers.length === 0 && <Link to="/suppliers" className="font-medium underline">Go to Suppliers</Link>}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Supplier
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Template
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Created
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {contracts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-sm text-gray-500">
                        No contracts found. Generate your first contract to get started.
                      </td>
                    </tr>
                  ) : (
                    contracts.map((contract) => (
                      <tr key={contract.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {getSupplierName(contract.supplier_id)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {getTemplateName(contract.template_id)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            contract.status === 'signed' 
                              ? 'bg-green-100 text-green-800' 
                              : contract.status === 'draft' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(contract.created_at).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => navigate(`/contracts/${contract.id}`)}
                            className="text-[#004A58] hover:text-[#00353F]"
                          >
                            View<span className="sr-only">, contract</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Templates List
const TemplatesList = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get(`${API}/contract-templates`);
        setTemplates(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching templates:", error);
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!templateName || !file) {
      setUploadError("Template name and file are required");
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    const formData = new FormData();
    formData.append('name', templateName);
    formData.append('file', file);
    
    try {
      await axios.post(`${API}/contract-templates`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Refresh the templates list
      const response = await axios.get(`${API}/contract-templates`);
      setTemplates(response.data);
      
      // Reset the form
      setTemplateName("");
      setFile(null);
      
    } catch (error) {
      console.error("Error uploading template:", error);
      setUploadError(error.response?.data?.detail || "An error occurred while uploading the template");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading templates...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Contract Templates</h1>
          <p className="mt-2 text-sm text-gray-700">Upload and manage contract templates with variable placeholders.</p>
        </div>
      </div>
      
      <div className="mt-8 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Upload New Template</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Upload a .docx file containing placeholders in the format {{VariableName}}.</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-5 sm:flex sm:items-center">
            <div className="w-full sm:max-w-xs">
              <label htmlFor="templateName" className="sr-only">Template Name</label>
              <input
                type="text"
                name="templateName"
                id="templateName"
                className="shadow-sm focus:ring-[#004A58] focus:border-[#004A58] block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Template Name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="mt-3 sm:mt-0 sm:ml-4">
              <label htmlFor="file" className="sr-only">File</label>
              <input
                type="file"
                name="file"
                id="file"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#004A58] file:text-white hover:file:bg-[#00353F]"
                accept=".docx,.doc"
                onChange={handleFileChange}
              />
            </div>
            <button
              type="submit"
              className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-[#004A58] hover:bg-[#00353F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004A58] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
          {uploadError && (
            <div className="mt-3 text-sm text-red-600">
              {uploadError}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Variables
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Created
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {templates.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-sm text-gray-500">
                        No templates found. Upload your first template to get started.
                      </td>
                    </tr>
                  ) : (
                    templates.map((template) => (
                      <tr key={template.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {template.name}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {template.variables.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {template.variables.map((variable, index) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#E6F0F2] text-[#004A58]">
                                  {variable}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">No variables detected</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(template.created_at).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => navigate(`/contracts/new?template=${template.id}`)}
                            className="text-[#004A58] hover:text-[#00353F]"
                          >
                            Use<span className="sr-only">, {template.name}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Generate Contract Form
const GenerateContractForm = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [variables, setVariables] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { search } = window.location;
  const params = new URLSearchParams(search);
  const templateIdFromUrl = params.get('template');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, templatesRes] = await Promise.all([
          axios.get(`${API}/suppliers`),
          axios.get(`${API}/contract-templates`)
        ]);
        
        setSuppliers(suppliersRes.data);
        setTemplates(templatesRes.data);
        
        // If template ID is provided in URL, select it
        if (templateIdFromUrl) {
          const template = templatesRes.data.find(t => t.id === templateIdFromUrl);
          if (template) {
            setSelectedTemplate(template);
            
            // Initialize variables object with empty strings
            const vars = {};
            template.variables.forEach(variable => {
              vars[variable] = "";
            });
            setVariables(vars);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [templateIdFromUrl]);

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template);
    
    // Initialize variables object with empty strings
    const vars = {};
    template.variables.forEach(variable => {
      vars[variable] = "";
    });
    setVariables(vars);
  };

  const handleSupplierChange = (e) => {
    setSelectedSupplier(e.target.value);
  };

  const handleVariableChange = (e) => {
    const { name, value } = e.target;
    setVariables({
      ...variables,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTemplate || !selectedSupplier) {
      setError("Template and supplier are required");
      return;
    }
    
    setGenerating(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('supplier_id', selectedSupplier);
    formData.append('template_id', selectedTemplate.id);
    formData.append('variables', JSON.stringify(variables));
    
    try {
      const response = await axios.post(`${API}/contracts/generate`, formData);
      navigate(`/contracts/${response.data.id}`);
    } catch (error) {
      console.error("Error generating contract:", error);
      setError(error.response?.data?.detail || "An error occurred while generating the contract");
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (templates.length === 0 || suppliers.length === 0) {
    return (
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Missing Requirements</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                {templates.length === 0 && "You need to upload at least one contract template. "}
                {suppliers.length === 0 && "You need to add at least one supplier. "}
              </p>
            </div>
            <div className="mt-5">
              {templates.length === 0 && (
                <Link
                  to="/templates"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#004A58] hover:bg-[#00353F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004A58]"
                >
                  Add Templates
                </Link>
              )}
              {templates.length === 0 && suppliers.length === 0 && " "}
              {suppliers.length === 0 && (
                <Link
                  to="/suppliers"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#004A58] hover:bg-[#00353F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004A58]"
                >
                  Add Suppliers
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Generate Contract</h3>
            <p className="mt-1 text-sm text-gray-600">
              Select a template and supplier, then fill in the variable values to generate a contract.
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="template" className="block text-sm font-medium text-gray-700">
                    Template
                  </label>
                  <select
                    id="template"
                    name="template"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#004A58] focus:border-[#004A58] sm:text-sm rounded-md"
                    value={selectedTemplate?.id || ""}
                    onChange={handleTemplateChange}
                  >
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                    Supplier
                  </label>
                  <select
                    id="supplier"
                    name="supplier"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#004A58] focus:border-[#004A58] sm:text-sm rounded-md"
                    value={selectedSupplier}
                    onChange={handleSupplierChange}
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTemplate && selectedTemplate.variables.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Variable Values</h3>
                    <div className="space-y-4">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable}>
                          <label htmlFor={variable} className="block text-sm font-medium text-gray-700">
                            {variable}
                          </label>
                          <input
                            type="text"
                            name={variable}
                            id={variable}
                            value={variables[variable] || ""}
                            onChange={handleVariableChange}
                            className="mt-1 block w-full shadow-sm focus:ring-[#004A58] focus:border-[#004A58] sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => navigate('/contracts')}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004A58] mr-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating || !selectedTemplate || !selectedSupplier}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#004A58] hover:bg-[#00353F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004A58]"
                >
                  {generating ? 'Generating...' : 'Generate Contract'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// General Conditions Component
const GeneralConditions = () => {
  const [conditions, setConditions] = useState({
    id: "",
    version: "1.0",
    content: "",
    is_active: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchConditions = async () => {
      try {
        const response = await axios.get(`${API}/general-conditions/active`);
        setConditions(response.data);
        setLoading(false);
      } catch (error) {
        if (error.response?.status === 404) {
          // No active general conditions found, that's okay
          setLoading(false);
        } else {
          console.error("Error fetching general conditions:", error);
          setError("Failed to load general conditions");
          setLoading(false);
        }
      }
    };

    fetchConditions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConditions({
      ...conditions,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      await axios.post(`${API}/general-conditions`, conditions);
      setSuccess(true);
    } catch (error) {
      console.error("Error saving general conditions:", error);
      setError(error.response?.data?.detail || "An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">General Conditions</h3>
            <p className="mt-1 text-sm text-gray-600">
              Manage the general conditions that suppliers must accept before uploading invoices.
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border-l-4 border-green-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">General conditions saved successfully!</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="version" className="block text-sm font-medium text-gray-700">
                    Version
                  </label>
                  <input
                    type="text"
                    name="version"
                    id="version"
                    value={conditions.version}
                    onChange={handleChange}
                    className="mt-1 block w-full shadow-sm focus:ring-[#004A58] focus:border-[#004A58] sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                    Content
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    rows={10}
                    value={conditions.content}
                    onChange={handleChange}
                    className="mt-1 block w-full shadow-sm focus:ring-[#004A58] focus:border-[#004A58] sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter the text of your general conditions..."
                  />
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      checked={conditions.is_active}
                      onChange={(e) => setConditions({...conditions, is_active: e.target.checked})}
                      className="focus:ring-[#004A58] h-4 w-4 text-[#004A58] border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_active" className="font-medium text-gray-700">Active</label>
                    <p className="text-gray-500">Make these general conditions active. This will deactivate any previously active conditions.</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#004A58] hover:bg-[#00353F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004A58]"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/suppliers" element={<SuppliersList />} />
          <Route path="/suppliers/new" element={<SupplierForm />} />
          <Route path="/contracts" element={<ContractsList />} />
          <Route path="/contracts/new" element={<GenerateContractForm />} />
          <Route path="/templates" element={<TemplatesList />} />
          <Route path="/general-conditions" element={<GeneralConditions />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
