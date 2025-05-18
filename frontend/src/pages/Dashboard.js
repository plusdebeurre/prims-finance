import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    contractsCount: 0,
    pendingSignatureCount: 0,
    suppliersCount: 0,
    templatesCount: 0,
    purchaseOrdersCount: 0,
    invoicesCount: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // In a real implementation, we would fetch actual data from the API
        // For now, set demo data based on user role
        
        // Mock data for demonstration
        const mockAdminStats = {
          contractsCount: 24,
          pendingSignatureCount: 5,
          suppliersCount: 18,
          templatesCount: 7,
          purchaseOrdersCount: 32,
          invoicesCount: 27
        };
        
        const mockSupplierStats = {
          contractsCount: 8,
          pendingSignatureCount: 2,
          purchaseOrdersCount: 12,
          invoicesCount: 10
        };
        
        const mockAdminActivity = [
          {
            date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            event: 'Contract sent to Supplier XYZ',
            type: 'Contract',
            status: 'Pending'
          },
          {
            date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
            event: 'Invoice #INV-2023-042 received',
            type: 'Invoice',
            status: 'Completed'
          },
          {
            date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            event: 'New supplier registered',
            type: 'Supplier',
            status: 'Completed'
          },
          {
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
            event: 'Purchase order #PO-2023-021 created',
            type: 'Purchase Order',
            status: 'Completed'
          },
          {
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
            event: 'Contract with ABC Corp signed',
            type: 'Contract',
            status: 'Completed'
          }
        ];
        
        const mockSupplierActivity = [
          {
            date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
            event: 'New contract received',
            type: 'Contract',
            status: 'Pending'
          },
          {
            date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            event: 'Purchase order #PO-2023-019 received',
            type: 'Purchase Order',
            status: 'Pending'
          },
          {
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
            event: 'Invoice #INV-2023-038 sent',
            type: 'Invoice',
            status: 'Completed'
          },
          {
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
            event: 'Contract #CT-2023-015 signed',
            type: 'Contract',
            status: 'Completed'
          }
        ];

        // Set mock data based on user role
        if (currentUser?.isSupplier) {
          setStats(mockSupplierStats);
          setRecentActivity(mockSupplierActivity);
        } else {
          setStats(mockAdminStats);
          setRecentActivity(mockAdminActivity);
        }

        // In real implementation, we would use API calls like these:
        /*
        if (currentUser.isSupplier) {
          const [activityRes, statsRes] = await Promise.all([
            axios.get(`${API}/supplier/activity`),
            axios.get(`${API}/supplier/stats`)
          ]);
          setRecentActivity(activityRes.data);
          setStats(statsRes.data);
        } else if (currentUser.isAdmin || currentUser.isSuperAdmin) {
          const [activityRes, statsRes] = await Promise.all([
            axios.get(`${API}/admin/activity`),
            axios.get(`${API}/admin/stats`)
          ]);
          setRecentActivity(activityRes.data);
          setStats(statsRes.data);
        }
        */
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader mr-3 h-8 w-8 border-4"></div>
        <span className="text-lg">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        <h1 className="text-2xl font-semibold mb-6">
          Welcome, {currentUser?.name || 'User'}
        </h1>
        
        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-md dark:bg-red-900 dark:border-red-700 dark:text-red-100">
            {error}
          </div>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
          {currentUser?.isSupplier && (
            <>
              <div className="stats-card">
                <div className="text-indigo-600 dark:text-indigo-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Contracts</p>
                  <p className="text-xl font-semibold">{stats.contractsCount}</p>
                </div>
              </div>
              <div className="stats-card">
                <div className="text-yellow-500 dark:text-yellow-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Signature</p>
                  <p className="text-xl font-semibold">{stats.pendingSignatureCount}</p>
                </div>
              </div>
              <div className="stats-card">
                <div className="text-green-500 dark:text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Purchase Orders</p>
                  <p className="text-xl font-semibold">{stats.purchaseOrdersCount}</p>
                </div>
              </div>
              <div className="stats-card">
                <div className="text-blue-500 dark:text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Invoices</p>
                  <p className="text-xl font-semibold">{stats.invoicesCount}</p>
                </div>
              </div>
            </>
          )}

          {(currentUser?.isAdmin || currentUser?.isSuperAdmin) && (
            <>
              <div className="stats-card">
                <div className="text-blue-600 dark:text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Suppliers</p>
                  <p className="text-xl font-semibold">{stats.suppliersCount}</p>
                </div>
              </div>
              <div className="stats-card">
                <div className="text-indigo-600 dark:text-indigo-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Contracts</p>
                  <p className="text-xl font-semibold">{stats.contractsCount}</p>
                </div>
              </div>
              <div className="stats-card">
                <div className="text-yellow-500 dark:text-yellow-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Signature</p>
                  <p className="text-xl font-semibold">{stats.pendingSignatureCount}</p>
                </div>
              </div>
              <div className="stats-card">
                <div className="text-purple-500 dark:text-purple-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Templates</p>
                  <p className="text-xl font-semibold">{stats.templatesCount}</p>
                </div>
              </div>
              <div className="stats-card">
                <div className="text-green-500 dark:text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Purchase Orders</p>
                  <p className="text-xl font-semibold">{stats.purchaseOrdersCount}</p>
                </div>
              </div>
              <div className="stats-card">
                <div className="text-blue-500 dark:text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Invoices</p>
                  <p className="text-xl font-semibold">{stats.invoicesCount}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Recent Activity */}
        <div className="modern-card mb-8">
          <h2 className="text-lg font-semibold mb-4 px-4 pt-4">Recent Activity</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No recent activity
                    </td>
                  </tr>
                ) : (
                  recentActivity.map((activity, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(activity.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {activity.event}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {activity.type}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activity.status === 'Completed' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                            : activity.status === 'Pending' 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                            : activity.status === 'Failed'
                            ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                        }`}>
                          {activity.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="modern-card p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentUser?.isSupplier && (
              <>
                <a href="/my-contracts" className="p-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg flex items-center transition duration-150">
                  <div className="mr-4 text-indigo-500 dark:text-indigo-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">View Contracts</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your contracts</p>
                  </div>
                </a>
                <a href="/my-documents" className="p-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg flex items-center transition duration-150">
                  <div className="mr-4 text-purple-500 dark:text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Upload Documents</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your documents</p>
                  </div>
                </a>
                <a href="/my-purchase-orders" className="p-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg flex items-center transition duration-150">
                  <div className="mr-4 text-green-500 dark:text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Purchase Orders</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View received orders</p>
                  </div>
                </a>
                <a href="/profile" className="p-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg flex items-center transition duration-150">
                  <div className="mr-4 text-blue-500 dark:text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">My Profile</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Update your information</p>
                  </div>
                </a>
              </>
            )}
            
            {(currentUser?.isAdmin || currentUser?.isSuperAdmin) && (
              <>
                <a href="/contracts/new" className="p-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg flex items-center transition duration-150">
                  <div className="mr-4 text-indigo-500 dark:text-indigo-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">New Contract</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Create a contract</p>
                  </div>
                </a>
                <a href="/suppliers" className="p-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg flex items-center transition duration-150">
                  <div className="mr-4 text-blue-500 dark:text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Manage Suppliers</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View and edit suppliers</p>
                  </div>
                </a>
                <a href="/purchase-orders/new" className="p-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg flex items-center transition duration-150">
                  <div className="mr-4 text-green-500 dark:text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">New Purchase Order</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Create purchase order</p>
                  </div>
                </a>
                <a href="/templates" className="p-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg flex items-center transition duration-150">
                  <div className="mr-4 text-purple-500 dark:text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Contract Templates</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage templates</p>
                  </div>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
