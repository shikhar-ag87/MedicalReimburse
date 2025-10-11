import React, { useState } from "react";
import {
    Search,
    Clock,
    CheckCircle,
    AlertCircle,
    FileText,
} from "lucide-react";
import { applicationService } from "../services/applications";
import type { ApplicationDetails } from "../services/applications";

const StatusTracker = () => {
    const [trackingId, setTrackingId] = useState("");
    const [claimStatus, setClaimStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Map database status to timeline stages
    const getTimelineFromStatus = (application: ApplicationDetails) => {
        const baseTimeline = [
            {
                stage: "submitted",
                title: "Claim Submitted",
                description: "Application submitted successfully",
                date: new Date(application.submittedAt).toLocaleDateString("en-IN"),
                completed: true,
                icon: "check"
            },
            {
                stage: "obc_review",
                title: "OBC Cell Initial Review",
                description: "Under review by OBC/SC/ST Cell",
                date: null,
                completed: false,
                current: false,
                icon: "pending"
            },
            {
                stage: "health_centre_review",
                title: "Health Centre Medical Review",
                description: "Medical assessment by Health Centre",
                date: null,
                completed: false,
                current: false,
                icon: "pending"
            },
            {
                stage: "obc_final_review",
                title: "OBC Cell Final Review",
                description: "Final verification by OBC Cell",
                date: null,
                completed: false,
                current: false,
                icon: "pending"
            },
            {
                stage: "admin_approval",
                title: "Super Admin Final Approval",
                description: "Final authorization for payment",
                date: null,
                completed: false,
                current: false,
                icon: "pending"
            },
            {
                stage: "reimbursed",
                title: "Payment Processed",
                description: "Reimbursement completed",
                date: null,
                completed: false,
                current: false,
                icon: "pending"
            },
        ];

        // Update timeline based on actual status
        const updateDate = new Date(application.updatedAt).toLocaleDateString("en-IN");
        
        switch (application.status) {
            case "pending":
                // Just submitted, waiting for OBC review
                baseTimeline[1].current = true;
                break;
                
            case "under_review":
                // At Health Centre
                baseTimeline[1].completed = true;
                baseTimeline[1].date = updateDate;
                baseTimeline[2].current = true;
                break;
                
            case "back_to_obc":
                // Returned to OBC for final review
                baseTimeline[1].completed = true;
                baseTimeline[2].completed = true;
                baseTimeline[2].date = updateDate;
                baseTimeline[3].current = true;
                break;
                
            case "approved":
                // Approved by OBC, waiting for Super Admin
                baseTimeline[1].completed = true;
                baseTimeline[2].completed = true;
                baseTimeline[3].completed = true;
                baseTimeline[3].date = updateDate;
                baseTimeline[4].current = true;
                break;
                
            case "reimbursed":
                // Fully completed
                baseTimeline.forEach((stage, index) => {
                    stage.completed = true;
                    if (index === baseTimeline.length - 1) {
                        stage.date = updateDate;
                    }
                });
                break;
                
            case "rejected":
                // Find which stage it was rejected at
                if (application.updatedAt) {
                    baseTimeline[1].completed = true;
                    baseTimeline[1].date = updateDate;
                }
                break;
                
            case "completed":
                // Legacy status - treat as reimbursed
                baseTimeline.forEach((stage, index) => {
                    stage.completed = true;
                    if (index === baseTimeline.length - 1) {
                        stage.date = updateDate;
                    }
                });
                break;
        }

        return baseTimeline;
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingId.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // Fetch real application data from database
            const application = await applicationService.getApplicationByNumber(
                trackingId.trim()
            );

            const statusData = {
                trackingId: application.applicationNumber,
                employeeName: application.employeeName,
                department: application.department,
                submissionDate: new Date(
                    application.submittedAt
                ).toLocaleDateString("en-IN"),
                totalAmount: application.totalAmountClaimed,
                amountPassed: application.totalAmountPassed,
                currentStatus: application.status,
                timeline: getTimelineFromStatus(application),
                remarks: application.reviewComments || "No remarks available.",
                patientName: application.patientName,
                hospitalName: application.hospitalName,
                treatmentType: application.treatmentType,
            };

            setClaimStatus(statusData);
        } catch (error: any) {
            setError(
                error.message ||
                    "Application not found. Please check your tracking ID and try again."
            );
            setClaimStatus(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                    <h1 className="text-2xl font-semibold text-blue-800">
                        Track Claim Status
                    </h1>
                    <p className="text-gray-600 mt-1">
                        दावे की स्थिति ट्रैक करें / Track Your Medical
                        Reimbursement Claim Status
                    </p>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-8">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter Application Number / आवेदन संख्या दर्ज
                                    करें
                                </label>
                                <input
                                    type="text"
                                    value={trackingId}
                                    onChange={(e) =>
                                        setTrackingId(e.target.value)
                                    }
                                    placeholder="e.g., APP-2024-001234"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <Search className="w-4 h-4" />
                                    <span>
                                        {loading
                                            ? "Searching..."
                                            : "Track Status"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </form>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                                <p className="text-red-700 font-medium">
                                    Error
                                </p>
                            </div>
                            <p className="text-red-600 text-sm mt-1">{error}</p>
                        </div>
                    )}

                    {claimStatus && (
                        <div className="space-y-6">
                            {/* Current Status Banner */}
                            <div className={`rounded-lg p-6 border-2 ${
                                claimStatus.currentStatus === "reimbursed" 
                                    ? "bg-purple-50 border-purple-300"
                                    : claimStatus.currentStatus === "rejected"
                                    ? "bg-red-50 border-red-300"
                                    : claimStatus.currentStatus === "approved"
                                    ? "bg-green-50 border-green-300"
                                    : "bg-blue-50 border-blue-300"
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                            Current Status / वर्तमान स्थिति
                                        </h3>
                                        <p className={`text-2xl font-bold ${
                                            claimStatus.currentStatus === "reimbursed"
                                                ? "text-purple-700"
                                                : claimStatus.currentStatus === "rejected"
                                                ? "text-red-700"
                                                : claimStatus.currentStatus === "approved"
                                                ? "text-green-700"
                                                : "text-blue-700"
                                        }`}>
                                            {claimStatus.currentStatus === "pending" && "⏳ Pending - Awaiting OBC Review"}
                                            {claimStatus.currentStatus === "under_review" && "🔍 Under Review - Health Centre"}
                                            {claimStatus.currentStatus === "back_to_obc" && "🔄 Final Review - OBC Cell"}
                                            {claimStatus.currentStatus === "approved" && "✅ Approved - Awaiting Final Authorization"}
                                            {claimStatus.currentStatus === "reimbursed" && "🎉 Reimbursed - Payment Completed"}
                                            {claimStatus.currentStatus === "rejected" && "❌ Rejected"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Application Number</p>
                                        <p className="font-mono font-bold text-xl text-gray-900">
                                            {claimStatus.trackingId}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Claim Summary */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Employee Name
                                        </p>
                                        <p className="font-semibold">
                                            {claimStatus.employeeName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Department
                                        </p>
                                        <p className="font-semibold">
                                            {claimStatus.department}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Submitted On
                                        </p>
                                        <p className="font-semibold">
                                            {claimStatus.submissionDate}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Total Amount Claimed
                                        </p>
                                        <p className="font-semibold">
                                            ₹{" "}
                                            {claimStatus.totalAmount.toLocaleString()}
                                        </p>
                                        {claimStatus.amountPassed > 0 &&
                                            claimStatus.amountPassed !==
                                                claimStatus.totalAmount && (
                                                <p className="text-sm text-green-600">
                                                    Amount Passed: ₹{" "}
                                                    {claimStatus.amountPassed.toLocaleString()}
                                                </p>
                                            )}
                                    </div>
                                </div>
                                {claimStatus.patientName && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600">
                                                    Patient Name
                                                </p>
                                                <p className="font-semibold">
                                                    {claimStatus.patientName}
                                                </p>
                                            </div>
                                            {claimStatus.hospitalName && (
                                                <div>
                                                    <p className="text-sm text-gray-600">
                                                        Hospital
                                                    </p>
                                                    <p className="font-semibold">
                                                        {
                                                            claimStatus.hospitalName
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                            {claimStatus.treatmentType && (
                                                <div>
                                                    <p className="text-sm text-gray-600">
                                                        Treatment Type
                                                    </p>
                                                    <p className="font-semibold capitalize">
                                                        {claimStatus.treatmentType.replace(
                                                            "_",
                                                            " "
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Status Timeline */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <Clock className="w-5 h-5 mr-2" />
                                    Processing Timeline / प्रक्रिया समयरेखा
                                </h3>
                                <div className="relative">
                                    {/* Vertical Line */}
                                    <div className="absolute left-[10px] top-2 bottom-2 w-0.5 bg-gray-300"></div>
                                    
                                    <div className="space-y-6">
                                        {claimStatus.timeline.map((stage: any) => (
                                            <div
                                                key={stage.stage}
                                                className="relative flex items-start space-x-4"
                                            >
                                                {/* Icon Circle */}
                                                <div className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                                    stage.completed
                                                        ? "bg-green-500 border-green-500"
                                                        : stage.current
                                                        ? "bg-blue-500 border-blue-500 animate-pulse"
                                                        : "bg-white border-gray-300"
                                                }`}>
                                                    {stage.completed && (
                                                        <CheckCircle className="w-4 h-4 text-white" />
                                                    )}
                                                    {stage.current && (
                                                        <Clock className="w-4 h-4 text-white" />
                                                    )}
                                                </div>
                                                
                                                {/* Content */}
                                                <div className={`flex-1 pb-6 ${
                                                    stage.current ? "bg-blue-50 -ml-2 -mt-2 p-4 rounded-lg border-2 border-blue-300" : ""
                                                }`}>
                                                    <div className="flex items-center justify-between">
                                                        <h4 className={`font-semibold text-base ${
                                                            stage.completed
                                                                ? "text-green-700"
                                                                : stage.current
                                                                ? "text-blue-700"
                                                                : "text-gray-500"
                                                        }`}>
                                                            {stage.title}
                                                        </h4>
                                                        {stage.date && (
                                                            <span className="text-sm text-gray-600 font-medium">
                                                                📅 {stage.date}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-sm mt-1 ${
                                                        stage.current ? "text-blue-600" : "text-gray-600"
                                                    }`}>
                                                        {stage.description}
                                                    </p>
                                                    {stage.current && (
                                                        <p className="text-xs text-blue-700 mt-2 font-medium">
                                                            ⏱️ Currently at this stage
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Remarks */}
                            {claimStatus.remarks && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-800 flex items-center mb-2">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Latest Update / नवीनतम अपडेट
                                    </h4>
                                    <p className="text-blue-700 text-sm">
                                        {claimStatus.remarks}
                                    </p>
                                </div>
                            )}

                            {/* Contact Information */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h4 className="font-medium text-yellow-800 mb-2">
                                    Need Help? / सहायता चाहिए?
                                </h4>
                                <p className="text-yellow-700 text-sm">
                                    For any queries regarding your claim, please
                                    contact:
                                    <br />
                                    OBC/SC/ST Cell: obcell@jnu.ac.in | Health
                                    Centre: healthcentre@jnu.ac.in
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatusTracker;
