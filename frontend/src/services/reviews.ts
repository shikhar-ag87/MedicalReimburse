// Review service for managing application reviews, comments, and validations
import { apiService } from "./api";

// ============================================
// TYPES
// ============================================

export interface ApplicationReview {
    id: string;
    applicationId: string;
    reviewerId: string;
    reviewerRole: string;
    reviewStage: string;
    decision: "approved" | "rejected" | "needs_clarification" | "pending";
    eligibilityVerified: boolean;
    documentsVerified: boolean;
    medicalValidityChecked: boolean;
    expensesValidated: boolean;
    completenessScore?: number;
    documentQualityScore?: number;
    reviewNotes?: string;
    internalRemarks?: string;
    rejectionReasons?: string[];
    clarificationNeeded?: string[];
    reviewStartedAt: string;
    reviewCompletedAt?: string;
    createdAt: string;
    updatedAt: string;
    reviewer?: {
        name: string;
        email: string;
        role: string;
    };
}

export interface ReviewComment {
    id: string;
    applicationId: string;
    reviewId?: string;
    commenterId: string;
    commenterName: string;
    commenterRole: string;
    commentType: "general" | "question" | "concern" | "recommendation";
    commentText: string;
    parentCommentId?: string;
    isResolved: boolean;
    resolvedBy?: string;
    resolvedAt?: string;
    isInternal: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DocumentReview {
    id: string;
    applicationId: string;
    documentId: string;
    reviewerId: string;
    documentType: string;
    isVerified: boolean;
    isAuthentic?: boolean;
    isLegible?: boolean;
    isComplete?: boolean;
    verificationStatus:
        | "approved"
        | "rejected"
        | "needs_replacement"
        | "needs_clarification";
    issuesFound?: string[];
    verificationNotes?: string;
    replacementRequired: boolean;
    additionalDocsNeeded?: string[];
    verifiedAt?: string;
    createdAt: string;
    updatedAt: string;
    reviewer?: {
        name: string;
        email: string;
    };
    document?: {
        fileName: string;
        documentType: string;
    };
}

export interface ExpenseValidation {
    id: string;
    applicationId: string;
    expenseId: string;
    validatorId: string;
    originalAmount: number;
    validatedAmount?: number;
    adjustmentAmount?: number;
    validationStatus:
        | "approved"
        | "partially_approved"
        | "rejected"
        | "under_review";
    isWithinPolicy?: boolean;
    isReceiptValid?: boolean;
    isAmountReasonable?: boolean;
    hasPriorApproval?: boolean;
    adjustmentReason?: string;
    rejectionReason?: string;
    policyReference?: string;
    appliedRateType?: string;
    rateCalculationDetails?: string;
    validatedAt?: string;
    createdAt: string;
    updatedAt: string;
    validator?: {
        name: string;
        email: string;
    };
    expense?: {
        description: string;
        billNumber: string;
        billDate: string;
        category: string;
    };
}

export interface EligibilityCheck {
    id: string;
    applicationId: string;
    checkerId: string;
    isScStObcVerified?: boolean;
    categoryProofValid?: boolean;
    employeeIdVerified?: boolean;
    medicalCardValid?: boolean;
    relationshipVerified?: boolean;
    hasPendingClaims?: boolean;
    isWithinLimits?: boolean;
    isTreatmentCovered?: boolean;
    priorPermissionStatus?: string;
    eligibilityStatus: "eligible" | "not_eligible" | "conditional";
    ineligibilityReasons?: string[];
    conditions?: string[];
    notes?: string;
    checkedAt: string;
    createdAt: string;
    checker?: {
        name: string;
        email: string;
        role: string;
    };
}

export interface MedicalAssessment {
    id: string;
    applicationId: string;
    assessorId: string;
    diagnosisVerified?: boolean;
    treatmentAppropriate?: boolean;
    prescriptionValid?: boolean;
    hospitalEmpaneled?: boolean;
    treatmentNecessity?: string;
    treatmentDurationAppropriate?: boolean;
    medicationPrescribedCorrectly?: boolean;
    concernsRaised?: string[];
    requiresSecondOpinion: boolean;
    fraudIndicators?: string[];
    medicalOpinion?: string;
    recommendedAction?: string;
    alternativeTreatmentSuggested?: string;
    assessedAt: string;
    createdAt: string;
    assessor?: {
        name: string;
        email: string;
        role: string;
    };
}

export interface TimelineEntry {
    id: string;
    applicationId: string;
    actorId?: string;
    actorName: string;
    actorRole: string;
    actionType: string;
    actionDescription: string;
    previousStatus?: string;
    newStatus?: string;
    metadata?: any;
    createdAt: string;
}

export interface ReviewAssignment {
    id: string;
    applicationId: string;
    assignedTo: string;
    assignedBy?: string;
    assignmentType: string;
    priority: "low" | "normal" | "high" | "urgent";
    dueDate?: string;
    status: "pending" | "in_progress" | "completed" | "reassigned";
    assignedAt: string;
    startedAt?: string;
    completedAt?: string;
    notes?: string;
}

export interface ReviewSummary {
    applicationId: string;
    applicationNumber: string;
    currentStatus: string;
    totalReviews: number;
    approvedReviews: number;
    rejectedReviews: number;
    totalDocumentsReviewed: number;
    documentsVerified: number;
    totalExpensesValidated: number;
    totalValidatedAmount: number;
    totalComments: number;
    unresolvedComments: number;
    totalAssignments: number;
    completedAssignments: number;
    lastReviewedAt?: string;
}

// ============================================
// SERVICE CLASS
// ============================================

class ReviewService {
    // ========== APPLICATION REVIEWS ==========

