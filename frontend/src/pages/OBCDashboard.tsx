import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    FileText,
    Filter,
    Eye,
    Send,
    ArrowLeft,
    LogOut,
    ClipboardCheck,
} from "lucide-react";
import { adminService } from "../services/admin";
import type { AdminApplication } from "../services/admin";
import { apiService } from "../services/api";
import ComprehensiveReviewModal from "../components/review/ComprehensiveReviewModal";

const OBCDashboard = () => {
    const { user, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [claims, setClaims] = useState<AdminApplication[]>([]);
    const [selectedClaim, setSelectedClaim] = useState<any>(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewingClaim, setReviewingClaim] = useState<any>(null);

    useEffect(() => {
        // Wait for auth to load
        if (authLoading) return;

        if (!user || (user.role !== "obc" && user.role !== "admin")) {
            navigate("/admin/login");
            return;
        }

        fetchApplications();
    }, [user, navigate, authLoading]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminService.getAllApplications({
                status: filterStatus === "all" ? undefined : filterStatus,
                sortBy: "submittedAt",
                sortOrder: "desc",
            });
            setClaims(response.applications);
            
        } catch (error: any) {
            setError(error.message || "Failed to fetch applications");
            console.error("Error fetching applications:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: "bg-yellow-100 text-yellow-800",
            under_review: "bg-blue-100 text-blue-800",
            back_to_obc: "bg-orange-100 text-orange-800",
            approved: "bg-green-100 text-green-800",
            rejected: "bg-red-100 text-red-800",
            completed: "bg-green-100 text-green-800",
            reimbursed: "bg-purple-100 text-purple-800",
        };
        return (
            badges[status as keyof typeof badges] || "bg-gray-100 text-gray-800"
        );
    };

    const getReviewStatusBadge = (claim: AdminApplication) => {
        const totalReviews = claim.reviewSummary?.totalReviews || 0;
        const lastDecision = claim.reviewSummary?.lastDecision;

        if (totalReviews === 0) {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                    Pending Review
                </span>
            );
        }
        
        if (claim.status === "pending") {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                    ✓ Reviewed • Awaiting Forwarding
                </span>
            );
        }

        if (claim.status === "under_review") {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                    ✓ Reviewed • At Health Centre
                </span>
            );
        }
        
        if (claim.status === "back_to_obc") {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                    ✓ Returned from Health Centre • Needs Final Review
                </span>
            );
        }
        
        if (claim.status === "approved") {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    ✓ Health Centre Approved
                </span>
            );
        }
        
        if (claim.status === "rejected") {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                    Rejected
                </span>
            );
        }
        
        if (claim.status === "completed") {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    ✓ Completed
                </span>
            );
        }
        
        if (claim.status === "reimbursed") {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                    ✓ Reimbursed
                </span>
            );
        }
        
        return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                {lastDecision ? `Reviewed (${lastDecision})` : claim.status}
            </span>
        );
    };

    const handleViewClaim = async (claim: any) => {
        try {
            setLoading(true);
            setError(null);
            // Fetch real application details with expenses and documents
            const resp = await apiService.get<any>(`/applications/${claim.id}`);
            if (!resp.success || !resp.data) {
                throw new Error(resp.message || "Failed to load claim details");
            }
            const { application, expenses, documents } = resp.data;
            setSelectedClaim({ 
                ...application, 
                expenses: expenses || [], 
                documents: documents || [] 
            });
        } catch (e: any) {
            console.error("Error loading claim details:", e);
            setError(e.message || "Failed to load claim details");
        } finally {
            setLoading(false);
        }
    };

    const handleForwardToClaim = async (claimId: string) => {
        try {
            const claim = claims.find(c => c.id === claimId);
            const isBackFromHealthCentre = claim?.status === "back_to_obc";
            
            await adminService.updateApplicationStatus(
                claimId,
                isBackFromHealthCentre ? "approved" : "under_review",
                isBackFromHealthCentre 
                    ? "Final review completed by OBC Cell - Forwarded to Super Admin"
                    : "Forwarded by OBC Cell to Health Centre"
            );
            // Refresh the applications list
            await fetchApplications();
            setSelectedClaim(null);
            alert(isBackFromHealthCentre 
                ? "Claim forwarded to Super Admin successfully!"
                : "Claim forwarded to Health Centre successfully!");
        } catch (error: any) {
            alert("Failed to forward claim: " + error.message);
        }
    };

    const handleStartReview = (claim: any) => {
        setReviewingClaim(claim);
        setShowReviewModal(true);
    };

    const handleReviewComplete = () => {
        // Don't reload - let the status update persist without fetching
        setShowReviewModal(false);
        setReviewingClaim(null);
    };

    const filteredClaims = claims.filter(
        (claim) => filterStatus === "all" || claim.status === filterStatus
    );

    if (selectedClaim) {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold text-blue-800">
                                    Claim Review
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Tracking ID: {selectedClaim.id}
                                </p>
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
                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Employee Details
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">
                                                Name:
                                            </span>
                                            <p className="font-medium">
                                                {selectedClaim.employeeName}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">
                                                Employee ID:
                                            </span>
                                            <p className="font-medium">
                                                {selectedClaim.employeeId}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">
                                                Department:
                                            </span>
                                            <p className="font-medium">
                                                {selectedClaim.department}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">
                                                CGHS Card:
                                            </span>
                                            <p className="font-medium">
                                                {selectedClaim.cghsCardNumber}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Patient Details */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Patient Details
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">
                                                Patient Name:
                                            </span>
                                            <p className="font-medium">
                                                {selectedClaim.patientName}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">
                                                Relationship:
                                            </span>
                                            <p className="font-medium">
                                                {selectedClaim.relationshipWithEmployee}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Treatment Details */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Treatment Details
                                    </h3>
                                    <div className="text-sm">
                                        <div className="mb-2">
                                            <span className="text-gray-600">
                                                Hospital:
                                            </span>
                                            <p className="font-medium">
                                                {selectedClaim.hospitalName}
                                            </p>
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-gray-600">
                                                Hospital Address:
                                            </span>
                                            <p className="font-medium">
                                                {selectedClaim.hospitalAddress}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-gray-600">
                                                    Prior Permission:
                                                </span>
                                                <p className="font-medium">
                                                    {selectedClaim.priorPermission ? "Yes" : "No"}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">
                                                    Emergency:
                                                </span>
                                                <p className="font-medium">
                                                    {selectedClaim.emergencyTreatment ? "Yes" : "No"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expenses */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Expense Breakdown
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-white">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                                                        Bill No.
                                                    </th>
                                                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                                                        Date
                                                    </th>
                                                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                                                        Description
                                                    </th>
                                                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                                                        Category
                                                    </th>
                                                    <th className="px-3 py-2 text-right font-medium text-gray-700">
                                                        Amount
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {selectedClaim.expenses?.map(
                                                    (expense: any) => (
                                                        <tr key={expense.id}>
                                                            <td className="px-3 py-2">
                                                                {expense.billNumber}
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                {expense.billDate ? new Date(expense.billDate).toLocaleDateString("en-IN") : "-"}
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                {expense.description}
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                -
                                                            </td>
                                                            <td className="px-3 py-2 text-right font-medium">
                                                                ₹ {expense.amountClaimed}
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                            <tfoot className="bg-white">
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="px-3 py-2 font-medium text-right"
                                                    >
                                                        Total:
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-bold text-blue-600">
                                                        ₹ {selectedClaim.expenses?.reduce(
                                                            (total: number, expense: any) =>
                                                                total + (expense.amountClaimed || 0),
                                                            0
                                                        )}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Supporting Documents Section */}
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h3 className="font-semibold text-gray-900 mb-4">
                                        Supporting Documents
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedClaim.documents && selectedClaim.documents.length > 0 ? (
                                            selectedClaim.documents.map((doc: any, index: number) => (
                                                <div
                                                    key={doc.id || index}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <FileText className="w-5 h-5 text-blue-600" />
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {doc.fileName || doc.file_name || `Document ${index + 1}`}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {doc.fileType || doc.file_type || 'Unknown type'} • 
                                                                {doc.fileSize ? ` ${(doc.fileSize / 1024).toFixed(2)} KB` : 
                                                                 doc.file_size ? ` ${(doc.file_size / 1024).toFixed(2)} KB` : ' Size unknown'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={doc.filePath || doc.file_path}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                    >
                                                        View
                                                    </a>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 text-center py-4">
                                                No documents uploaded
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions Panel */}
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-800 mb-3">
                                        Review Actions
                                    </h4>

                                    <div className="space-y-3">
                                        <textarea
                                            placeholder="Add review comments..."
                                            rows={4}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />

                                        <button
                                            onClick={() =>
                                                handleForwardToClaim(
                                                    selectedClaim.id
                                                )
                                            }
                                            className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                                        >
                                            <Send className="w-4 h-4" />
                                            <span>
                                                {selectedClaim.status === "back_to_obc" 
                                                    ? "Forward to Super Admin"
                                                    : "Forward to Health Centre"}
                                            </span>
                                        </button>

                                        <button className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                                            Return for Corrections
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-800 mb-2">
                                        Timeline
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">
                                                Submitted:
                                            </span>
                                            <span>
                                                {selectedClaim.submittedAt ? new Date(selectedClaim.submittedAt).toLocaleDateString("en-IN") : "-"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">
                                                Current Status:
                                            </span>
                                            <span className="font-medium">
                                                {selectedClaim.status ? selectedClaim.status.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "-"}
                                            </span>
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
                            <h1 className="text-2xl font-semibold text-blue-800">
                                OBC/SC/ST Cell Dashboard
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Welcome, {user?.name} | Medical Claims
                                Management
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
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-700">{error}</p>
                            <button
                                onClick={fetchApplications}
                                className="mt-2 text-red-600 hover:text-red-800 underline"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">
                                Loading applications...
                            </span>
                        </div>
                    ) : (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <FileText className="w-8 h-8 text-yellow-600" />
                                        <div className="ml-3">
                                            <p className="text-sm text-yellow-600">
                                                Pending Review
                                            </p>
                                            <p className="text-xl font-semibold text-yellow-800">
                                                {
                                                    claims.filter(
                                                        (c) =>
                                                            c.status ===
                                                            "pending"
                                                    ).length
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <FileText className="w-8 h-8 text-green-600" />
                                        <div className="ml-3">
                                            <p className="text-sm text-green-600">
                                                Under Review
                                            </p>
                                            <p className="text-xl font-semibold text-green-800">
                                                {
                                                    claims.filter(
                                                        (c) =>
                                                            c.status ===
                                                            "under_review"
                                                    ).length
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <FileText className="w-8 h-8 text-blue-600" />
                                        <div className="ml-3">
                                            <p className="text-sm text-blue-600">
                                                Total Claims
                                            </p>
                                            <p className="text-xl font-semibold text-blue-800">
                                                {claims.length}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <FileText className="w-8 h-8 text-gray-600" />
                                        <div className="ml-3">
                                            <p className="text-sm text-gray-600">
                                                This Month
                                            </p>
                                            <p className="text-xl font-semibold text-gray-800">
                                                {claims.length}
                                            </p>
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
                                        onChange={(e) => {
                                            setFilterStatus(e.target.value);
                                            fetchApplications();
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">All Claims</option>
                                        <option value="pending">
                                            Pending Review
                                        </option>
                                        <option value="under_review">
                                            Under Review
                                        </option>
                                        <option value="back_to_obc">
                                            Returned from Health Centre
                                        </option>
                                        <option value="approved">
                                            Approved
                                        </option>
                                        <option value="rejected">
                                            Rejected
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {/* Claims Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full border border-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                                Application Number
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                                Employee Name
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                                Patient Name
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                                Amount Claimed
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                                Submitted Date
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                                Review Status
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredClaims.map((claim, index) => (
                                            <tr
                                                key={claim.id}
                                                className={
                                                    index % 2 === 0
                                                        ? "bg-white"
                                                        : "bg-gray-50"
                                                }
                                            >
                                                <td className="px-4 py-3 text-sm font-mono">
                                                    {claim.applicationNumber}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {claim.employeeName}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {claim.patientName}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium">
                                                    ₹{" "}
                                                    {claim.totalAmountClaimed.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {new Date(
                                                        claim.submittedAt
                                                    ).toLocaleDateString(
                                                        "en-IN"
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                                                            claim.status
                                                        )}`}
                                                    >
                                                        {claim.status
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            claim.status.slice(
                                                                1
                                                            )}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getReviewStatusBadge(claim)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <button
                                                            onClick={() =>
                                                                handleViewClaim(
                                                                    claim
                                                                )
                                                            }
                                                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                                                            title="Quick View"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            <span className="text-sm">
                                                                View
                                                            </span>
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleStartReview(
                                                                    claim
                                                                )
                                                            }
                                                            className="flex items-center space-x-1 text-green-600 hover:text-green-800"
                                                            title="Comprehensive Review"
                                                        >
                                                            <ClipboardCheck className="w-4 h-4" />
                                                            <span className="text-sm">
                                                                Review
                                                            </span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Comprehensive Review Modal */}
            {showReviewModal && reviewingClaim && (
                <ComprehensiveReviewModal
                    application={reviewingClaim}
                    isOpen={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    onReviewComplete={handleReviewComplete}
                />
            )}
        </div>
    );
};

export default OBCDashboard;
