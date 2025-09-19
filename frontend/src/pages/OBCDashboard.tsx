import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Filter, Eye, Send, ArrowLeft, LogOut } from 'lucide-react';

const OBCDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<any[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!user || user.role !== 'obc') {
      navigate('/admin/login');
      return;
    }

    // Mock data
    setClaims([
      {
        id: 'JNU1234567890',
        employeeName: 'Dr. Rajesh Kumar',
        department: 'School of Social Sciences',
        submissionDate: '2024-01-15',
        totalAmount: 15750,
        status: 'pending',
        patientName: 'Dr. Rajesh Kumar',
        relationship: 'Self'
      },
      {
        id: 'JNU1234567891',
        employeeName: 'Prof. Sunita Sharma',
        department: 'School of Life Sciences',
        submissionDate: '2024-01-14',
        totalAmount: 8500,
        status: 'reviewed',
        patientName: 'Amit Sharma',
        relationship: 'Son'
      }
    ]);
  }, [user, navigate]);

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-green-100 text-green-800',
      returned: 'bg-red-100 text-red-800'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const handleViewClaim = (claim: any) => {
    setSelectedClaim({
      ...claim,
      employee: {
        name: claim.employeeName,
        employeeId: 'EMP001',
        department: claim.department,
        medicalCardNumber: 'CGHS123456',
        cardValidity: '2025-12-31',
        wardEntitlement: 'Private'
      },
      patient: {
        name: claim.patientName,
        relationship: claim.relationship
      },
      treatment: {
        hospitalDetails: 'AIIMS, New Delhi',
        priorPermission: 'yes',
        emergency: 'no',
        insuranceDetails: ''
      },
      expenses: [
        {
          id: '1',
          billNo: 'B001',
          date: '2024-01-10',
          description: 'General Consultation',
          category: 'OPD',
          amountClaimed: 5000,
          amountPassed: 5000
        },
        {
          id: '2',
          billNo: 'B002',
          date: '2024-01-11',
          description: 'Blood Tests',
          category: 'Tests',
          amountClaimed: 2500,
          amountPassed: 2500
        }
      ]
    });
  };

  const handleForwardToClaim = (claimId: string) => {
    setClaims(claims.map(claim => 
      claim.id === claimId 
        ? { ...claim, status: 'reviewed' }
        : claim
    ));
    setSelectedClaim(null);
    alert('Claim forwarded to Health Centre successfully!');
  };

  const filteredClaims = claims.filter(claim => 
    filterStatus === 'all' || claim.status === filterStatus
  );

  if (selectedClaim) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-blue-800">Claim Review</h1>
                <p className="text-gray-600 mt-1">Tracking ID: {selectedClaim.id}</p>
              </div>
              <button
                onClick={() => setSelectedClaim(null)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Claim Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Employee Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Employee Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">{selectedClaim.employee.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Employee ID:</span>
                      <p className="font-medium">{selectedClaim.employee.employeeId}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Department:</span>
                      <p className="font-medium">{selectedClaim.employee.department}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">CGHS Card:</span>
                      <p className="font-medium">{selectedClaim.employee.medicalCardNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Patient Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Patient Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Patient Name:</span>
                      <p className="font-medium">{selectedClaim.patient.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Relationship:</span>
                      <p className="font-medium">{selectedClaim.patient.relationship}</p>
                    </div>
                  </div>
                </div>

                {/* Treatment Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Treatment Details</h3>
                  <div className="text-sm">
                    <div className="mb-2">
                      <span className="text-gray-600">Hospital:</span>
                      <p className="font-medium">{selectedClaim.treatment.hospitalDetails}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-600">Prior Permission:</span>
                        <p className="font-medium">{selectedClaim.treatment.priorPermission === 'yes' ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Emergency:</span>
                        <p className="font-medium">{selectedClaim.treatment.emergency === 'yes' ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expenses */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Expense Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Bill No.</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Description</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Category</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedClaim.expenses.map((expense: any) => (
                          <tr key={expense.id}>
                            <td className="px-3 py-2">{expense.billNo}</td>
                            <td className="px-3 py-2">{expense.date}</td>
                            <td className="px-3 py-2">{expense.description}</td>
                            <td className="px-3 py-2">{expense.category}</td>
                            <td className="px-3 py-2 text-right font-medium">₹ {expense.amountClaimed}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-white">
                        <tr>
                          <td colSpan={4} className="px-3 py-2 font-medium text-right">Total:</td>
                          <td className="px-3 py-2 text-right font-bold text-blue-600">
                            ₹ {selectedClaim.expenses.reduce((total: number, expense: any) => total + expense.amountClaimed, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* Actions Panel */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-3">Review Actions</h4>
                  
                  <div className="space-y-3">
                    <textarea
                      placeholder="Add review comments..."
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <button
                      onClick={() => handleForwardToClaim(selectedClaim.id)}
                      className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      <Send className="w-4 h-4" />
                      <span>Forward to Health Centre</span>
                    </button>
                    
                    <button className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                      Return for Corrections
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted:</span>
                      <span>{selectedClaim.submissionDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Status:</span>
                      <span className="font-medium">OBC Review</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-blue-800">OBC/SC/ST Cell Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome, {user?.name} | Medical Claims Management
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-600">Pending Review</p>
                  <p className="text-xl font-semibold text-yellow-800">
                    {claims.filter(c => c.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm text-green-600">Reviewed</p>
                  <p className="text-xl font-semibold text-green-800">
                    {claims.filter(c => c.status === 'reviewed').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm text-blue-600">Total Claims</p>
                  <p className="text-xl font-semibold text-blue-800">{claims.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-gray-600" />
                <div className="ml-3">
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-xl font-semibold text-gray-800">{claims.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Claims</option>
                <option value="pending">Pending Review</option>
                <option value="reviewed">Reviewed</option>
                <option value="returned">Returned</option>
              </select>
            </div>
          </div>

          {/* Claims Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tracking ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Department</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClaims.map((claim, index) => (
                  <tr key={claim.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm font-mono">{claim.id}</td>
                    <td className="px-4 py-3 text-sm">{claim.employeeName}</td>
                    <td className="px-4 py-3 text-sm">{claim.department}</td>
                    <td className="px-4 py-3 text-sm font-medium">₹ {claim.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">{claim.submissionDate}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(claim.status)}`}>
                        {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewClaim(claim)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 mx-auto"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OBCDashboard;