    async createReview(
        applicationId: string,
        reviewData: Partial<ApplicationReview>
    ): Promise<ApplicationReview> {
        const response = await apiService.post<ApplicationReview>(
            `/reviews/applications/${applicationId}`,
            reviewData
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to create review");
        }

        return response.data;
    }

    async getReviews(applicationId: string): Promise<ApplicationReview[]> {
        const response = await apiService.get<ApplicationReview[]>(
            `/reviews/applications/${applicationId}`
        );

        if (!response.success) {
            throw new Error(response.message || "Failed to fetch reviews");
        }

        return response.data || [];
    }

    // ========== COMMENTS ==========

    async addComment(commentData: {
        applicationId: string;
        reviewId?: string;
        commentType: string;
        commentText: string;
        parentCommentId?: string;
        isInternal?: boolean;
    }): Promise<ReviewComment> {
        const response = await apiService.post<ReviewComment>(
            "/reviews/comments",
            commentData
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to add comment");
        }

        return response.data;
    }

    async getComments(
        applicationId: string,
        includeInternal: boolean = true
    ): Promise<ReviewComment[]> {
        const response = await apiService.get<ReviewComment[]>(
            `/reviews/comments/${applicationId}?includeInternal=${includeInternal}`
        );

        if (!response.success) {
            throw new Error(response.message || "Failed to fetch comments");
        }

        return response.data || [];
    }

    async resolveComment(commentId: string): Promise<ReviewComment> {
        const response = await apiService.patch<ReviewComment>(
            `/reviews/comments/${commentId}/resolve`,
            {}
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to resolve comment");
        }

        return response.data;
    }

    // ========== DOCUMENT REVIEWS ==========

    async reviewDocument(
        documentData: Partial<DocumentReview>
    ): Promise<DocumentReview> {
        const response = await apiService.post<DocumentReview>(
            "/reviews/documents",
            documentData
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to review document");
        }

        return response.data;
    }

    async getDocumentReviews(applicationId: string): Promise<DocumentReview[]> {
        const response = await apiService.get<DocumentReview[]>(
            `/reviews/documents/${applicationId}`
        );

        if (!response.success) {
            throw new Error(
                response.message || "Failed to fetch document reviews"
            );
        }

        return response.data || [];
    }

    // ========== EXPENSE VALIDATIONS ==========

    async validateExpense(
        expenseData: Partial<ExpenseValidation>
    ): Promise<ExpenseValidation> {
        const response = await apiService.post<ExpenseValidation>(
            "/reviews/expenses",
            expenseData
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to validate expense");
        }

        return response.data;
    }

