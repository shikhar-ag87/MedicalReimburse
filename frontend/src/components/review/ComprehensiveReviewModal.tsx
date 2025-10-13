import { useState, useEffect } from "react";
import {
    X,
    FileText,
    CheckSquare,
    MessageSquare,
    Clock,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
import EligibilityCheckForm, {
    EligibilityCheckData,
} from "./EligibilityCheckForm";
import DocumentReviewPanel, { DocumentReviewData } from "./DocumentReviewPanel";
import CommentThread from "./CommentThread";
import { reviewService } from "../../services/reviews";
import { adminService } from "../../services/admin";
import { useAuth } from "../../contexts/AuthContext";

interface ComprehensiveReviewModalProps {
    application: any;
    isOpen: boolean;
    onClose: () => void;
    onReviewComplete: () => void;
}

type ReviewTab = "eligibility" | "documents" | "comments" | "timeline";

const ComprehensiveReviewModal: React.FC<ComprehensiveReviewModalProps> = ({
    application,
    isOpen,
    onClose,
    onReviewComplete,
}) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<ReviewTab>("eligibility");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [reviewData, setReviewData] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [documentReviews, setDocumentReviews] = useState<Record<string, any>>(
        {}
    );
    
    // Track completion status of each review step
    const [completedSteps, setCompletedSteps] = useState({
        eligibility: false,
        documents: false,
        comments: false,
    });

    // Determine review stage based on status and user role
    const getReviewStage = () => {
        const status = application?.status;
        const role = user?.role;

        if (status === "pending" && (role === "obc" || role === "admin")) {
            return "initial_obc"; // OBC first review
        } else if (status === "under_review" && (role === "health-centre" || role === "medical_officer")) {
            return "health_centre"; // Health Centre review
        } else if (status === "back_to_obc" && (role === "obc" || role === "admin")) {
            return "final_obc"; // OBC final review after Health Centre
        } else if (status === "approved" && role === "super_admin") {
            return "super_admin"; // Super Admin final approval
        }
        return "view_only"; // Just viewing, no action needed
    };

    const reviewStage = getReviewStage();

    useEffect(() => {
        if (isOpen && application) {
            loadReviewData();
            // Reset activeTab to eligibility when modal opens
            setActiveTab("eligibility");
        }
    }, [isOpen, application]);

    const loadReviewData = async () => {
        try {
            setLoading(true);

            // Load existing review summary (commented out - view doesn't exist yet)
            // const summary = await reviewService.getReviewSummary(
            //     application.id
            // );
            // setReviewData(summary);
            
            // For now, extract review info from application data
            if (application.reviewSummary) {
                setReviewData(application.reviewSummary);
            }

            // Load comments
            const commentsData = await reviewService.getComments(
                application.id
            );
            setComments(commentsData);

            // Load timeline
            const timelineData = await reviewService.getTimeline(
                application.id
            );
            setTimeline(timelineData);

            // Load document reviews (single fetch by application, map by documentId)
            if (application.documents) {
                const reviews = await reviewService.getDocumentReviews(
                    application.id
                );
                console.log("=== DOCUMENT REVIEWS LOADED ===");
                console.log("Reviews from API:", reviews);
                const byDoc: Record<string, any> = {};
                for (const r of reviews) {
                    // Try both camelCase and snake_case
                    const docId = (r as any).documentId || (r as any).document_id;
                    console.log("Review entry:", r, "Document ID:", docId);
                    if (docId) byDoc[docId] = r;
                }
                console.log("Mapped reviews by documentId:", byDoc);
                setDocumentReviews(byDoc);
            }

            // Prefill eligibility form with latest saved eligibility check
            try {
                const existingEligibility = await reviewService.getEligibilityCheck(
                    application.id
                );
                if (existingEligibility) {
                    // Map API fields back to form model safely; prefer camelCase (service types), fallback to snake_case
                    const anyEl: any = existingEligibility as any;
                    const prefill: any = {
                        isScStObcVerified:
                            existingEligibility.isScStObcVerified ?? anyEl.is_sc_st_obc_verified ?? false,
                        categoryProofValid:
                            existingEligibility.categoryProofValid ?? anyEl.category_proof_valid ?? false,
                        employeeIdVerified:
                            existingEligibility.employeeIdVerified ?? anyEl.employee_id_verified ?? false,
                        medicalCardValid:
                            existingEligibility.medicalCardValid ?? anyEl.medical_card_valid ?? false,
                        relationshipVerified:
                            existingEligibility.relationshipVerified ?? anyEl.relationship_verified ?? false,
                        hasPendingClaims:
                            existingEligibility.hasPendingClaims ?? anyEl.has_pending_claims ?? false,
                        isWithinLimits:
                            existingEligibility.isWithinLimits ?? anyEl.is_within_limits ?? true,
                        isTreatmentCovered:
                            existingEligibility.isTreatmentCovered ?? anyEl.is_treatment_covered ?? true,
                        priorPermissionStatus:
                            (existingEligibility.priorPermissionStatus ?? anyEl.prior_permission_status) || "not_required",
                        eligibilityStatus:
                            existingEligibility.eligibilityStatus || anyEl.eligibility_status || "eligible",
                        ineligibilityReasons:
                            existingEligibility.ineligibilityReasons || anyEl.ineligibility_reasons || [],
                        conditions: existingEligibility.conditions || anyEl.conditions || [],
                        notes: existingEligibility.notes || anyEl.notes || "",
                    };
                    // Delay to ensure child form mounts
                    setTimeout(() => {
                        // We don't have direct control to set child state; pass via key to re-mount with defaults
                        setEligibilityDefaults(prefill);
                    }, 0);
                }
            } catch (e) {
                // ignore if none
            }
        } catch (error) {
            console.error("Error loading review data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Local state to pass defaults into child form via key remount
    const [eligibilityDefaults, setEligibilityDefaults] = useState<any | null>(
        null
    );

    const handleEligibilitySubmit = async (data: EligibilityCheckData) => {
        if (!user) {
            setError("You must be logged in to submit a review");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            // Upsert eligibility check: prefer PATCH if exists, else POST
            const existing = await reviewService.getEligibilityCheck(
                application.id
            );

            const payload = {
                applicationId: application.id,
                checkerId: user.id,
                isScStObcVerified: data.isScStObcVerified,
                categoryProofValid: data.categoryProofValid,
                employeeIdVerified: data.employeeIdVerified,
                medicalCardValid: data.medicalCardValid,
                relationshipVerified: data.relationshipVerified,
                hasPendingClaims: data.hasPendingClaims,
                isWithinLimits: data.isWithinLimits,
                isTreatmentCovered: data.isTreatmentCovered,
                priorPermissionStatus: data.priorPermissionStatus,
                eligibilityStatus: data.eligibilityStatus,
                ineligibilityReasons: data.ineligibilityReasons,
                conditions: data.conditions,
                notes: data.notes,
            } as any;

            if (existing) {
                await reviewService.updateEligibilityCheck(
                    application.id,
                    payload
                );
            } else {
                await reviewService.performEligibilityCheck(payload);
            }

            await loadReviewData();
            setSuccess("Eligibility check saved! Please proceed to document review.");
            
            // Mark eligibility as completed
            setCompletedSteps(prev => ({ ...prev, eligibility: true }));

            // Auto-switch to documents tab for next step
            setTimeout(() => {
                setActiveTab("documents");
                setSuccess(null);
            }, 1500);
        } catch (error: any) {
            console.error("Error submitting eligibility check:", error);
            setError(
                error.message ||
                    "Failed to submit eligibility check. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDocumentReview = async (
        documentId: string,
        data: DocumentReviewData
    ) => {
        if (!user) {
            setError("You must be logged in to review documents");
            return;
        }

        try {
            setError(null);
            await reviewService.reviewDocument({
                applicationId: application.id,
                documentId: documentId,
                reviewerId: user.id,
                documentType: "unknown",
                isVerified: data.isVerified,
                isComplete: data.isComplete,
                isLegible: data.isLegible,
                verificationStatus: data.isVerified
                    ? "approved"
                    : "needs_clarification",
                verificationNotes: data.remarks,
                replacementRequired: !data.isComplete,
            });

            await loadReviewData();
            setSuccess("Document review saved! Complete all reviews and then use the buttons below to finalize.");
        } catch (error: any) {
            console.error("Error reviewing document:", error);
            setError(error.message || "Failed to review document");
            throw error;
        }
    };

    const handleAddComment = async (
        commentText: string,
        isInternal: boolean = false
    ) => {
        if (!user) {
            setError("You must be logged in to add comments");
            return;
        }

        try {
            setError(null);
            await reviewService.addComment({
                applicationId: application.id,
                commentType: "general",
                commentText: commentText,
                isInternal: isInternal,
            });

            await loadReviewData();
            setSuccess("Comment added");
        } catch (error: any) {
            console.error("Error adding comment:", error);
            setError(error.message || "Failed to add comment");
            throw error;
        }
    };

    const handleResolveComment = async (commentId: string) => {
        try {
            await reviewService.resolveComment(commentId);
            await loadReviewData();
        } catch (error) {
            console.error("Error resolving comment:", error);
            throw error;
        }
    };

    const handleFinalDecision = async (
        decision: "approved" | "rejected" | "needs_clarification"
    ) => {
        if (!user) {
            setError("You must be logged in to make a final decision");
            return;
        }

        // Validate that all review steps are completed before allowing approval
        if (decision === "approved") {
            if (!completedSteps.eligibility) {
                setError("Please complete the Eligibility Check before approving");
                setActiveTab("eligibility");
                return;
            }
            
            // Check if all documents have been reviewed
            const totalDocs = application.documents?.length || 0;
            const reviewedDocs = Object.keys(documentReviews).length;
            
            if (totalDocs > 0 && reviewedDocs < totalDocs) {
                setError(`Please review all documents (${reviewedDocs}/${totalDocs} completed) before approving`);
                setActiveTab("documents");
                return;
            }
            
            if (totalDocs > 0 && !completedSteps.documents) {
                setError("Please confirm document review completion before approving");
                setActiveTab("documents");
                return;
            }
        }

        if (
            !confirm(
                `Are you sure you want to ${decision.replace(
                    "_",
                    " "
                )} this application?`
            )
        ) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            console.log("🔄 Submitting final decision:", decision, "for app:", application.id);

            // Create the final review record
            await reviewService.createReview(application.id, {
                reviewStage: "final",
                decision: decision,
                reviewNotes: `Final decision by ${user.name}: ${decision}`,
                eligibilityVerified: true,
                documentsVerified: true,
                medicalValidityChecked: true,
                expensesValidated: true,
            });

            // Update the application status based on decision AND user role
            let newStatus: string;
            
            if (decision === "rejected") {
                newStatus = "rejected";
            } else if (decision === "needs_clarification") {
                newStatus = "under_review";
            } else if (decision === "approved") {
                // Different status based on who is approving and current application status
                if (user.role === "obc" || user.role === "admin") {
                    // If application is coming back from Health Centre (back_to_obc), forward to Super Admin
                    if (application.status === "back_to_obc") {
                        newStatus = "approved"; // Forward to Super Admin
                    } else {
                        // First time review - forward to Health Centre
                        newStatus = "under_review";
                    }
                } else if (user.role === "health-centre" || user.role === "medical_officer") {
                    // Health Centre sends back to OBC for final review
                    newStatus = "back_to_obc";
                } else {
                    // Super admin marks as reimbursed (final status)
                    newStatus = "reimbursed";
                }
            } else {
                newStatus = "under_review";
            }

            console.log("📤 Updating status to:", newStatus);
            
            // Update application status using admin service (fail loudly if update fails so user knows it wasn't forwarded)
            const updateResult = await adminService.updateApplicationStatus(
                application.id,
                newStatus as any,
                `${decision.replace("_", " ")} by ${user.name} (${user.role}) - Forwarded to next stage`
            );
            
            console.log("✅ Status update successful:", updateResult);

            setSuccess(
                `Application ${decision.replace("_", " ")} successfully!`
            );

            // Wait 2 seconds to show success message, then close modal WITHOUT refreshing
            setTimeout(() => {
                onClose();
                // Don't reload - let user manually refresh to see updated status
            }, 2000);
        } catch (error: any) {
            console.error("Error submitting final decision:", error);
            setError(
                error.message || "Failed to submit decision. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const tabs = [
        {
            id: "eligibility" as ReviewTab,
            label: "Eligibility Check",
            icon: CheckSquare,
        },
        { id: "documents" as ReviewTab, label: "Documents", icon: FileText },
        {
            id: "comments" as ReviewTab,
            label: "Comments",
            icon: MessageSquare,
            badge: comments.filter((c) => !c.isResolved).length,
        },
        { id: "timeline" as ReviewTab, label: "Timeline", icon: Clock },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] max-h-[90vh] flex">
                {/* Left Sidebar - Instructions & Guidelines */}
                <div className="w-80 bg-gradient-to-b from-blue-50 to-indigo-50 border-r border-gray-200 overflow-y-auto flex-shrink-0">
                    <div className="p-6 space-y-6">
                        {/* Header */}
                        <div>
                            <h3 className="text-lg font-bold text-indigo-900 mb-2">
                                📋 Review Guidelines
                            </h3>
                            <p className="text-xs text-indigo-600">
                                Follow these steps to complete your review
                            </p>
                        </div>

                        {/* Role-specific Instructions */}
                        {reviewStage === "initial_obc" && (
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <h4 className="font-semibold text-purple-900 mb-2 text-sm">
                                        🔍 OBC Initial Review
                                    </h4>
                                    <ol className="text-xs text-gray-700 space-y-2 list-decimal list-inside">
                                        <li>Check employee eligibility
                                            <ul className="ml-4 mt-1 list-disc list-inside text-xs text-gray-600">
                                                <li>Verify SC/ST/OBC status</li>
                                                <li>Check CGHS card validity</li>
                                                <li>Confirm employee ID</li>
                                            </ul>
                                        </li>
                                        <li>Review all documents</li>
                                        <li>Verify expense items</li>
                                        <li>Add comments if needed</li>
                                        <li>Click "Forward to Health Centre"</li>
                                    </ol>
                                </div>
                            </div>
                        )}

                        {reviewStage === "health_centre" && (
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <h4 className="font-semibold text-green-900 mb-2 text-sm">
                                        🏥 Medical Assessment
                                    </h4>
                                    <ol className="text-xs text-gray-700 space-y-2 list-decimal list-inside">
                                        <li>Review medical documents
                                            <ul className="ml-4 mt-1 list-disc list-inside text-xs text-gray-600">
                                                <li>Check prescriptions</li>
                                                <li>Verify medical bills</li>
                                                <li>Review discharge summary</li>
                                            </ul>
                                        </li>
                                        <li>Validate treatment necessity</li>
                                        <li>Approve eligible amounts</li>
                                        <li>Document findings</li>
                                        <li>Click "Return to OBC"</li>
                                    </ol>
                                </div>
                            </div>
                        )}

                        {reviewStage === "final_obc" && (
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                                        ✅ Final OBC Review
                                    </h4>
                                    <ol className="text-xs text-gray-700 space-y-2 list-decimal list-inside">
                                        <li>Review Health Centre assessment</li>
                                        <li>Verify approved amounts</li>
                                        <li>Check all comments resolved</li>
                                        <li>Final document verification</li>
                                        <li>Click "Approve & Forward"</li>
                                    </ol>
                                </div>
                            </div>
                        )}

                        {reviewStage === "super_admin" && (
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <h4 className="font-semibold text-amber-900 mb-2 text-sm">
                                        👑 Final Approval
                                    </h4>
                                    <ol className="text-xs text-gray-700 space-y-2 list-decimal list-inside">
                                        <li>Review complete workflow</li>
                                        <li>Verify all approvals</li>
                                        <li>Check final amount</li>
                                        <li>Authorize reimbursement</li>
                                    </ol>
                                </div>
                            </div>
                        )}

                        {/* Quick Tips */}
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center">
                                💡 Quick Tips
                            </h4>
                            <ul className="text-xs text-gray-600 space-y-2">
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Click document names to review them</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Use 👁️ to view, ⬇️ to download</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Mark documents as verified after review</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Add comments to communicate with other reviewers</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Check timeline tab to see history</span>
                                </li>
                            </ul>
                        </div>

                        {/* Status Key */}
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                                🔑 Status Indicators
                            </h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center">
                                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                    <span className="text-gray-700">Verified / Complete</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                                    <span className="text-gray-700">Pending Review</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                                    <span className="text-gray-700">Issues Found</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Comprehensive Application Review
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Application ID: {application?.id} | Employee:{" "}
                            {application?.employeeName || application?.employee_name}
                        </p>
                        {user && (
                            <p className="text-xs text-gray-500 mt-1">
                                Reviewing as: {user.name} ({user.role})
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Success/Error Messages */}
                {(error || success) && (
                    <div className="px-6 pt-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-red-800 font-medium">
                                        Error
                                    </p>
                                    <p className="text-sm text-red-700">
                                        {error}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setError(null)}
                                    className="text-red-400 hover:text-red-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-green-800 font-medium">
                                        Success
                                    </p>
                                    <p className="text-sm text-green-700">
                                        {success}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSuccess(null)}
                                    className="text-green-400 hover:text-green-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Application Summary */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Patient:</span>
                            <p className="font-medium text-gray-900">
                                {application?.patientName}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-600">Treatment:</span>
                            <p className="font-medium text-gray-900">
                                {application?.treatmentType}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-600">Total Amount:</span>
                            <p className="font-medium text-gray-900">
                                ₹{application?.totalAmountClaimed?.toLocaleString?.()}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-600">Status:</span>
                            <p className="font-medium text-gray-900 capitalize">
                                {application?.status?.replace?.("_", " ")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 px-6">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isCompleted = 
                            (tab.id === "eligibility" && completedSteps.eligibility) ||
                            (tab.id === "documents" && completedSteps.documents);
                        
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors relative ${
                                    activeTab === tab.id
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                                {isCompleted && (
                                    <CheckCircle className="w-4 h-4 text-green-600 ml-1" />
                                )}
                                {tab.badge !== undefined && tab.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    )}

                    {!loading && activeTab === "eligibility" && (
                        <div key={JSON.stringify(eligibilityDefaults || {})}>
                            <EligibilityCheckForm
                                onSubmit={handleEligibilitySubmit}
                                onCancel={onClose}
                                loading={loading}
                                defaults={eligibilityDefaults || undefined}
                            />
                        </div>
                    )}

                    {!loading && activeTab === "documents" && (
                        <div className="space-y-4">
                            <DocumentReviewPanel
                                documents={application?.documents || []}
                                onReviewDocument={handleDocumentReview}
                                existingReviews={documentReviews}
                            />
                            
                            {/* Document Review Completion Button */}
                            {application?.documents && application.documents.length > 0 && (
                                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-blue-800">
                                                Document Review Status
                                            </h4>
                                            <p className="text-sm text-blue-600 mt-1">
                                                {Object.keys(documentReviews).length} of {application.documents.length} documents reviewed
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const totalDocs = application.documents?.length || 0;
                                                const reviewedDocs = Object.keys(documentReviews).length;
                                                
                                                if (reviewedDocs < totalDocs) {
                                                    setError(`Please review all documents (${reviewedDocs}/${totalDocs} completed)`);
                                                    return;
                                                }
                                                
                                                setCompletedSteps(prev => ({ ...prev, documents: true }));
                                                setSuccess("Document review completed! You can now proceed to final decision.");
                                                setTimeout(() => {
                                                    setActiveTab("timeline");
                                                    setSuccess(null);
                                                }, 1500);
                                            }}
                                            disabled={completedSteps.documents}
                                            className={`px-4 py-2 rounded-md font-medium ${
                                                completedSteps.documents
                                                    ? 'bg-green-600 text-white cursor-not-allowed'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                        >
                                            {completedSteps.documents ? (
                                                <span className="flex items-center">
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Documents Reviewed
                                                </span>
                                            ) : (
                                                'Complete Document Review'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!loading && activeTab === "comments" && (
                        <CommentThread
                            applicationId={application.id}
                            comments={comments}
                            onAddComment={handleAddComment}
                            onResolveComment={handleResolveComment}
                            currentUserId={user?.id || "unknown"}
                            currentUserRole={user?.role || "employee"}
                        />
                    )}

                    {!loading && activeTab === "timeline" && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                                Review Timeline
                            </h3>
                            <div className="relative">
                                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                                <div className="space-y-6">
                                    {timeline.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="relative pl-10"
                                        >
                                            <div className="absolute left-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <AlertCircle className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-gray-900 capitalize">
                                                        {entry.actionType
                                                            ? entry.actionType.replace(
                                                                  "_",
                                                                  " "
                                                              )
                                                            : "Action"}{" "}
                                                        {entry.actionDescription &&
                                                            `- ${entry.actionDescription}`}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {entry.createdAt || entry.created_at
                                                            ? new Date(
                                                                  entry.createdAt ||
                                                                      entry.created_at
                                                              ).toLocaleString()
                                                            : "Unknown time"}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    By {entry.actorName || entry.actor_name || "System"} (
                                                    {entry.actorRole || entry.actor_role || "admin"})
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {timeline.length === 0 && (
                                        <p className="text-center text-gray-500 py-8">
                                            No timeline entries yet
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer with Final Decision Buttons */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    {/* Review Progress Indicator */}
                    <div className="mb-4 bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700">Review Progress:</span>
                            <div className="flex items-center space-x-4">
                                <span className={`flex items-center ${completedSteps.eligibility ? 'text-green-600' : 'text-gray-400'}`}>
                                    {completedSteps.eligibility ? <CheckCircle className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
                                    Eligibility
                                </span>
                                <span className={`flex items-center ${completedSteps.documents ? 'text-green-600' : 'text-gray-400'}`}>
                                    {completedSteps.documents ? <CheckCircle className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
                                    Documents
                                </span>
                                {!completedSteps.eligibility || !completedSteps.documents ? (
                                    <span className="text-xs text-red-600 font-medium">
                                        Complete all reviews before approving
                                    </span>
                                ) : (
                                    <span className="text-xs text-green-600 font-medium">
                                        ✓ Ready for final decision
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            {reviewData && (
                                <p>
                                    Review Status:{" "}
                                    <span className="font-medium">
                                        {reviewData.overall_status}
                                    </span>
                                    {reviewData.completion_percentage && (
                                        <span className="ml-2">
                                            ({reviewData.completion_percentage}%
                                            complete)
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => handleFinalDecision("rejected")}
                                disabled={loading}
                                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                Reject Application
                            </button>
                            <button
                                onClick={() =>
                                    handleFinalDecision("needs_clarification")
                                }
                                disabled={loading}
                                className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                            >
                                Request Clarification
                            </button>
                            <button
                                onClick={() => handleFinalDecision("approved")}
                                disabled={loading}
                                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                Approve & Forward
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
};

export default ComprehensiveReviewModal;
