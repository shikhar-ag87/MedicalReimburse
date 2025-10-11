import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    BarChart3,
    Download,
    FileText,
    TrendingUp,
    Calendar,
    LogOut,
    Eye,
} from "lucide-react";
import { adminService } from "../services/admin";
import type { DashboardStats, AdminApplication } from "../services/admin";
import ComprehensiveReviewModal from "../components/review/ComprehensiveReviewModal";

const SuperAdminDashboard = () => {
    const { user, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState("monthly");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedApplication, setSelectedApplication] = useState<AdminApplication | null>(null);
    const [pendingApprovals, setPendingApprovals] = useState<AdminApplication[]>([]);
    const [allApplications, setAllApplications] = useState<AdminApplication[]>([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        // Wait for auth to load
        if (authLoading) return;

        if (
            !user ||
            (user.role !== "super-admin" && user.role !== "super_admin")
        ) {
            navigate("/admin/login");
            return;
        }

        fetchDashboardStats();
    }, [user, navigate, authLoading]);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const dashboardStats = await adminService.getDashboardStats();
            setStats(dashboardStats);
            
            // Fetch applications awaiting final approval (status: approved by OBC)
            const pendingResult = await adminService.getAllApplications({
                status: "approved", // Applications approved by OBC, awaiting Super Admin
                limit: 20,
            });
            setPendingApprovals(pendingResult.applications);
            
            // Fetch ALL applications for comprehensive view
            const allResult = await adminService.getAllApplications({
                limit: 100, // Get more applications
            });
            setAllApplications(allResult.applications);
        } catch (error: any) {
            setError(error.message || "Failed to fetch dashboard statistics");
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewApplication = (app: AdminApplication) => {
        setSelectedApplication(app);
        setShowReviewModal(true);
    };

    const generateReport = (format: "excel" | "pdf") => {
        // Mock report generation
        alert(
            `${format.toUpperCase()} report will be downloaded. This feature would integrate with actual data export in production.`
        );
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchDashboardStats}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex items-center justify-center h-64">
                No data available
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-blue-800">
                                Super Admin Dashboard
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Welcome, {user?.name} | Medical Reimbursement
                                Analytics & Reports
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                logout();
                                navigate("/admin/login");
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
                                    <p className="text-sm text-blue-600">
                                        Total Claims
                                    </p>
                                    <p className="text-2xl font-bold text-blue-800">
                                        {stats.applications.total}
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        This fiscal year
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <div className="flex items-center">
                                <TrendingUp className="w-8 h-8 text-green-600" />
                                <div className="ml-4">
                                    <p className="text-sm text-green-600">
                                        Approved Claims
                                    </p>
                                    <p className="text-2xl font-bold text-green-800">
                                        {stats.applications.approved}
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">
                                        {(
                                            (stats.applications.approved /
                                                stats.applications.total) *
                                            100
                                        ).toFixed(1)}
                                        % approval rate
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                            <div className="flex items-center">
                                <BarChart3 className="w-8 h-8 text-purple-600" />
                                <div className="ml-4">
                                    <p className="text-sm text-purple-600">
                                        Pending Review
                                    </p>
                                    <p className="text-2xl font-bold text-purple-800">
                                        {stats.applications.pending}
                                    </p>
                                    <p className="text-xs text-purple-600 mt-1">
                                        Awaiting action
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                            <div className="flex items-center">
                                <Calendar className="w-8 h-8 text-yellow-600" />
                                <div className="ml-4">
                                    <p className="text-sm text-yellow-600">
                                        Under Review
                                    </p>
                                    <p className="text-2xl font-bold text-yellow-800">
                                        {stats.applications.underReviewCount}
                                    </p>
                                    <p className="text-xs text-yellow-600 mt-1">
                                        Being processed
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reports Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Monthly Trends */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Monthly Trends
                                </h3>
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) =>
                                        setSelectedPeriod(e.target.value)
                                    }
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                {stats.applications.recentApplications
                                    .slice(0, 5)
                                    .map((app) => (
                                        <div
                                            key={app.id}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-xs font-medium text-blue-800">
                                                    {app.applicationNumber.slice(
                                                        -4
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {app.employeeName}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        ₹{" "}
                                                        {app.totalAmountClaimed.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-xs">
                                                <span
                                                    className={`px-2 py-1 rounded-full ${
                                                        app.status === "approved"
                                                            ? "bg-green-100 text-green-800"
                                                            : app.status === "pending"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : app.status === "under_review"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : app.status === "back_to_obc"
                                                            ? "bg-orange-100 text-orange-800"
                                                            : app.status === "reimbursed"
                                                            ? "bg-purple-100 text-purple-800"
                                                            : app.status === "rejected"
                                                            ? "bg-red-100 text-red-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}
                                                >
                                                    {app.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Recent Users */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Recent Users
                            </h3>
                            <div className="space-y-3">
                                {stats.users.recentUsers
                                    .slice(0, 5)
                                    .map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {user.role}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-600">
                                                    {user.email}
                                                </p>
                                                <span
                                                    className={`inline-block w-2 h-2 rounded-full ${
                                                        user.isActive
                                                            ? "bg-green-500"
                                                            : "bg-gray-400"
                                                    }`}
                                                ></span>
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Current Status
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        Pending OBC Review
                                    </span>
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                        {stats.applications.pendingCount || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        Health Centre Review
                                    </span>
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                        {stats.applications.underReviewCount || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        Final Approval
                                    </span>
                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                        {stats.applications.approved || 0}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                System Summary
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">
                                        Total Users:
                                    </span>
                                    <span className="text-sm font-semibold">
                                        {stats.users.total}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">
                                        Admins:
                                    </span>
                                    <span className="text-sm font-semibold text-green-600">
                                        {stats.users.admins}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">
                                        Employees:
                                    </span>
                                    <span className="text-sm font-semibold text-blue-600">
                                        {stats.users.employees}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t border-gray-300 pt-2">
                                    <span className="text-sm text-gray-600">
                                        Server Uptime:
                                    </span>
                                    <span className="text-sm font-semibold">
                                        {Math.floor(
                                            stats.system.serverUptime / 3600
                                        )}
                                        h
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Report Generation */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Generate Reports
                            </h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => generateReport("excel")}
                                    className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Excel Report</span>
                                </button>
                                <button
                                    onClick={() => generateReport("pdf")}
                                    className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>PDF Report</span>
                                </button>
                                <div className="text-xs text-gray-600 text-center mt-2">
                                    Reports include all claims data, financial
                                    summaries, and processing metrics
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Final Approvals Section */}
                    {pendingApprovals.length > 0 && (
                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Pending Final Approval
                                </h2>
                                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                                    {pendingApprovals.length} applications
                                </span>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Application
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Employee
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {pendingApprovals.map((app) => (
                                            <tr key={app.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {app.applicationNumber}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(app.submittedAt).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {app.employeeName}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        ₹{app.totalAmountClaimed.toLocaleString()}
                                                    </div>
                                                    {app.totalAmountPassed > 0 && (
                                                        <div className="text-xs text-green-600">
                                                            Approved: ₹{app.totalAmountPassed.toLocaleString()}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                                        {app.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() => handleViewApplication(app)}
                                                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        <span>Review</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* All Applications Section */}
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                                All Applications
                            </h2>
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-600">
                                    Filter by status:
                                </span>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="under_review">Under Review</option>
                                    <option value="back_to_obc">Back to OBC</option>
                                    <option value="approved">Approved</option>
                                    <option value="reimbursed">Reimbursed</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                    {filterStatus === "all" 
                                        ? `${allApplications.length} total`
                                        : `${allApplications.filter(a => a.status === filterStatus).length} ${filterStatus}`
                                    }
                                </span>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Application
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Employee
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Submitted
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {(filterStatus === "all" 
                                            ? allApplications 
                                            : allApplications.filter(a => a.status === filterStatus)
                                        ).map((app) => (
                                            <tr key={app.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {app.applicationNumber}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ID: {app.id.slice(0, 8)}...
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {app.employeeName}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ID: {app.employeeId}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        ₹{app.totalAmountClaimed.toLocaleString()}
                                                    </div>
                                                    {app.totalAmountPassed > 0 && (
                                                        <div className="text-xs text-green-600 font-medium">
                                                            ✓ ₹{app.totalAmountPassed.toLocaleString()}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        app.status === "pending"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : app.status === "under_review"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : app.status === "back_to_obc"
                                                            ? "bg-orange-100 text-orange-800"
                                                            : app.status === "approved"
                                                            ? "bg-green-100 text-green-800"
                                                            : app.status === "reimbursed"
                                                            ? "bg-purple-100 text-purple-800"
                                                            : app.status === "rejected"
                                                            ? "bg-red-100 text-red-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}>
                                                        {app.status.replace(/_/g, " ")}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(app.submittedAt).toLocaleDateString("en-IN", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric"
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() => handleViewApplication(app)}
                                                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        <span>View</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Empty State */}
                            {((filterStatus === "all" ? allApplications : allApplications.filter(a => a.status === filterStatus)).length === 0) && (
                                <div className="text-center py-12">
                                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600">
                                        {filterStatus === "all" 
                                            ? "No applications found"
                                            : `No applications with status "${filterStatus}"`
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            {showReviewModal && selectedApplication && (
                <ComprehensiveReviewModal
                    application={selectedApplication}
                    isOpen={showReviewModal}
                    onClose={() => {
                        setShowReviewModal(false);
                        setSelectedApplication(null);
                    }}
                    onReviewComplete={() => {
                        setShowReviewModal(false);
                        setSelectedApplication(null);
                        fetchDashboardStats(); // Refresh data
                    }}
                />
            )}
        </div>
    );
};

export default SuperAdminDashboard;
