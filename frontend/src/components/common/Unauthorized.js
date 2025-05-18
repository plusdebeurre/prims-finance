import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Unauthorized() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold tracking-tight gradient-text mb-2">
          PRISM'FINANCE
        </h1>
        <h2 className="mt-2 text-center text-xl font-semibold text-gray-700 dark:text-gray-300">
          Unauthorized Access 🔒
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="modern-card py-8 px-4 sm:px-10">
          <div className="notification error">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-red-800">Unauthorized Access</h3>
              <p className="mt-2 text-sm text-red-700">
                You don't have permission to access this page.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <p className="text-center text-gray-600 dark:text-gray-400">
              {currentUser ? (
                <>
                  You are logged in as <span className="font-medium">{currentUser.name}</span> with role <span className="font-medium">{currentUser.role}</span>.
                </>
              ) : (
                'You are not logged in.'
              )}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {currentUser ? (
                <>
                  <Link to="/dashboard" className="btn-primary">
                    Go to Dashboard
                  </Link>
                  <button onClick={logout} className="btn-secondary">
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn-primary">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
