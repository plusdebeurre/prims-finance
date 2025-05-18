import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  requireSuperAdmin = false,
  requireSupplier = false 
}) {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="loader mr-3 h-8 w-8 border-4"></div>
      <span className="text-lg">Loading...</span>
    </div>;
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = currentUser.role;

  // Check admin requirement
  if (requireAdmin && userRole !== 'admin' && userRole !== 'super_admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check super admin requirement
  if (requireSuperAdmin && userRole !== 'super_admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check supplier requirement
  if (requireSupplier && userRole !== 'supplier') {
    return <Navigate to="/unauthorized" replace />;
  }

  // If all checks pass, render the protected component
  return children;
}
