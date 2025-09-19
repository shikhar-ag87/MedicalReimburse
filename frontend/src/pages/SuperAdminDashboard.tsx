import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Download, FileText, TrendingUp, Calendar, LogOut } from 'lucide-react';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  useEffect(() => {
    if (!user || user.role !== 'super-admin') {
      navigate('/admin/login');
      return;
    }

    // Mock data for reports
    setStats({
      totalClaims: 156,
      approvedClaims: 134,
      rejectedClaims: 12,
      pendingClaims: 10,
      totalAmount: 2850000,
      approvedAmount: 2456000,
      avgProcessingTime: 8.5,
      monthlyData: [
        { month: 'Jan', claims: 45, amount: 850000 },
        { month: 'Feb', claims: 38, amount: 720000 },
        { month: 'Mar', claims: 52, amount: 980000 },
        { month: 'Apr', claims: 41, amount: 760000 },
        { month: 'May', claims: 48, amount: 890000 }
      ],
      topDepartments: [
        { name: 'School of Social Sciences', claims: 28, amount: 520000 },
        { name: 'School of Life Sciences', claims: 24, amount: 450000 },
        { name: 'School of Physical Sciences', claims: 22, amount: 410000 },
        { name: 'School of International Studies', claims: 18, amount: 340000 }
      ]
    });
  }, [user, navigate]);

  const generateReport = (format: 'excel' | 'pdf') => {
    // Mock report generation
    alert(`${format.toUpperCase()} report will be downloaded. This feature would integrate with actual data export in production.`);
  };

  if (!stats) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-blue-800">Super Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome, {user?.name} | Medical Reimbursement Analytics & Reports
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              className="flex items-center space-x-2 text-red-600 hover:text-red-800"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-blue-600">Total Claims</p>
                  <p className="text-2xl font-bold text-blue-800">{stats.totalClaims}</p>
                  <p className="text-xs text-blue-600 mt-1">This fiscal year</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-green-600">Approved Claims</p>
                  <p className="text-2xl font-bold text-green-800">{stats.approvedClaims}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {((stats.approvedClaims / stats.totalClaims) * 100).toFixed(1)}% approval rate
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm text-purple-600">Total Amount</p>
                  <p className="text-2xl font-bold text-purple-800">
                    ₹ {(stats.totalAmount / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Claimed amount</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm text-yellow-600">Avg Processing</p>
                  <p className="text-2xl font-bold text-yellow-800">{stats.avgProcessingTime}</p>
                  <p className="text-xs text-yellow-600 mt-1">Days per claim</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reports Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Trends */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              
              <div className="space-y-3">
                {stats.monthlyData.map((month: any, index: number) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-xs font-medium text-blue-800">
                        {month.month}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{month.claims} Claims</p>
                        <p className="text-xs text-gray-600">₹ {(month.amount / 1000).toFixed(0)}K</p>
                      </div>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(month.claims / 60) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Departments */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Departments by Claims</h3>
              <div className="space-y-3">
                {stats.topDepartments.map((dept: any, index: number) => (
                  <div key={dept.name} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{dept.name}</p>
                      <p className="text-xs text-gray-600">{dept.claims} claims</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₹ {(dept.amount / 1000).toFixed(0)}K</p>
                      <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(dept.amount / 600000) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats and Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Processing Status */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending OBC Review</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                    5
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Health Centre Review</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    3
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Final Approval</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                    2
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Claimed:</span>
                  <span className="text-sm font-semibold">₹ {(stats.totalAmount / 1000000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Approved:</span>
                  <span className="text-sm font-semibold text-green-600">₹ {(stats.approvedAmount / 1000000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-2">
                  <span className="text-sm text-gray-600">Savings:</span>
                  <span className="text-sm font-semibold text-blue-600">
                    ₹ {((stats.totalAmount - stats.approvedAmount) / 1000000).toFixed(2)}M
                  </span>
                </div>
              </div>
            </div>

            {/* Report Generation */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Reports</h3>
              <div className="space-y-3">
                <button
                  onClick={() => generateReport('excel')}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Excel Report</span>
                </button>
                <button
                  onClick={() => generateReport('pdf')}
                  className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF Report</span>
                </button>
                <div className="text-xs text-gray-600 text-center mt-2">
                  Reports include all claims data, financial summaries, and processing metrics
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;