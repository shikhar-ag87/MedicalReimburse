-- Extensive Review System Schema for Medical Reimbursement
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. APPLICATION REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS application_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES medical_applications(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES admin_users(id),
    reviewer_role VARCHAR(50) NOT NULL, -- 'obc_cell', 'health_centre', 'super_admin'
    review_stage VARCHAR(50) NOT NULL, -- 'eligibility', 'medical', 'final'
    
    -- Overall decision
    decision VARCHAR(20) NOT NULL, -- 'approved', 'rejected', 'needs_clarification', 'pending'
    
    -- Detailed review fields
    eligibility_verified BOOLEAN DEFAULT false,
    documents_verified BOOLEAN DEFAULT false,
    medical_validity_checked BOOLEAN DEFAULT false,
    expenses_validated BOOLEAN DEFAULT false,
    
    -- Scoring system (optional)
    completeness_score INTEGER CHECK (completeness_score >= 0 AND completeness_score <= 100),
    document_quality_score INTEGER CHECK (document_quality_score >= 0 AND document_quality_score <= 100),
    
    -- Review details
    review_notes TEXT,
    internal_remarks TEXT, -- Not visible to employee
    rejection_reasons TEXT[],
    clarification_needed TEXT[],
    
    -- Timestamps
    review_started_at TIMESTAMPTZ DEFAULT NOW(),
    review_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_reviews_application ON application_reviews(application_id);
CREATE INDEX idx_app_reviews_reviewer ON application_reviews(reviewer_id);
CREATE INDEX idx_app_reviews_stage ON application_reviews(review_stage);

-- ============================================
-- 2. REVIEW COMMENTS TABLE (Thread-based discussions)
-- ============================================
CREATE TABLE IF NOT EXISTS review_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES medical_applications(id) ON DELETE CASCADE,
    review_id UUID REFERENCES application_reviews(id) ON DELETE CASCADE,
    
    commenter_id UUID NOT NULL REFERENCES admin_users(id),
    commenter_name VARCHAR(255) NOT NULL,
    commenter_role VARCHAR(50) NOT NULL,
    
    comment_type VARCHAR(50) NOT NULL, -- 'general', 'question', 'concern', 'recommendation'
    comment_text TEXT NOT NULL,
    
    -- Thread support
    parent_comment_id UUID REFERENCES review_comments(id) ON DELETE CASCADE,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES admin_users(id),
    resolved_at TIMESTAMPTZ,
    
    -- Visibility
    is_internal BOOLEAN DEFAULT true, -- If false, visible to employee
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_comments_application ON review_comments(application_id);
CREATE INDEX idx_review_comments_review ON review_comments(review_id);
CREATE INDEX idx_review_comments_parent ON review_comments(parent_comment_id);

-- ============================================
-- 3. DOCUMENT REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS document_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES medical_applications(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES application_documents(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES admin_users(id),
    
    -- Document verification
    document_type VARCHAR(100) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    is_authentic BOOLEAN,
    is_legible BOOLEAN,
    is_complete BOOLEAN,
    
    -- Issues found
    verification_status VARCHAR(50) NOT NULL, -- 'approved', 'rejected', 'needs_replacement', 'needs_clarification'
    issues_found TEXT[],
    verification_notes TEXT,
    
    -- Required actions
    replacement_required BOOLEAN DEFAULT false,
    additional_docs_needed TEXT[],
    
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doc_reviews_application ON document_reviews(application_id);
CREATE INDEX idx_doc_reviews_document ON document_reviews(document_id);
CREATE INDEX idx_doc_reviews_status ON document_reviews(verification_status);

-- ============================================
-- 4. EXPENSE VALIDATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expense_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES medical_applications(id) ON DELETE CASCADE,
    expense_id UUID NOT NULL REFERENCES expense_items(id) ON DELETE CASCADE,
    validator_id UUID NOT NULL REFERENCES admin_users(id),
    
    -- Expense details
    original_amount DECIMAL(10, 2) NOT NULL,
    validated_amount DECIMAL(10, 2),
    adjustment_amount DECIMAL(10, 2) GENERATED ALWAYS AS (original_amount - COALESCE(validated_amount, original_amount)) STORED,
    
    -- Validation status
    validation_status VARCHAR(50) NOT NULL, -- 'approved', 'partially_approved', 'rejected', 'under_review'
    
    -- Validation criteria
    is_within_policy BOOLEAN,
    is_receipt_valid BOOLEAN,
    is_amount_reasonable BOOLEAN,
    has_prior_approval BOOLEAN,
    
    -- Detailed reasons
    adjustment_reason TEXT,
    rejection_reason TEXT,
    policy_reference TEXT, -- e.g., "As per JNU Medical Policy Section 4.2"
    
    -- Rate applied
    applied_rate_type VARCHAR(100), -- 'govt_rate', 'market_rate', 'empaneled_hospital', 'cghs_rate'
    rate_calculation_details TEXT,
    
    validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expense_validations_application ON expense_validations(application_id);
CREATE INDEX idx_expense_validations_expense ON expense_validations(expense_id);
CREATE INDEX idx_expense_validations_status ON expense_validations(validation_status);

-- ============================================
-- 5. ELIGIBILITY CHECKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS eligibility_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES medical_applications(id) ON DELETE CASCADE,
    checker_id UUID NOT NULL REFERENCES admin_users(id),
    
    -- Eligibility criteria
    is_sc_st_obc_verified BOOLEAN,
    category_proof_valid BOOLEAN,
    employee_id_verified BOOLEAN,
    medical_card_valid BOOLEAN,
    relationship_verified BOOLEAN, -- For dependent claims
    
    -- Additional checks
    has_pending_claims BOOLEAN,
    is_within_limits BOOLEAN, -- Annual/treatment limits
    is_treatment_covered BOOLEAN,
    prior_permission_status VARCHAR(50), -- 'required', 'obtained', 'not_required', 'pending'
    
    -- Results
    eligibility_status VARCHAR(50) NOT NULL, -- 'eligible', 'not_eligible', 'conditional'
    ineligibility_reasons TEXT[],
    conditions TEXT[],
    notes TEXT,
    
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_eligibility_checks_application ON eligibility_checks(application_id);

-- ============================================
-- 6. MEDICAL ASSESSMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS medical_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES medical_applications(id) ON DELETE CASCADE,
    assessor_id UUID NOT NULL REFERENCES admin_users(id),
    
    -- Medical review
    diagnosis_verified BOOLEAN,
    treatment_appropriate BOOLEAN,
    prescription_valid BOOLEAN,
    hospital_empaneled BOOLEAN,
    
    -- Clinical assessment
    treatment_necessity VARCHAR(50), -- 'essential', 'necessary', 'elective', 'cosmetic'
    treatment_duration_appropriate BOOLEAN,
    medication_prescribed_correctly BOOLEAN,
    
    -- Red flags
    concerns_raised TEXT[],
    requires_second_opinion BOOLEAN DEFAULT false,
    fraud_indicators TEXT[],
    
    -- Medical opinion
    medical_opinion TEXT,
    recommended_action VARCHAR(50), -- 'approve', 'reject', 'refer_specialist', 'request_clarification'
    alternative_treatment_suggested TEXT,
    
    assessed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medical_assessments_application ON medical_assessments(application_id);

-- ============================================
-- 7. REVIEW TIMELINE TABLE (Complete audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS review_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES medical_applications(id) ON DELETE CASCADE,
    
    actor_id UUID REFERENCES admin_users(id),
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    
    action_type VARCHAR(100) NOT NULL, -- 'submitted', 'assigned', 'reviewed', 'commented', 'status_changed', 'document_verified', 'expense_validated'
    action_description TEXT NOT NULL,
    
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    
    metadata JSONB, -- Additional context
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_timeline_application ON review_timeline(application_id);
CREATE INDEX idx_review_timeline_actor ON review_timeline(actor_id);
CREATE INDEX idx_review_timeline_created ON review_timeline(created_at DESC);

-- ============================================
-- 8. REVIEW ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS review_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES medical_applications(id) ON DELETE CASCADE,
    
    assigned_to UUID NOT NULL REFERENCES admin_users(id),
    assigned_by UUID REFERENCES admin_users(id),
    assignment_type VARCHAR(50) NOT NULL, -- 'primary', 'secondary', 'specialist'
    
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    due_date DATE,
    
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'reassigned'
    
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    notes TEXT
);

CREATE INDEX idx_review_assignments_application ON review_assignments(application_id);
CREATE INDEX idx_review_assignments_assignee ON review_assignments(assigned_to);
CREATE INDEX idx_review_assignments_status ON review_assignments(status);

-- ============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_application_reviews_updated_at BEFORE UPDATE ON application_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_review_comments_updated_at BEFORE UPDATE ON review_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_reviews_updated_at BEFORE UPDATE ON document_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expense_validations_updated_at BEFORE UPDATE ON expense_validations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create timeline entry on review creation
CREATE OR REPLACE FUNCTION create_review_timeline_entry()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO review_timeline (
        application_id,
        actor_id,
        actor_name,
        actor_role,
        action_type,
        action_description,
        previous_status,
        new_status
    ) VALUES (
        NEW.application_id,
        NEW.reviewer_id,
        (SELECT name FROM admin_users WHERE id = NEW.reviewer_id),
        NEW.reviewer_role,
        'reviewed',
        'Review ' || NEW.decision || ' at ' || NEW.review_stage || ' stage',
        OLD.decision,
        NEW.decision
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER auto_create_review_timeline AFTER INSERT OR UPDATE ON application_reviews FOR EACH ROW EXECUTE FUNCTION create_review_timeline_entry();

-- ============================================
-- VIEWS FOR EASY QUERYING
-- ============================================

-- Complete review summary view
CREATE OR REPLACE VIEW application_review_summary AS
SELECT 
    a.id AS application_id,
    a.application_number,
    a.status AS current_status,
    
    -- Review counts
    COUNT(DISTINCT ar.id) AS total_reviews,
    COUNT(DISTINCT CASE WHEN ar.decision = 'approved' THEN ar.id END) AS approved_reviews,
    COUNT(DISTINCT CASE WHEN ar.decision = 'rejected' THEN ar.id END) AS rejected_reviews,
    
    -- Document verification
    COUNT(DISTINCT dr.id) AS total_documents_reviewed,
    COUNT(DISTINCT CASE WHEN dr.is_verified = true THEN dr.id END) AS documents_verified,
    
    -- Expense validation
    COUNT(DISTINCT ev.id) AS total_expenses_validated,
    SUM(COALESCE(ev.validated_amount, 0)) AS total_validated_amount,
    
    -- Comments
    COUNT(DISTINCT rc.id) AS total_comments,
    COUNT(DISTINCT CASE WHEN rc.is_resolved = false THEN rc.id END) AS unresolved_comments,
    
    -- Assignments
    COUNT(DISTINCT ra.id) AS total_assignments,
    COUNT(DISTINCT CASE WHEN ra.status = 'completed' THEN ra.id END) AS completed_assignments,
    
    -- Latest review
    MAX(ar.review_completed_at) AS last_reviewed_at
    
FROM medical_applications a
LEFT JOIN application_reviews ar ON a.id = ar.application_id
LEFT JOIN document_reviews dr ON a.id = dr.application_id
LEFT JOIN expense_validations ev ON a.id = ev.application_id
LEFT JOIN review_comments rc ON a.id = rc.application_id
LEFT JOIN review_assignments ra ON a.id = ra.application_id

GROUP BY a.id, a.application_number, a.status;

-- Pending reviews view
CREATE OR REPLACE VIEW pending_reviews AS
SELECT 
    ra.id AS assignment_id,
    a.id AS application_id,
    a.application_number,
    a.employee_name,
    a.status,
    ra.assigned_to,
    au.name AS reviewer_name,
    au.role AS reviewer_role,
    ra.priority,
    ra.due_date,
    ra.assigned_at,
    EXTRACT(DAY FROM (NOW() - ra.assigned_at)) AS days_pending
FROM review_assignments ra
JOIN medical_applications a ON ra.application_id = a.id
JOIN admin_users au ON ra.assigned_to = au.id
WHERE ra.status IN ('pending', 'in_progress')
ORDER BY ra.priority DESC, ra.assigned_at ASC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON application_review_summary, pending_reviews TO authenticated;

-- Success message
SELECT 'Extensive review system schema created successfully! ✅' AS status;
