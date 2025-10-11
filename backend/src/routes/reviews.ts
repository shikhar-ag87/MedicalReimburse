import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../middleware/errorHandler";
import { getDatabase } from "../database/connection";
import { SupabaseConnection } from "../database/providers/supabase";
import { logger } from "../utils/logger";

const router = express.Router();

// Authentication middleware for review routes
const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
        res.status(401).json({
            success: false,
            message: "Access token required",
        });
        return;
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your-secret-key"
        ) as any;

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
        return;
    }
};

// All routes require authentication
router.use(authenticateToken);

// ============================================
// APPLICATION REVIEWS
// ============================================

/**
 * Create a new review for an application
 * POST /api/reviews/applications/:applicationId
 */
router.post(
    "/applications/:applicationId",
    asyncHandler(async (req: Request, res: Response) => {
        const { applicationId } = req.params;
        const {
            reviewStage,
            decision,
            eligibilityVerified,
            documentsVerified,
            medicalValidityChecked,
            expensesValidated,
            completenessScore,
            documentQualityScore,
            reviewNotes,
            internalRemarks,
            rejectionReasons,
            clarificationNeeded,
        } = req.body;

        const reviewerId = req.user?.userId;
        const reviewerRole = req.user?.role; // Get role from authenticated user

        if (!reviewerId) {
            logger.error("Review creation failed: No reviewer ID", {
                user: req.user,
                hasUser: !!req.user,
                userId: req.user?.userId,
            });
            res.status(401).json({
                success: false,
                message: "User authentication required",
            });
            return;
        }

        logger.info(`Creating review for application ${applicationId}`, {
            reviewerId,
            reviewerRole,
            userObject: req.user,
            decision,
        });

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();
        const { data, error } = await client
            .from("application_reviews")
            .insert({
                application_id: applicationId,
                reviewer_id: reviewerId,
                reviewer_role: reviewerRole,
                review_stage: reviewStage,
                decision,
                eligibility_verified: eligibilityVerified,
                documents_verified: documentsVerified,
                medical_validity_checked: medicalValidityChecked,
                expenses_validated: expensesValidated,
                completeness_score: completenessScore,
                document_quality_score: documentQualityScore,
                review_notes: reviewNotes,
                internal_remarks: internalRemarks,
                rejection_reasons: rejectionReasons,
                clarification_needed: clarificationNeeded,
                review_completed_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        logger.info(`Review created for application ${applicationId}`, {
            reviewId: data.id,
            decision,
        });

        res.json({
            success: true,
            message: "Review submitted successfully",
            data,
        });
    })
);

/**
 * Get all reviews for an application
 * GET /api/reviews/applications/:applicationId
 */
router.get(
    "/applications/:applicationId",
    asyncHandler(async (req: Request, res: Response) => {
        const { applicationId } = req.params;

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();
        const { data, error } = await client
            .from("application_reviews")
            .select(
                `
                *,
                reviewer:admin_users!reviewer_id(name, email, role)
            `
            )
            .eq("application_id", applicationId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
        });
    })
);

// ============================================
// REVIEW COMMENTS
// ============================================

/**
 * Add a comment to an application review
 * POST /api/reviews/comments
 */
router.post(
    "/comments",
    asyncHandler(async (req: Request, res: Response) => {
        const {
            applicationId,
            reviewId,
            commentType,
            commentText,
            parentCommentId,
            isInternal,
        } = req.body;

        const commenterId = req.user?.userId;
        let commenterName = req.user?.name;
        const commenterRole = req.user?.role || "admin";

        // If name is not in token (old tokens), fetch from database
        if (!commenterName && commenterId) {
            try {
                const db = await getDatabase();
                const userRepo = db.getUserRepository();
                const user = await userRepo.findById(commenterId);
                commenterName = user?.name || "Admin User";
            } catch (error) {
                logger.warn("Could not fetch user name for commenter", {
                    commenterId,
                    error,
                });
                commenterName = "Admin User";
            }
        }

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();
        const { data, error } = await client
            .from("review_comments")
            .insert({
                application_id: applicationId,
                review_id: reviewId,
                commenter_id: commenterId,
                commenter_name: commenterName || "Admin User",
                commenter_role: commenterRole,
                comment_type: commentType,
                comment_text: commentText,
                parent_comment_id: parentCommentId,
                is_internal: isInternal ?? true,
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: "Comment added successfully",
            data,
        });
    })
);

/**
 * Get all comments for an application
 * GET /api/reviews/comments/:applicationId
 */
router.get(
    "/comments/:applicationId",
    asyncHandler(async (req: Request, res: Response) => {
        const { applicationId } = req.params;
        const { includeInternal } = req.query;

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();

        let query = client
            .from("review_comments")
            .select("*")
            .eq("application_id", applicationId)
            .order("created_at", { ascending: true });

        if (includeInternal === "false") {
            query = query.eq("is_internal", false);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
        });
    })
);

