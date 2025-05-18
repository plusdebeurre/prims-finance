import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function InvoiceForm({ isEditing }) {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold mb-6">
        {isEditing ? 'Edit Invoice' : 'Create New Invoice'}
      </h1>
      <div className="modern-card p-8 text-center">
        <h2 className="text-xl mb-4">
          {isEditing ? `Editing Invoice ID: ${id}` : 'Create a New Invoice'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This feature is under development. You'll be able to {isEditing ? 'edit' : 'create'} invoices here.
        </p>
        <div className="mt-4">
          <button
            className="btn-primary mr-2"
            onClick={() => navigate('/invoices')}
          >
            Back to Invoices
          </button>
        </div>
      </div>
    </div>
  );
}
