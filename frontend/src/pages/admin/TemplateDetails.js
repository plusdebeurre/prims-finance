import React from 'react';
import { useParams, Link } from 'react-router-dom';

export default function TemplateDetails() {
  const { id } = useParams();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold mb-6">Template Details</h1>
      <div className="modern-card p-8 text-center">
        <h2 className="text-xl mb-4">Template ID: {id}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This feature is under development. You'll be able to view detailed template information here.
        </p>
        <div className="mt-4">
          <Link to="/templates" className="btn-primary">
            Back to Templates
          </Link>
        </div>
      </div>
    </div>
  );
}