/**
 * Resolve a comment
 * PATCH /api/reviews/comments/:commentId/resolve
 */
router.patch(
    "/comments/:commentId/resolve",
    asyncHandler(async (req: Request, res: Response) => {
        const { commentId } = req.params;
        const resolvedBy = req.user?.userId;

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();
        const { data, error } = await client
            .from("review_comments")
            .update({
                is_resolved: true,
                resolved_by: resolvedBy,
                resolved_at: new Date().toISOString(),
            })
            .eq("id", commentId)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: "Comment resolved",
            data,
        });
    })
);

// ============================================
// DOCUMENT REVIEWS
// ============================================

/**
 * Review a document
 * POST /api/reviews/documents
 */
router.post(
    "/documents",
    asyncHandler(async (req: Request, res: Response) => {
        const {
            applicationId,
            documentId,
            documentType,
            isVerified,
            isAuthentic,
            isLegible,
            isComplete,
            verificationStatus,
            issuesFound,
            verificationNotes,
            replacementRequired,
            additionalDocsNeeded,
        } = req.body;

        const reviewerId = req.user?.userId;

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();
        const { data, error } = await client
            .from("document_reviews")
            .insert({
                application_id: applicationId,
                document_id: documentId,
                reviewer_id: reviewerId,
                document_type: documentType,
                is_verified: isVerified,
                is_authentic: isAuthentic,
                is_legible: isLegible,
                is_complete: isComplete,
                verification_status: verificationStatus,
                issues_found: issuesFound,
                verification_notes: verificationNotes,
                replacement_required: replacementRequired,
                additional_docs_needed: additionalDocsNeeded,
                verified_at: isVerified ? new Date().toISOString() : null,
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: "Document review submitted",
            data,
        });
    })
);

/**
 * Get document reviews for an application
 * GET /api/reviews/documents/:applicationId
 */
router.get(
    "/documents/:applicationId",
    asyncHandler(async (req: Request, res: Response) => {
        const { applicationId } = req.params;

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();
        const { data, error } = await client
            .from("document_reviews")
            .select(
                `
                *,
                reviewer:admin_users!reviewer_id(name, email),
                document:documents(file_name, document_type)
            `
            )
            .eq("application_id", applicationId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
        });
    })
);

// ============================================
// EXPENSE VALIDATIONS
// ============================================

/**
 * Validate an expense
 * POST /api/reviews/expenses
 */
router.post(
    "/expenses",
    asyncHandler(async (req: Request, res: Response) => {
        const {
            applicationId,
            expenseId,
            originalAmount,
            validatedAmount,
            validationStatus,
            isWithinPolicy,
            isReceiptValid,
            isAmountReasonable,
            hasPriorApproval,
            adjustmentReason,
            rejectionReason,
            policyReference,
            appliedRateType,
            rateCalculationDetails,
        } = req.body;

        const validatorId = req.user?.userId;

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();
        const { data, error } = await client
            .from("expense_validations")
            .insert({
                application_id: applicationId,
                expense_id: expenseId,
                validator_id: validatorId,
                original_amount: originalAmount,
                validated_amount: validatedAmount,
                validation_status: validationStatus,
                is_within_policy: isWithinPolicy,
                is_receipt_valid: isReceiptValid,
                is_amount_reasonable: isAmountReasonable,
                has_prior_approval: hasPriorApproval,
                adjustment_reason: adjustmentReason,
                rejection_reason: rejectionReason,
                policy_reference: policyReference,
                applied_rate_type: appliedRateType,
                rate_calculation_details: rateCalculationDetails,
                validated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: "Expense validation submitted",
            data,
        });
    })
);

