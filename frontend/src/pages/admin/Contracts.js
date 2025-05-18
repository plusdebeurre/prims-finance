import React from 'react';
import { Link } from 'react-router-dom';

export default function Contracts() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold">Contracts</h1>
        <Link to="/contracts/new" className="btn-primary mt-4 md:mt-0">
          Create New Contract
        </Link>
      </div>
      <div className="modern-card p-8 text-center">
        <h2 className="text-xl mb-4">Contract Management</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This feature is under development. You'll be able to manage all your contracts from this page.
        </p>
        <p className="text-gray-500 dark:text-gray-500">
          Coming soon...
        </p>
      </div>
    </div>
  );
}
