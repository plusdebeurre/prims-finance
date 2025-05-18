import React from 'react';
import { useParams, Link } from 'react-router-dom';

export default function SupplierDetails() {
  const { id } = useParams();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold mb-6">Supplier Details</h1>
      <div className="modern-card p-8 text-center">
        <h2 className="text-xl mb-4">Supplier ID: {id}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This feature is under development. You'll be able to view detailed supplier information here.
        </p>
        <div className="mt-4">
          <Link to="/suppliers" className="btn-primary">
            Back to Suppliers
          </Link>
        </div>
      </div>
    </div>
  );
}
