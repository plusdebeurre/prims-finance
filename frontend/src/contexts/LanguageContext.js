import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the translations
export const translations = {
  en: {
    // Common
    app_name: 'PRISM\'FINANCE',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    submit: 'Submit',
    upload: 'Upload',
    download: 'Download',
    view: 'View',
    success: 'Success',
    error: 'Error',
    confirm: 'Confirm',
    search: 'Search',
    filter: 'Filter',
    required_field: 'This field is required',
    invalid_format: 'Invalid format',
    no_results: 'No results found',
    select: 'Select',
    back: 'Back',
    saving: 'Saving...',
    
    // Authentication
    sign_in: 'Sign In',
    sign_out: 'Sign Out',
    email: 'Email',
    password: 'Password',
    confirm_password: 'Confirm Password',
    forgot_password: 'Forgot Password',
    reset_password: 'Reset Password',
    login_success: 'Login successful',
    login_failed: 'Login failed',
    logout_success: 'Logout successful',
    
    // Navigation
    suppliers: 'Suppliers',
    contracts: 'Contracts',
    templates: 'Templates',
    terms: 'Terms & Conditions',
    profile: 'My Profile',
    my_contracts: 'My Contracts',
    my_invoices: 'My Invoices',
    
    // Suppliers
    add_supplier: 'Add Supplier',
    edit_supplier: 'Edit Supplier',
    supplier_details: 'Supplier Details',
    company_name: 'Company Name',
    siret_number: 'SIRET Number',
    contact_person: 'Contact Person',
    phone: 'Phone',
    address: 'Address',
    postal_code: 'Postal Code',
    city: 'City',
    country: 'Country',
    supplier_documents: 'Supplier Documents',
    document_name: 'Document Name',
    
    // Contracts
    add_contract: 'Add Contract',
    edit_contract: 'Edit Contract',
    contract_details: 'Contract Details',
    contract_name: 'Contract Name',
    contract_type: 'Contract Type',
    start_date: 'Start Date',
    end_date: 'End Date',
    status: 'Status',
    generate_contract: 'Generate Contract',
    sign_contract: 'Sign Contract',
    download_contract: 'Download Contract',
    contract_variables: 'Contract Variables',
    created_at: 'Created At',
    signed_at: 'Signed At',
    template_file: 'Template File',
    variables: 'Variables',
    version: 'Version',
    content: 'Content',
    description: 'Description',
    
    // Templates
    add_template: 'Add Template',
    edit_template: 'Edit Template',
    template_details: 'Template Details',
    template_name: 'Template Name',
    template_variables: 'Template Variables',
    
    // Documents
    add_document: 'Add Document',
    document_type: 'Document Type',
    document_category: 'Category',
    document_date: 'Document Date',
    
    // Purchase Orders
    purchase_orders: 'Purchase Orders',
    add_purchase_order: 'Add Purchase Order',
    po_number: 'PO Number',
    po_date: 'PO Date',
    po_items: 'Items',
    po_total: 'Total',
    invoice: 'Invoice',
    
    // Dashboard
    dashboard: 'Dashboard',
    recent_activity: 'Recent Activity',
    pending_contracts: 'Pending Contracts',
    pending_approvals: 'Pending Approvals',
    statistics: 'Statistics',
    
    // Status labels
    status_draft: 'Draft',
    status_pending: 'Pending',
    status_active: 'Active',
    status_inactive: 'Inactive',
    status_approved: 'Approved',
    status_rejected: 'Rejected',
    status_expired: 'Expired',
    status_signed: 'Signed',
    status_pending_signature: 'Pending Signature',
    
    // Notifications
    notifications: 'Notifications',
    mark_as_read: 'Mark as Read',
    no_notifications: 'No notifications',
  },
  fr: {
    // Common
    app_name: 'PRISM\'FINANCE',
    loading: 'Chargement...',
    save: 'Enregistrer',
    cancel: 'Annuler',
    edit: 'Modifier',
    delete: 'Supprimer',
    submit: 'Soumettre',
    upload: 'Télécharger',
    download: 'Télécharger',
    view: 'Voir',
    success: 'Succès',
    error: 'Erreur',
    confirm: 'Confirmer',
    search: 'Rechercher',
    filter: 'Filtrer',
    required_field: 'Ce champ est obligatoire',
    invalid_format: 'Format invalide',
    no_results: 'Aucun résultat trouvé',
    select: 'Sélectionner',
    back: 'Retour',
    saving: 'Enregistrement...',
    
    // Authentication
    sign_in: 'Se connecter',
    sign_out: 'Se déconnecter',
    email: 'E-mail',
    password: 'Mot de passe',
    confirm_password: 'Confirmer le mot de passe',
    forgot_password: 'Mot de passe oublié',
    reset_password: 'Réinitialiser le mot de passe',
    login_success: 'Connexion réussie',
    login_failed: 'Échec de la connexion',
    logout_success: 'Déconnexion réussie',
    
    // Navigation
    suppliers: 'Fournisseurs',
    contracts: 'Contrats',
    templates: 'Modèles',
    terms: 'Conditions Générales',
    profile: 'Mon Profil',
    my_contracts: 'Mes Contrats',
    my_invoices: 'Mes Factures',
    
    // Suppliers
    add_supplier: 'Ajouter un fournisseur',
    edit_supplier: 'Modifier le fournisseur',
    supplier_details: 'Détails du fournisseur',
    company_name: 'Nom de l\'entreprise',
    siret_number: 'Numéro SIRET',
    contact_person: 'Personne de contact',
    phone: 'Téléphone',
    address: 'Adresse',
    postal_code: 'Code postal',
    city: 'Ville',
    country: 'Pays',
    supplier_documents: 'Documents du fournisseur',
    document_name: 'Nom du document',
    
    // Contracts
    add_contract: 'Ajouter un contrat',
    edit_contract: 'Modifier le contrat',
    contract_details: 'Détails du contrat',
    contract_name: 'Nom du contrat',
    contract_type: 'Type de contrat',
    start_date: 'Date de début',
    end_date: 'Date de fin',
    status: 'Statut',
    generate_contract: 'Générer le contrat',
    sign_contract: 'Signer le contrat',
    download_contract: 'Télécharger le contrat',
    contract_variables: 'Variables du contrat',
    created_at: 'Créé le',
    signed_at: 'Signé le',
    template_file: 'Fichier modèle',
    variables: 'Variables',
    version: 'Version',
    content: 'Contenu',
    description: 'Description',
    
    // Templates
    add_template: 'Ajouter un modèle',
    edit_template: 'Modifier le modèle',
    template_details: 'Détails du modèle',
    template_name: 'Nom du modèle',
    template_variables: 'Variables du modèle',
    
    // Documents
    add_document: 'Ajouter un document',
    document_type: 'Type de document',
    document_category: 'Catégorie',
    document_date: 'Date du document',
    
    // Purchase Orders
    purchase_orders: 'Bons de commande',
    add_purchase_order: 'Ajouter un bon de commande',
    po_number: 'Numéro de BC',
    po_date: 'Date de BC',
    po_items: 'Articles',
    po_total: 'Total',
    invoice: 'Facture',
    
    // Dashboard
    dashboard: 'Tableau de bord',
    recent_activity: 'Activité récente',
    pending_contracts: 'Contrats en attente',
    pending_approvals: 'Approbations en attente',
    statistics: 'Statistiques',
    
    // Status labels
    status_draft: 'Brouillon',
    status_pending: 'En attente',
    status_active: 'Actif',
    status_inactive: 'Inactif',
    status_approved: 'Approuvé',
    status_rejected: 'Rejeté',
    status_expired: 'Expiré',
    status_signed: 'Signé',
    status_pending_signature: 'En attente de signature',
    
    // Notifications
    notifications: 'Notifications',
    mark_as_read: 'Marquer comme lu',
    no_notifications: 'Aucune notification',
  }
};

// Create language context
const LanguageContext = createContext();

export const useLanguage = () => {
  return useContext(LanguageContext);
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('fr'); // French as default
  
  // Function to change language
  const changeLanguage = (newLanguage) => {
    if (newLanguage === 'en' || newLanguage === 'fr') {
      setLanguage(newLanguage);
      localStorage.setItem('prismLanguage', newLanguage);
    }
  };
  
  // Function to get translation
  const t = (key) => {
    return translations[language][key] || key;
  };
  
  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('prismLanguage');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);
  
  const value = {
    language,
    changeLanguage,
    t
  };
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
