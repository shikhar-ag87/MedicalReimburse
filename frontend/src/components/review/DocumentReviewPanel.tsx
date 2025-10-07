import { useState } from "react";
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    FileText,
    Eye,
    Download,
} from "lucide-react";

interface DocumentReviewPanelProps {
    documents: ApplicationDocument[];
    onReviewDocument: (
        documentId: string,
        data: DocumentReviewData
    ) => Promise<void>;
    existingReviews?: Record<string, any>;
}

interface ApplicationDocument {
    id: string;
    document_type: string;
    file_path: string;
    file_name: string;
    uploaded_at: string;
}

export interface DocumentReviewData {
    isVerified: boolean;
    isComplete: boolean;
    isLegible: boolean;
    remarks: string;
}

const DocumentReviewPanel: React.FC<DocumentReviewPanelProps> = ({
    documents,
    onReviewDocument,
    existingReviews = {},
}) => {
    const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
    const [reviews, setReviews] = useState<Record<string, DocumentReviewData>>(
        {}
    );
    const [loading, setLoading] = useState<string | null>(null);

    const documentTypes = [
        {
            value: "category_certificate",
            label: "Category Certificate (SC/ST/OBC)",
        },
        { value: "medical_certificate", label: "Medical Certificate" },
        { value: "prescription", label: "Prescription" },
        { value: "bills", label: "Medical Bills" },
        { value: "receipts", label: "Payment Receipts" },
        { value: "lab_reports", label: "Lab Reports" },
        { value: "discharge_summary", label: "Discharge Summary" },
        { value: "referral_letter", label: "Referral Letter" },
        { value: "prior_permission", label: "Prior Permission Letter" },
        { value: "other", label: "Other Documents" },
    ];

    const getDocumentLabel = (type: string) => {
        return documentTypes.find((dt) => dt.value === type)?.label || type;
    };

    const initializeReview = (docId: string) => {
        if (!reviews[docId]) {
            setReviews((prev) => ({
                ...prev,
                [docId]: {
                    isVerified: false,
                    isComplete: false,
                    isLegible: true,
                    remarks: "",
                },
            }));
        }
        setSelectedDoc(docId);
    };

    const updateReview = (
        docId: string,
        field: keyof DocumentReviewData,
        value: any
    ) => {
        setReviews((prev) => ({
            ...prev,
            [docId]: {
                ...prev[docId],
                [field]: value,
            },
        }));
    };

    const handleSubmitReview = async (docId: string) => {
        const reviewData = reviews[docId];
        if (!reviewData) return;

        setLoading(docId);
        try {
            await onReviewDocument(docId, reviewData);
            setSelectedDoc(null);
        } catch (error) {
            console.error("Error submitting document review:", error);
        } finally {
            setLoading(null);
        }
    };

    const getDocumentStatus = (docId: string) => {
        const existing = existingReviews[docId];
        if (existing) {
            if (existing.isVerified && existing.isComplete) return "verified";
            if (!existing.isVerified) return "rejected";
            return "pending";
        }
        return "not_reviewed";
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            verified: {
                color: "bg-green-100 text-green-800 border-green-300",
                icon: CheckCircle,
                label: "Verified",
            },
            rejected: {
                color: "bg-red-100 text-red-800 border-red-300",
                icon: XCircle,
                label: "Issues Found",
            },
            pending: {
                color: "bg-yellow-100 text-yellow-800 border-yellow-300",
                icon: AlertTriangle,
                label: "Pending",
            },
            not_reviewed: {
                color: "bg-gray-100 text-gray-600 border-gray-300",
                icon: FileText,
                label: "Not Reviewed",
            },
        };

        const badge =
            badges[status as keyof typeof badges] || badges.not_reviewed;
        const Icon = badge.icon;

        return (
            <span
                className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${badge.color}`}
            >
                <Icon className="w-3 h-3" />
                <span>{badge.label}</span>
            </span>
        );
    };

    const groupedDocuments = documents.reduce((acc, doc) => {
        if (!acc[doc.document_type]) {
            acc[doc.document_type] = [];
        }
        acc[doc.document_type].push(doc);
        return acc;
    }, {} as Record<string, ApplicationDocument[]>);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Document Review
            </h3>

            <div className="space-y-4">
                {Object.entries(groupedDocuments).map(([type, docs]) => (
                    <div
                        key={type}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h4 className="font-medium text-gray-900">
                                {getDocumentLabel(type)}
                            </h4>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {docs.map((doc) => {
                                const status = getDocumentStatus(doc.id);
                                const isSelected = selectedDoc === doc.id;
                                const reviewData = reviews[doc.id];
                                const existingReview = existingReviews[doc.id];

                                return (
                                    <div key={doc.id} className="bg-white">
                                        <div className="px-4 py-3 flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {doc.file_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Uploaded:{" "}
                                                    {new Date(
                                                        doc.uploaded_at
                                                    ).toLocaleString()}
                                                </p>
                                                {existingReview && (
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        <strong>Review:</strong>{" "}
                                                        {existingReview.remarks ||
                                                            "No remarks"}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                {getStatusBadge(status)}
                                                <button
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="View Document"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    className="text-gray-600 hover:text-gray-800 p-1"
                                                    title="Download"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        initializeReview(doc.id)
                                                    }
                                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                                >
                                                    {status === "not_reviewed"
                                                        ? "Review"
                                                        : "Re-review"}
                                                </button>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <label className="flex items-center space-x-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    reviewData?.isVerified ||
                                                                    false
                                                                }
                                                                onChange={(e) =>
                                                                    updateReview(
                                                                        doc.id,
                                                                        "isVerified",
                                                                        e.target
                                                                            .checked
                                                                    )
                                                                }
                                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                                            />
                                                            <span className="text-sm text-gray-700">
                                                                Verified
                                                            </span>
                                                        </label>
                                                        <label className="flex items-center space-x-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    reviewData?.isComplete ||
                                                                    false
                                                                }
                                                                onChange={(e) =>
                                                                    updateReview(
                                                                        doc.id,
                                                                        "isComplete",
                                                                        e.target
                                                                            .checked
                                                                    )
                                                                }
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm text-gray-700">
                                                                Complete
                                                            </span>
                                                        </label>
                                                        <label className="flex items-center space-x-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    reviewData?.isLegible ??
                                                                    true
                                                                }
                                                                onChange={(e) =>
                                                                    updateReview(
                                                                        doc.id,
                                                                        "isLegible",
                                                                        e.target
                                                                            .checked
                                                                    )
                                                                }
                                                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                                            />
                                                            <span className="text-sm text-gray-700">
                                                                Legible
                                                            </span>
                                                        </label>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Remarks
                                                        </label>
                                                        <textarea
                                                            value={
                                                                reviewData?.remarks ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                updateReview(
                                                                    doc.id,
                                                                    "remarks",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            placeholder="Add remarks about this document..."
                                                        />
                                                    </div>

                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() =>
                                                                setSelectedDoc(
                                                                    null
                                                                )
                                                            }
                                                            disabled={
                                                                loading ===
                                                                doc.id
                                                            }
                                                            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleSubmitReview(
                                                                    doc.id
                                                                )
                                                            }
                                                            disabled={
                                                                loading ===
                                                                doc.id
                                                            }
                                                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                                                        >
                                                            {loading ===
                                                            doc.id ? (
                                                                <>
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                    <span>
                                                                        Saving...
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="w-4 h-4" />
                                                                    <span>
                                                                        Save
                                                                        Review
                                                                    </span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {documents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No documents uploaded for this application</p>
                </div>
            )}
        </div>
    );
};

export default DocumentReviewPanel;