/**
 * Get expense validations for an application
 * GET /api/reviews/expenses/:applicationId
 */
router.get(
    "/expenses/:applicationId",
    asyncHandler(async (req: Request, res: Response) => {
        const { applicationId } = req.params;

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();
        const { data, error } = await client
            .from("expense_validations")
            .select(
                `
                *,
                validator:admin_users!validator_id(name, email),
                expense:expenses(description, bill_number, bill_date, category)
            `
            )
            .eq("application_id", applicationId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
        });
    })
);

// ============================================
// ELIGIBILITY CHECKS
// ============================================

/**
 * Perform eligibility check
 * POST /api/reviews/eligibility
 */
router.post(
    "/eligibility",
    asyncHandler(async (req: Request, res: Response) => {
        const {
            applicationId,
            isScStObcVerified,
            categoryProofValid,
            employeeIdVerified,
            medicalCardValid,
            relationshipVerified,
            hasPendingClaims,
            isWithinLimits,
            isTreatmentCovered,
            priorPermissionStatus,
            eligibilityStatus,
            ineligibilityReasons,
            conditions,
            notes,
        } = req.body;

        const checkerId = req.user?.userId;

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();
        const { data, error } = await client
            .from("eligibility_checks")
            .insert({
                application_id: applicationId,
                checker_id: checkerId,
                is_sc_st_obc_verified: isScStObcVerified,
                category_proof_valid: categoryProofValid,
                employee_id_verified: employeeIdVerified,
                medical_card_valid: medicalCardValid,
                relationship_verified: relationshipVerified,
                has_pending_claims: hasPendingClaims,
                is_within_limits: isWithinLimits,
                is_treatment_covered: isTreatmentCovered,
                prior_permission_status: priorPermissionStatus,
                eligibility_status: eligibilityStatus,
                ineligibility_reasons: ineligibilityReasons,
                conditions,
                notes,
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: "Eligibility check completed",
            data,
        });
    })
);

/**
 * Get eligibility check for an application
 * GET /api/reviews/eligibility/:applicationId
 */
router.get(
    "/eligibility/:applicationId",
    asyncHandler(async (req: Request, res: Response) => {
        const { applicationId } = req.params;

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();

        // Get eligibility check without join (to avoid schema cache issues)
        const { data, error } = await client
            .from("eligibility_checks")
            .select("*")
            .eq("application_id", applicationId)
            .order("checked_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error && error.code !== "PGRST116") {
            logger.error("Error fetching eligibility check:", error);
            throw error;
        }

        // If we have data, fetch checker info separately
        if (data && data.checker_id) {
            const { data: checker } = await client
                .from("admin_users")
                .select("name, email, role")
                .eq("id", data.checker_id)
                .single();
            
            if (checker) {
                data.checker = checker;
            }
        }

        res.json({
            success: true,
            data: data || null,
        });
    })
);

/**
 * Update (or upsert) eligibility check for an application
 * PATCH /api/reviews/eligibility/:applicationId
 */
