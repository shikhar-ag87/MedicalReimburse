import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, Edit3, Save, ArrowLeft, LogOut } from 'lucide-react';

const HealthCentreDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<any[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [editingExpenses, setEditingExpenses] = useState<any[]>([]);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'health-centre') {
      navigate('/admin/login');
      return;
    }

    // Mock data - claims forwarded from OBC Cell
    setClaims([
      {
        id: 'JNU1234567891',
        employeeName: 'Prof. Sunita Sharma',
        department: 'School of Life Sciences',
        submissionDate: '2024-01-14',
        totalAmount: 8500,
        status: 'pending_health_review',
        patientName: 'Amit Sharma',
        relationship: 'Son'
      }
    ]);
  }, [user, navigate]);

  const handleViewClaim = (claim: any) => {
    const claimDetails = {
      ...claim,
      expenses: [
        {
          id: '1',
          billNo: 'B001',
          date: '2024-01-10',
          description: 'General Consultation',
          category: 'OPD',
          amountClaimed: 3000,
          amountPassed: 3000,
          remarks: ''
        },
        {
          id: '2',
          billNo: 'B002',
          date: '2024-01-11',
          description: 'Blood Tests',
          category: 'Tests',
          amountClaimed: 2500,
          amountPassed: 2000,
          remarks: 'Standard govt. rate applied'
        },
        {
          id: '3',
          billNo: 'B003',
          date: '2024-01-12',
          description: 'Medicine',
          category: 'OPD',
          amountClaimed: 3000,
          amountPassed: 2500,
          remarks: 'Generic equivalent rate'
        }
      ]
    };
    
    setSelectedClaim(claimDetails);
    setEditingExpenses([...claimDetails.expenses]);
    setRemarks('');
  };

  const updateExpenseAmount = (id: string, field: string, value: number | string) => {
    setEditingExpenses(prev => 
      prev.map(expense => 
        expense.id === id ? { ...expense, [field]: value } : expense
      )
    );
  };

  const handleApprove = () => {
    // Update the claim with new amounts and remarks
    const updatedClaim = {
      ...selectedClaim,
      expenses: editingExpenses,
      healthCentreRemarks: remarks,
      status: 'approved',
      finalAmount: editingExpenses.reduce((total, expense) => total + (expense.amountPassed || 0), 0)
    };

    setClaims(claims.map(claim => 
      claim.id === selectedClaim.id 
        ? { ...claim, status: 'approved', finalAmount: updatedClaim.finalAmount }
        : claim
    ));
    
    setSelectedClaim(null);
    alert('Claim approved and forwarded to Administration for final processing!');
  };

  const getTotalClaimed = () => {
    return editingExpenses.reduce((total, expense) => total + (expense.amountClaimed || 0), 0);
  };

  const getTotalPassed = () => {
    return editingExpenses.reduce((total, expense) => total + (expense.amountPassed || 0), 0);
  };

  if (selectedClaim) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-blue-800">Medical Review</h1>
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
              {/* Claim Summary */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Claim Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Employee:</span>
                      <p className="font-medium">{selectedClaim.employeeName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Department:</span>
                      <p className="font-medium">{selectedClaim.department}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Patient:</span>
                      <p className="font-medium">{selectedClaim.patientName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Relationship:</span>
                      <p className="font-medium">{selectedClaim.relationship}</p>
                    </div>
                  </div>
                </div>

                {/* Editable Expenses */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Medical Expense Review</h3>
                    <Edit3 className="w-5 h-5 text-blue-600" />
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Bill No.</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Description</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Category</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700">Claimed</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700">Approved</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {editingExpenses.map((expense, index) => (
                          <tr key={expense.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2">{expense.billNo}</td>
                            <td className="px-3 py-2">{expense.description}</td>
                            <td className="px-3 py-2">{expense.category}</td>
                            <td className="px-3 py-2 text-right font-medium">₹ {expense.amountClaimed}</td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={expense.amountPassed}
                                onChange={(e) => updateExpenseAmount(expense.id, 'amountPassed', parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-right text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                min="0"
                                max={expense.amountClaimed}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={expense.remarks}
                                onChange={(e) => updateExpenseAmount(expense.id, 'remarks', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Add remarks..."
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-white border-t-2 border-gray-300">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 font-medium text-right">Totals:</td>
                          <td className="px-3 py-2 text-right font-bold text-gray-800">
                            ₹ {getTotalClaimed().toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-blue-600">
                            ₹ {getTotalPassed().toLocaleString()}
                          </td>
                          <td className="px-3 py-2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Overall Remarks */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Health Centre Remarks</h3>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add general remarks about the medical claim review..."
                  />
                </div>
              </div>

              {/* Actions Panel */}
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-3">Review Summary</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Claimed:</span>
                      <span className="font-medium">₹ {getTotalClaimed().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Approved:</span>
                      <span className="font-bold text-green-600">₹ {getTotalPassed().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-green-200 pt-2">
                      <span className="text-gray-600">Adjustment:</span>
                      <span className={`font-medium ${getTotalClaimed() - getTotalPassed() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹ {(getTotalClaimed() - getTotalPassed()).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    <Save className="w-4 h-4" />
                    <span>Approve & Forward</span>
                  </button>
                  
                  <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700">
                    Return to OBC Cell
                  </button>
                  
                  <button className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                    Reject Claim
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Guidelines</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Review all medical bills for authenticity</li>
                    <li>• Apply standard government rates</li>
                    <li>• Check ward entitlement compatibility</li>
                    <li>• Verify treatment necessity</li>
                  </ul>
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
              <h1 className="text-2xl font-semibold text-blue-800">Health Centre Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome, {user?.name} | Medical Claims Review
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Heart className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm text-blue-600">Pending Review</p>
                  <p className="text-xl font-semibold text-blue-800">{claims.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <Heart className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm text-green-600">Approved Today</p>
                  <p className="text-xl font-semibold text-green-800">0</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <Heart className="w-8 h-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-600">Total Amount</p>
                  <p className="text-xl font-semibold text-yellow-800">
                    ₹ {claims.reduce((total, claim) => total + claim.totalAmount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Claims Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tracking ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Patient</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {claims.map((claim, index) => (
                  <tr key={claim.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm font-mono">{claim.id}</td>
                    <td className="px-4 py-3 text-sm">{claim.employeeName}</td>
                    <td className="px-4 py-3 text-sm">
                      {claim.patientName}
                      <br />
                      <span className="text-xs text-gray-500">({claim.relationship})</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">₹ {claim.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Medical Review
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewClaim(claim)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 mx-auto"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span className="text-sm">Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {claims.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No claims pending for medical review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthCentreDashboard;