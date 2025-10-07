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
} from "lucide-react";
import { adminService } from "../services/admin";
import type { DashboardStats } from "../services/admin";

const SuperAdminDashboard = () => {
    const { user, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState("monthly");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        } catch (error: any) {
            setError(error.message || "Failed to fetch dashboard statistics");
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoading(false);
        }
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
                                                        app.status ===
                                                        "approved"
                                                            ? "bg-green-100 text-green-800"
                                                            : app.status ===
                                                              "pending"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-blue-100 text-blue-800"
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
                                        5
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        Health Centre Review
                                    </span>
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                        3
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        Final Approval
                                    </span>
                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                        2
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
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
