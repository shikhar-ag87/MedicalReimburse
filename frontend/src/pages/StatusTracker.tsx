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
                description: "Claim form submitted by employee",
                date: new Date(application.submittedAt).toLocaleDateString(
                    "en-IN"
                ),
                completed: true,
            },
            {
                stage: "obc_review",
                title: "OBC Cell Review",
                description: "Under review by OBC/SC/ST Cell",
                date: null,
                completed: false,
            },
            {
                stage: "health_centre_review",
                title: "Health Centre Review",
                description: "Forwarded to Health Centre for medical review",
                date: null,
                completed: false,
            },
            {
                stage: "admin_approval",
                title: "Final Approval",
                description: "Final approval by Administration",
                date: null,
                completed: false,
            },
        ];

        // Update timeline based on actual status
        switch (application.status) {
            case "pending":
                // Just submitted
                break;
            case "under_review":
                baseTimeline[1].completed = true;
                baseTimeline[1].date = new Date(
                    application.updatedAt
                ).toLocaleDateString("en-IN");
                baseTimeline[2].completed = false;
                (baseTimeline[2] as any).current = true;
                break;
            case "approved":
                baseTimeline[1].completed = true;
                baseTimeline[2].completed = true;
                baseTimeline[3].completed = true;
                baseTimeline[3].date = new Date(
                    application.updatedAt
                ).toLocaleDateString("en-IN");
                break;
            case "rejected":
                baseTimeline[1].completed = true;
                baseTimeline[1].date = new Date(
                    application.updatedAt
                ).toLocaleDateString("en-IN");
                break;
            case "completed":
                baseTimeline.forEach((stage, index) => {
                    stage.completed = true;
                    if (index === baseTimeline.length - 1) {
                        stage.date = new Date(
                            application.updatedAt
                        ).toLocaleDateString("en-IN");
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

    const getStatusIcon = (stage: any) => {
        if (stage.completed)
            return <CheckCircle className="w-5 h-5 text-green-600" />;
        if (stage.current) return <Clock className="w-5 h-5 text-blue-600" />;
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    };

    const getStatusColor = (stage: any) => {
        if (stage.completed) return "text-green-600";
        if (stage.current) return "text-blue-600";
        return "text-gray-400";
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
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Processing Timeline
                                </h3>
                                <div className="space-y-4">
                                    {claimStatus.timeline.map((stage: any) => (
                                        <div
                                            key={stage.stage}
                                            className="flex items-start space-x-4"
                                        >
                                            <div className="flex-shrink-0">
                                                {getStatusIcon(stage)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4
                                                        className={`font-medium ${getStatusColor(
                                                            stage
                                                        )}`}
                                                    >
                                                        {stage.title}
                                                    </h4>
                                                    {stage.date && (
                                                        <span className="text-sm text-gray-500">
                                                            {stage.date}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {stage.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
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
