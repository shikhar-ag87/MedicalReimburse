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

    useEffect(() => {
        if (isOpen && application) {
            loadReviewData();
        }
    }, [isOpen, application]);

    const loadReviewData = async () => {
        try {
            setLoading(true);

            // Load existing review summary
            const summary = await reviewService.getReviewSummary(
                application.id
            );
            setReviewData(summary);

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

            // Load document reviews
            if (application.documents) {
                const docReviews: Record<string, any> = {};
                for (const doc of application.documents) {
                    const reviews = await reviewService.getDocumentReviews(
                        doc.id
                    );
                    if (reviews.length > 0) {
                        docReviews[doc.id] = reviews[0];
                    }
                }
                setDocumentReviews(docReviews);
            }
        } catch (error) {
            console.error("Error loading review data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEligibilitySubmit = async (data: EligibilityCheckData) => {
        if (!user) {
            setError("You must be logged in to submit a review");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            // Create the eligibility check
            await reviewService.performEligibilityCheck({
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
            });

            // If eligible or conditional, create main review record
            if (data.eligibilityStatus !== "not_eligible") {
                await reviewService.createReview(application.id, {
                    reviewStage: "eligibility",
                    decision:
                        data.eligibilityStatus === "eligible"
                            ? "approved"
                            : "needs_clarification",
                    reviewNotes: data.notes,
                    eligibilityVerified: true,
                    documentsVerified: false,
                    medicalValidityChecked: false,
                    expensesValidated: false,
                });
            }

            await loadReviewData();
            setSuccess("Eligibility check submitted successfully!");
            onReviewComplete();

            // Auto-switch to timeline tab to show the result
            setTimeout(() => setActiveTab("timeline"), 500);
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
            setSuccess("Document review submitted successfully");
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
            setSuccess("Comment added successfully");
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

            await reviewService.createReview(application.id, {
                reviewStage: "final",
                decision: decision,
                reviewNotes: `Final decision by ${user.name}: ${decision}`,
                eligibilityVerified: true,
                documentsVerified: true,
                medicalValidityChecked: true,
                expensesValidated: true,
            });

            setSuccess(
                `Application ${decision.replace("_", " ")} successfully!`
            );
            onReviewComplete();

            setTimeout(() => {
                onClose();
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Comprehensive Application Review
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Application ID: {application?.id} | Employee:{" "}
                            {application?.employee_name}
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
                                {application?.patient_name}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-600">Treatment:</span>
                            <p className="font-medium text-gray-900">
                                {application?.diagnosis}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-600">Total Amount:</span>
                            <p className="font-medium text-gray-900">
                                ₹{application?.total_amount?.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-600">Status:</span>
                            <p className="font-medium text-gray-900 capitalize">
                                {application?.status?.replace("_", " ")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 px-6">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
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
                        <EligibilityCheckForm
                            onSubmit={handleEligibilitySubmit}
                            onCancel={onClose}
                            loading={loading}
                        />
                    )}

                    {!loading && activeTab === "documents" && (
                        <DocumentReviewPanel
                            documents={application?.documents || []}
                            onReviewDocument={handleDocumentReview}
                            existingReviews={documentReviews}
                        />
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
                                                        {entry.actionType.replace(
                                                            "_",
                                                            " "
                                                        )}{" "}
                                                        -{" "}
                                                        {
                                                            entry.actionDescription
                                                        }
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(
                                                            entry.createdAt
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    By {entry.actorName} (
                                                    {entry.actorRole})
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
    );
};

export default ComprehensiveReviewModal;