router.patch(
    "/eligibility/:applicationId",
    asyncHandler(async (req: Request, res: Response) => {
        const { applicationId } = req.params;
        const {
            isScStObcVerified,
            categoryProofValid,
            employeeIdVerified,
            medicalCardValid,
            relationshipVerified,
            hasPendingClaims,
            isWithinLimits,
            isTreatmentCovered,
            priorPermissionStatus,
            eligibilityStatus,
            ineligibilityReasons,
            conditions,
            notes,
        } = req.body;

        const checkerId = req.user?.userId;

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getServiceClient(); // Use service client to bypass RLS

        // Validate that the application exists first
        const { data: application, error: appError } = await client
            .from("medical_applications")
            .select("id")
            .eq("id", applicationId)
            .maybeSingle();

        if (appError) {
            logger.error("Error checking application existence:", appError);
            throw new Error("Failed to verify application");
        }

        if (!application) {
            logger.warn(`Application ${applicationId} not found`);
            res.status(404).json({
                success: false,
                error: "Application not found. Please ensure the application exists before submitting a review.",
            });
            return;
        }

        // Find latest eligibility check for this application by this checker
        const { data: existing, error: fetchError } = await client
            .from("eligibility_checks")
            .select("*")
            .eq("application_id", applicationId)
            .eq("checker_id", checkerId)
            .order("checked_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (fetchError && fetchError.code !== "PGRST116") {
            logger.error("Error fetching existing eligibility check:", fetchError);
            throw fetchError;
        }

        if (!existing) {
            // No existing record -> insert
            const { data, error } = await client
                .from("eligibility_checks")
                .insert({
                    application_id: applicationId,
                    checker_id: checkerId,
                    is_sc_st_obc_verified: isScStObcVerified,
                    category_proof_valid: categoryProofValid,
                    employee_id_verified: employeeIdVerified,
                    medical_card_valid: medicalCardValid,
                    relationship_verified: relationshipVerified,
                    has_pending_claims: hasPendingClaims,
                    is_within_limits: isWithinLimits,
                    is_treatment_covered: isTreatmentCovered,
                    prior_permission_status: priorPermissionStatus,
                    eligibility_status: eligibilityStatus,
                    ineligibility_reasons: ineligibilityReasons || [],
                    conditions: conditions || [],
                    notes,
                })
                .select()
                .single();

            if (error) {
                logger.error("Error creating eligibility check:", error);
                throw error;
            }

            res.json({
                success: true,
                message: "Eligibility check created",
                data,
            });
            return;
        }

        // Update existing record
        const { data, error } = await client
            .from("eligibility_checks")
            .update({
                is_sc_st_obc_verified: isScStObcVerified,
                category_proof_valid: categoryProofValid,
                employee_id_verified: employeeIdVerified,
                medical_card_valid: medicalCardValid,
                relationship_verified: relationshipVerified,
                has_pending_claims: hasPendingClaims,
                is_within_limits: isWithinLimits,
                is_treatment_covered: isTreatmentCovered,
                prior_permission_status: priorPermissionStatus,
                eligibility_status: eligibilityStatus,
                ineligibility_reasons: ineligibilityReasons || [],
                conditions: conditions || [],
                notes,
                // updated_at removed - Supabase schema cache doesn't recognize it yet
            })
            .eq("id", existing.id)
            .select()
            .single();

        if (error) {
            logger.error("Error updating eligibility check:", error);
            throw error;
        }

        res.json({
            success: true,
            message: "Eligibility check updated",
            data,
        });
    })
);

// ============================================
// MEDICAL ASSESSMENTS
// ============================================

/**
 * Perform medical assessment
 * POST /api/reviews/medical
 */
router.post(
    "/medical",
    asyncHandler(async (req: Request, res: Response) => {
        const {
            applicationId,
            diagnosisVerified,
            treatmentAppropriate,
            prescriptionValid,
            hospitalEmpaneled,
            treatmentNecessity,
            treatmentDurationAppropriate,
            medicationPrescribedCorrectly,
            concernsRaised,
            requiresSecondOpinion,
            fraudIndicators,
            medicalOpinion,
            recommendedAction,
            alternativeTreatmentSuggested,
        } = req.body;

        const assessorId = req.user?.userId;

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();
        const { data, error } = await client
            .from("medical_assessments")
            .insert({
                application_id: applicationId,
                assessor_id: assessorId,
                diagnosis_verified: diagnosisVerified,
                treatment_appropriate: treatmentAppropriate,
                prescription_valid: prescriptionValid,
                hospital_empaneled: hospitalEmpaneled,
                treatment_necessity: treatmentNecessity,
                treatment_duration_appropriate: treatmentDurationAppropriate,
                medication_prescribed_correctly: medicationPrescribedCorrectly,
                concerns_raised: concernsRaised,
                requires_second_opinion: requiresSecondOpinion,
                fraud_indicators: fraudIndicators,
                medical_opinion: medicalOpinion,
                recommended_action: recommendedAction,
                alternative_treatment_suggested: alternativeTreatmentSuggested,
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: "Medical assessment completed",
            data,
        });
    })
);

