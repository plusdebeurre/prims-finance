import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

// Layout Components
import AppLayout from './components/layout/AppLayout';
import Unauthorized from './components/common/Unauthorized';
import ProtectedRoute from './components/common/ProtectedRoute';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Dashboard Components
import Dashboard from './pages/Dashboard';

// Supplier Components
import Suppliers from './pages/admin/Suppliers';
import SupplierDetails from './pages/admin/SupplierDetails';
import SupplierForm from './pages/admin/SupplierForm';
import MyProfile from './pages/supplier/MyProfile';
import MyDocuments from './pages/supplier/MyDocuments';

// Contract Components
import Contracts from './pages/admin/Contracts';
import ContractDetails from './pages/admin/ContractDetails';
import ContractForm from './pages/admin/ContractForm';
import MyContracts from './pages/supplier/MyContracts';
import MyContractDetails from './pages/supplier/MyContractDetails';

// Template Components
import Templates from './pages/admin/Templates';
import TemplateDetails from './pages/admin/TemplateDetails';
import TemplateForm from './pages/admin/TemplateForm';

// Purchase Order Components
import PurchaseOrders from './pages/admin/PurchaseOrders';
import PurchaseOrderDetails from './pages/admin/PurchaseOrderDetails';
import PurchaseOrderForm from './pages/admin/PurchaseOrderForm';
import MyPurchaseOrders from './pages/supplier/MyPurchaseOrders';
import MyPurchaseOrderDetails from './pages/supplier/MyPurchaseOrderDetails';

// Invoice Components
import Invoices from './pages/admin/Invoices';
import InvoiceDetails from './pages/admin/InvoiceDetails';
import InvoiceForm from './pages/admin/InvoiceForm';
import MyInvoices from './pages/supplier/MyInvoices';
import MyInvoiceDetails from './pages/supplier/MyInvoiceDetails';

// Super Admin Components
import Companies from './pages/super-admin/Companies';
import CompanyDetails from './pages/super-admin/CompanyDetails';
import CompanyForm from './pages/super-admin/CompanyForm';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected Routes */}
            <Route 
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              } 
            />

            {/* Dashboard */}
            <Route 
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Admin Routes */}
            {/* Suppliers */}
            <Route 
              path="/suppliers"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <Suppliers />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/suppliers/new"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <SupplierForm />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/suppliers/:id"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <SupplierDetails />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/suppliers/:id/edit"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <SupplierForm isEditing={true} />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Contracts */}
            <Route 
              path="/contracts"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <Contracts />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contracts/new"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <ContractForm />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contracts/:id"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <ContractDetails />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contracts/:id/edit"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <ContractForm isEditing={true} />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Templates */}
            <Route 
              path="/templates"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <Templates />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/templates/new"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <TemplateForm />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/templates/:id"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <TemplateDetails />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/templates/:id/edit"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <TemplateForm isEditing={true} />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Purchase Orders */}
            <Route 
              path="/purchase-orders"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <PurchaseOrders />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/purchase-orders/new"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <PurchaseOrderForm />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/purchase-orders/:id"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <PurchaseOrderDetails />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/purchase-orders/:id/edit"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <PurchaseOrderForm isEditing={true} />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Invoices */}
            <Route 
              path="/invoices"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <Invoices />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/invoices/new"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <InvoiceForm />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/invoices/:id"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <InvoiceDetails />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/invoices/:id/edit"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <InvoiceForm isEditing={true} />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Supplier Routes */}
            <Route 
              path="/profile"
              element={
                <ProtectedRoute requireSupplier={true}>
                  <AppLayout>
                    <MyProfile />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-documents"
              element={
                <ProtectedRoute requireSupplier={true}>
                  <AppLayout>
                    <MyDocuments />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-contracts"
              element={
                <ProtectedRoute requireSupplier={true}>
                  <AppLayout>
                    <MyContracts />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-contracts/:id"
              element={
                <ProtectedRoute requireSupplier={true}>
                  <AppLayout>
                    <MyContractDetails />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-purchase-orders"
              element={
                <ProtectedRoute requireSupplier={true}>
                  <AppLayout>
                    <MyPurchaseOrders />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-purchase-orders/:id"
              element={
                <ProtectedRoute requireSupplier={true}>
                  <AppLayout>
                    <MyPurchaseOrderDetails />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-invoices"
              element={
                <ProtectedRoute requireSupplier={true}>
                  <AppLayout>
                    <MyInvoices />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-invoices/:id"
              element={
                <ProtectedRoute requireSupplier={true}>
                  <AppLayout>
                    <MyInvoiceDetails />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Super Admin Routes */}
            <Route 
              path="/companies"
              element={
                <ProtectedRoute requireSuperAdmin={true}>
                  <AppLayout>
                    <Companies />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/companies/new"
              element={
                <ProtectedRoute requireSuperAdmin={true}>
                  <AppLayout>
                    <CompanyForm />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/companies/:id"
              element={
                <ProtectedRoute requireSuperAdmin={true}>
                  <AppLayout>
                    <CompanyDetails />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/companies/:id/edit"
              element={
                <ProtectedRoute requireSuperAdmin={true}>
                  <AppLayout>
                    <CompanyForm isEditing={true} />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;