import React, { createContext, useState, useContext, useEffect } from 'react';

// Create a language context with English and French translations
const translations = {
  en: {
    // Common
    dashboard: 'Dashboard',
    suppliers: 'Suppliers',
    contracts: 'Contracts',
    templates: 'Templates',
    purchaseOrders: 'Purchase Orders',
    invoices: 'Invoices',
    profile: 'Profile',
    logout: 'Logout',
    
    // Suppliers
    addSupplier: 'Add Supplier',
    supplierDetails: 'Supplier Details',
    editSupplier: 'Edit Supplier',
    
    // Contracts
    createContract: 'Create Contract',
    contractDetails: 'Contract Details',
    editContract: 'Edit Contract',
    pendingSignature: 'Pending Signature',
    signed: 'Signed',
    expired: 'Expired',
    cancelled: 'Cancelled',
    
    // Templates
    createTemplate: 'Create Template',
    templateDetails: 'Template Details',
    editTemplate: 'Edit Template',
    
    // Purchase Orders
    createPurchaseOrder: 'Create Purchase Order',
    purchaseOrderDetails: 'Purchase Order Details',
    editPurchaseOrder: 'Edit Purchase Order',
    
    // Invoices
    createInvoice: 'Create Invoice',
    invoiceDetails: 'Invoice Details',
    editInvoice: 'Edit Invoice',
    
    // Supplier Profile
    myContracts: 'My Contracts',
    myPurchaseOrders: 'My Purchase Orders',
    myInvoices: 'My Invoices',
    myDocuments: 'My Documents',
    uploadDocument: 'Upload Document',
    
    // Auth
    login: 'Login',
    register: 'Register',
    forgotPassword: 'Forgot Password',
    resetPassword: 'Reset Password',
    
    // Form Fields
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    name: 'Name',
    companyName: 'Company Name',
    companyType: 'Company Type',
    address: 'Address',
    postalCode: 'Postal Code',
    city: 'City',
    country: 'Country',
    registrationNumber: 'Registration Number (SIRET)',
    registrationCity: 'Registration City',
    representativeName: 'Representative Full Name',
    representativeRole: 'Representative Role',
    phone: 'Phone Number',
    
    // Actions
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    download: 'Download',
    upload: 'Upload',
    submit: 'Submit',
    search: 'Search',
    filter: 'Filter',
    
    // Notifications
    notificationTitle: 'Notifications',
    noNotifications: 'No notifications',
    markAllRead: 'Mark all as read',
    
    // Messages
    welcome: 'Welcome',
    loading: 'Loading...',
    noData: 'No data available',
    errorLoading: 'Error loading data',
    confirmDelete: 'Are you sure you want to delete this?',
    
    // Status
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    
    // Dates
    createdOn: 'Created on',
    updatedOn: 'Updated on',
    expiresOn: 'Expires on',
  },
  fr: {
    // Common
    dashboard: 'Tableau de bord',
    suppliers: 'Fournisseurs',
    contracts: 'Contrats',
    templates: 'Modèles',
    purchaseOrders: 'Bons de commande',
    invoices: 'Factures',
    profile: 'Profil',
    logout: 'Déconnexion',
    
    // Suppliers
    addSupplier: 'Ajouter un fournisseur',
    supplierDetails: 'Détails du fournisseur',
    editSupplier: 'Modifier le fournisseur',
    
    // Contracts
    createContract: 'Créer un contrat',
    contractDetails: 'Détails du contrat',
    editContract: 'Modifier le contrat',
    pendingSignature: 'En attente de signature',
    signed: 'Signé',
    expired: 'Expiré',
    cancelled: 'Annulé',
    
    // Templates
    createTemplate: 'Créer un modèle',
    templateDetails: 'Détails du modèle',
    editTemplate: 'Modifier le modèle',
    
    // Purchase Orders
    createPurchaseOrder: 'Créer un bon de commande',
    purchaseOrderDetails: 'Détails du bon de commande',
    editPurchaseOrder: 'Modifier le bon de commande',
    
    // Invoices
    createInvoice: 'Créer une facture',
    invoiceDetails: 'Détails de la facture',
    editInvoice: 'Modifier la facture',
    
    // Supplier Profile
    myContracts: 'Mes contrats',
    myPurchaseOrders: 'Mes bons de commande',
    myInvoices: 'Mes factures',
    myDocuments: 'Mes documents',
    uploadDocument: 'Téléverser un document',
    
    // Auth
    login: 'Connexion',
    register: 'Inscription',
    forgotPassword: 'Mot de passe oublié',
    resetPassword: 'Réinitialiser le mot de passe',
    
    // Form Fields
    email: 'Email',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    name: 'Nom',
    companyName: 'Nom de l\'entreprise',
    companyType: 'Type d\'entreprise',
    address: 'Adresse',
    postalCode: 'Code postal',
    city: 'Ville',
    country: 'Pays',
    registrationNumber: 'Numéro d\'immatriculation (SIRET)',
    registrationCity: 'Ville d\'immatriculation',
    representativeName: 'Nom complet du représentant',
    representativeRole: 'Rôle du représentant',
    phone: 'Numéro de téléphone',
    
    // Actions
    save: 'Enregistrer',
    cancel: 'Annuler',
    edit: 'Modifier',
    delete: 'Supprimer',
    view: 'Voir',
    download: 'Télécharger',
    upload: 'Téléverser',
    submit: 'Soumettre',
    search: 'Rechercher',
    filter: 'Filtrer',
    
    // Notifications
    notificationTitle: 'Notifications',
    noNotifications: 'Aucune notification',
    markAllRead: 'Marquer tout comme lu',
    
    // Messages
    welcome: 'Bienvenue',
    loading: 'Chargement...',
    noData: 'Aucune donnée disponible',
    errorLoading: 'Erreur lors du chargement des données',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer ceci ?',
    
    // Status
    active: 'Actif',
    inactive: 'Inactif',
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    
    // Dates
    createdOn: 'Créé le',
    updatedOn: 'Mis à jour le',
    expiresOn: 'Expire le',
  }
};

const LanguageContext = createContext();

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }) {
  // Get language from localStorage or use 'fr' as default
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'fr');
  const [t, setT] = useState(translations[language]);

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('language', language);
    setT(translations[language]);
  }, [language]);

  // Toggle between French and English
  const toggleLanguage = () => {
    setLanguage(prevLang => prevLang === 'fr' ? 'en' : 'fr');
  };

  // Translate a key
  const translate = (key) => {
    return t[key] || key;
  };

  const value = {
    language,
    toggleLanguage,
    translate,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