/**
 * Get medical assessment for an application
 * GET /api/reviews/medical/:applicationId
 */
router.get(
    "/medical/:applicationId",
    asyncHandler(async (req: Request, res: Response) => {
        const { applicationId } = req.params;

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();
        const { data, error } = await client
            .from("medical_assessments")
            .select(
                `
                *,
                assessor:admin_users!assessor_id(name, email, role)
            `
            )
            .eq("application_id", applicationId)
            .order("assessed_at", { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== "PGRST116") throw error;

        res.json({
            success: true,
            data: data || null,
        });
    })
);

// ============================================
// REVIEW TIMELINE
// ============================================

/**
 * Get complete review timeline for an application
 * GET /api/reviews/timeline/:applicationId
 */
router.get(
    "/timeline/:applicationId",
    asyncHandler(async (req: Request, res: Response) => {
        const { applicationId } = req.params;

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();
        const { data, error } = await client
            .from("review_timeline")
            .select("*")
            .eq("application_id", applicationId)
            .order("created_at", { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
        });
    })
);

/**
 * Add manual timeline entry
 * POST /api/reviews/timeline
 */
router.post(
    "/timeline",
    asyncHandler(async (req: Request, res: Response) => {
        const {
            applicationId,
            actionType,
            actionDescription,
            previousStatus,
            newStatus,
            metadata,
        } = req.body;

        const actorId = req.user?.userId;
        const actorName = req.user?.name || "Unknown";
        const actorRole = req.user?.role || "admin";

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();
        const { data, error } = await client
            .from("review_timeline")
            .insert({
                application_id: applicationId,
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action_type: actionType,
                action_description: actionDescription,
                previous_status: previousStatus,
                new_status: newStatus,
                metadata,
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: "Timeline entry added",
            data,
        });
    })
);

// ============================================
// REVIEW ASSIGNMENTS
// ============================================

/**
 * Assign application for review
 * POST /api/reviews/assign
 */
router.post(
    "/assign",
    asyncHandler(async (req: Request, res: Response) => {
        const {
            applicationId,
            assignedTo,
            assignmentType,
            priority,
            dueDate,
            notes,
        } = req.body;

        const assignedBy = req.user?.userId;

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();
        const { data, error } = await client
            .from("review_assignments")
            .insert({
                application_id: applicationId,
                assigned_to: assignedTo,
                assigned_by: assignedBy,
                assignment_type: assignmentType,
                priority: priority || "normal",
                due_date: dueDate,
                notes,
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: "Review assigned successfully",
            data,
        });
    })
);

/**
 * Get pending reviews for a user
 * GET /api/reviews/my-assignments
 */
router.get(
    "/my-assignments",
    asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.userId;

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();
        const { data, error } = await client
            .from("pending_reviews")
            .select("*")
            .eq("assigned_to", userId);

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
        });
    })
);

/**
 * Update assignment status
 * PATCH /api/reviews/assignments/:assignmentId
 */
router.patch(
    "/assignments/:assignmentId",
    asyncHandler(async (req: Request, res: Response) => {
        const { assignmentId } = req.params;
        const { status } = req.body;

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();

        const updates: any = { status };

        if (status === "in_progress") {
            updates.started_at = new Date().toISOString();
        } else if (status === "completed") {
            updates.completed_at = new Date().toISOString();
        }

        const { data, error } = await client
            .from("review_assignments")
            .update(updates)
            .eq("id", assignmentId)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: "Assignment updated",
            data,
        });
    })
);

// ============================================
// REVIEW SUMMARY
// ============================================

/**
 * Get comprehensive review summary
 * GET /api/reviews/summary/:applicationId
 */
router.get(
    "/summary/:applicationId",
    asyncHandler(async (req: Request, res: Response) => {
        const { applicationId } = req.params;

        const db = await getDatabase();
        const client = (db as SupabaseConnection).getClient();
        const { data, error } = await client
            .from("application_review_summary")
            .select("*")
            .eq("application_id", applicationId)
            .single();

        if (error && error.code !== "PGRST116") throw error;

        res.json({
            success: true,
            data: data || null,
        });
    })
);

export default router;