    async getExpenseValidations(
        applicationId: string
    ): Promise<ExpenseValidation[]> {
        const response = await apiService.get<ExpenseValidation[]>(
            `/reviews/expenses/${applicationId}`
        );

        if (!response.success) {
            throw new Error(
                response.message || "Failed to fetch expense validations"
            );
        }

        return response.data || [];
    }

    // ========== ELIGIBILITY CHECKS ==========

    async performEligibilityCheck(
        checkData: Partial<EligibilityCheck>
    ): Promise<EligibilityCheck> {
        const response = await apiService.post<EligibilityCheck>(
            "/reviews/eligibility",
            checkData
        );

        if (!response.success || !response.data) {
            throw new Error(
                response.message || "Failed to perform eligibility check"
            );
        }

        return response.data;
    }

    async getEligibilityCheck(
        applicationId: string
    ): Promise<EligibilityCheck | null> {
        const response = await apiService.get<EligibilityCheck>(
            `/reviews/eligibility/${applicationId}`
        );

        if (!response.success) {
            throw new Error(
                response.message || "Failed to fetch eligibility check"
            );
        }

        return response.data || null;
    }

    // ========== MEDICAL ASSESSMENTS ==========

    async performMedicalAssessment(
        assessmentData: Partial<MedicalAssessment>
    ): Promise<MedicalAssessment> {
        const response = await apiService.post<MedicalAssessment>(
            "/reviews/medical",
            assessmentData
        );

        if (!response.success || !response.data) {
            throw new Error(
                response.message || "Failed to perform medical assessment"
            );
        }

        return response.data;
    }

    async getMedicalAssessment(
        applicationId: string
    ): Promise<MedicalAssessment | null> {
        const response = await apiService.get<MedicalAssessment>(
            `/reviews/medical/${applicationId}`
        );

        if (!response.success) {
            throw new Error(
                response.message || "Failed to fetch medical assessment"
            );
        }

        return response.data || null;
    }

    // ========== TIMELINE ==========

    async getTimeline(applicationId: string): Promise<TimelineEntry[]> {
        const response = await apiService.get<TimelineEntry[]>(
            `/reviews/timeline/${applicationId}`
        );

        if (!response.success) {
            throw new Error(response.message || "Failed to fetch timeline");
        }

        return response.data || [];
    }

    async addTimelineEntry(
        entryData: Partial<TimelineEntry>
    ): Promise<TimelineEntry> {
        const response = await apiService.post<TimelineEntry>(
            "/reviews/timeline",
            entryData
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to add timeline entry");
        }

        return response.data;
    }

    // ========== ASSIGNMENTS ==========

    async assignReview(assignmentData: {
        applicationId: string;
        assignedTo: string;
        assignmentType: string;
        priority?: string;
        dueDate?: string;
        notes?: string;
    }): Promise<ReviewAssignment> {
        const response = await apiService.post<ReviewAssignment>(
            "/reviews/assign",
            assignmentData
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to assign review");
        }

        return response.data;
    }

    async getMyAssignments(): Promise<ReviewAssignment[]> {
        const response = await apiService.get<ReviewAssignment[]>(
            "/reviews/my-assignments"
        );

        if (!response.success) {
            throw new Error(response.message || "Failed to fetch assignments");
        }

        return response.data || [];
    }

    async updateAssignmentStatus(
        assignmentId: string,
        status: string
    ): Promise<ReviewAssignment> {
        const response = await apiService.patch<ReviewAssignment>(
            `/reviews/assignments/${assignmentId}`,
            { status }
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to update assignment");
        }

        return response.data;
    }

    // ========== SUMMARY ==========

    async getReviewSummary(
        applicationId: string
    ): Promise<ReviewSummary | null> {
        const response = await apiService.get<ReviewSummary>(
            `/reviews/summary/${applicationId}`
        );

        if (!response.success) {
            throw new Error(
                response.message || "Failed to fetch review summary"
            );
        }

        return response.data || null;
    }
}

export const reviewService = new ReviewService();
