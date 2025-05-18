import React from 'react';
import { Link } from 'react-router-dom';

export default function MyPurchaseOrders() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold mb-6">My Purchase Orders</h1>
      <div className="modern-card p-8 text-center">
        <h2 className="text-xl mb-4">Your Purchase Order Management</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This feature is under development. You'll be able to view and manage all purchase orders sent to you.
        </p>
        <p className="text-gray-500 dark:text-gray-500">
          Coming soon...
        </p>
      </div>
    </div>
  );
}
