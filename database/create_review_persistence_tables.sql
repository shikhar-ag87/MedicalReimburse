-- ============================================
-- Review Persistence Tables
-- Creates tables to store review states that persist across workflow transitions
-- ============================================

-- Table: eligibility_checks
-- Stores eligibility check data from OBC/Health Centre reviews
CREATE TABLE IF NOT EXISTS eligibility_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    checker_id UUID NOT NULL,
    
    -- Category Verification
    is_sc_st_obc_verified BOOLEAN DEFAULT false,
    category_proof_valid BOOLEAN DEFAULT false,
    
    -- Employee Verification
    employee_id_verified BOOLEAN DEFAULT false,
    medical_card_valid BOOLEAN DEFAULT false,
    relationship_verified BOOLEAN DEFAULT false,
    
    -- Policy Compliance
    has_pending_claims BOOLEAN DEFAULT false,
    is_within_limits BOOLEAN DEFAULT true,
    is_treatment_covered BOOLEAN DEFAULT true,
    
    -- Prior Permission
    prior_permission_status TEXT CHECK (prior_permission_status IN ('required', 'obtained', 'not_required', 'pending')) DEFAULT 'not_required',
    
    -- Eligibility Decision
    eligibility_status TEXT CHECK (eligibility_status IN ('eligible', 'not_eligible', 'conditional')) DEFAULT 'eligible',
    ineligibility_reasons JSONB DEFAULT '[]'::jsonb,
    conditions JSONB DEFAULT '[]'::jsonb,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT unique_application_checker UNIQUE (application_id, checker_id, checked_at)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_eligibility_checks_application ON eligibility_checks(application_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_checks_checker ON eligibility_checks(checker_id);

-- Add foreign key constraints with explicit names for Supabase relationship detection
ALTER TABLE eligibility_checks 
    DROP CONSTRAINT IF EXISTS fk_eligibility_checks_application,
    DROP CONSTRAINT IF EXISTS fk_eligibility_checks_checker;

ALTER TABLE eligibility_checks 
    ADD CONSTRAINT fk_eligibility_checks_application 
        FOREIGN KEY (application_id) REFERENCES medical_applications(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_eligibility_checks_checker 
        FOREIGN KEY (checker_id) REFERENCES admin_users(id) ON DELETE CASCADE;

-- Table: document_reviews
-- Stores individual document review data
CREATE TABLE IF NOT EXISTS document_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    document_id UUID NOT NULL,
    reviewer_id UUID NOT NULL,
    
    -- Review Status
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'needs_clarification')) DEFAULT 'pending',
    document_type TEXT NOT NULL,
    
    -- Verification Checks
    is_authentic BOOLEAN DEFAULT true,
    is_complete BOOLEAN DEFAULT true,
    is_legible BOOLEAN DEFAULT true,
    
    -- Notes
    notes TEXT,
    rejection_reason TEXT,
    
    -- Timestamps
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one review per document per reviewer
    CONSTRAINT unique_document_reviewer UNIQUE (document_id, reviewer_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_document_reviews_application ON document_reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_document_reviews_document ON document_reviews(document_id);
CREATE INDEX IF NOT EXISTS idx_document_reviews_reviewer ON document_reviews(reviewer_id);

-- Add foreign key constraints with explicit names
ALTER TABLE document_reviews 
    DROP CONSTRAINT IF EXISTS fk_document_reviews_application,
    DROP CONSTRAINT IF EXISTS fk_document_reviews_document,
    DROP CONSTRAINT IF EXISTS fk_document_reviews_reviewer;

ALTER TABLE document_reviews 
    ADD CONSTRAINT fk_document_reviews_application 
        FOREIGN KEY (application_id) REFERENCES medical_applications(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_document_reviews_document 
        FOREIGN KEY (document_id) REFERENCES application_documents(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_document_reviews_reviewer 
        FOREIGN KEY (reviewer_id) REFERENCES admin_users(id) ON DELETE CASCADE;

-- Table: review_comments
-- Enhanced comments with workflow tracking (already exists, but ensuring it has right structure)
CREATE TABLE IF NOT EXISTS review_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES medical_applications(id) ON DELETE CASCADE,
    commenter_id UUID NOT NULL REFERENCES admin_users(id),
    commenter_name TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    comment_type TEXT CHECK (comment_type IN ('general', 'eligibility', 'document', 'clarification', 'approval', 'rejection')) DEFAULT 'general',
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_review_comments_application ON review_comments(application_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_commenter ON review_comments(commenter_id);

-- ============================================
-- RLS Policies for Review Tables
-- ============================================

-- Enable RLS on all review tables
ALTER TABLE eligibility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on eligibility_checks" ON eligibility_checks;
DROP POLICY IF EXISTS "Allow all operations on document_reviews" ON document_reviews;
DROP POLICY IF EXISTS "Allow all operations on review_comments" ON review_comments;

-- Permissive policies for all authenticated users
CREATE POLICY "Allow all operations on eligibility_checks" ON eligibility_checks
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on document_reviews" ON document_reviews
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on review_comments" ON review_comments
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to get latest eligibility check for an application
CREATE OR REPLACE FUNCTION get_latest_eligibility_check(app_id UUID)
RETURNS TABLE (
    id UUID,
    application_id UUID,
    checker_id UUID,
    checker_name TEXT,
    checker_role TEXT,
    is_sc_st_obc_verified BOOLEAN,
    category_proof_valid BOOLEAN,
    employee_id_verified BOOLEAN,
    medical_card_valid BOOLEAN,
    relationship_verified BOOLEAN,
    has_pending_claims BOOLEAN,
    is_within_limits BOOLEAN,
    is_treatment_covered BOOLEAN,
    prior_permission_status TEXT,
    eligibility_status TEXT,
    ineligibility_reasons JSONB,
    conditions JSONB,
    notes TEXT,
    checked_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ec.id,
        ec.application_id,
        ec.checker_id,
        au.name AS checker_name,
        au.role AS checker_role,
        ec.is_sc_st_obc_verified,
        ec.category_proof_valid,
        ec.employee_id_verified,
        ec.medical_card_valid,
        ec.relationship_verified,
        ec.has_pending_claims,
        ec.is_within_limits,
        ec.is_treatment_covered,
        ec.prior_permission_status,
        ec.eligibility_status,
        ec.ineligibility_reasons,
        ec.conditions,
        ec.notes,
        ec.checked_at
    FROM eligibility_checks ec
    JOIN admin_users au ON ec.checker_id = au.id
    WHERE ec.application_id = app_id
    ORDER BY ec.checked_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all document reviews for an application
CREATE OR REPLACE FUNCTION get_application_document_reviews(app_id UUID)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    reviewer_name TEXT,
    reviewer_role TEXT,
    status TEXT,
    document_type TEXT,
    is_authentic BOOLEAN,
    is_complete BOOLEAN,
    is_legible BOOLEAN,
    notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dr.id,
        dr.document_id,
        au.name AS reviewer_name,
        au.role AS reviewer_role,
        dr.status,
        dr.document_type,
        dr.is_authentic,
        dr.is_complete,
        dr.is_legible,
        dr.notes,
        dr.reviewed_at
    FROM document_reviews dr
    JOIN admin_users au ON dr.reviewer_id = au.id
    WHERE dr.application_id = app_id
    ORDER BY dr.reviewed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Verification Queries
-- ============================================

-- Verify tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('eligibility_checks', 'document_reviews', 'review_comments')
ORDER BY table_name;

-- Show sample structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('eligibility_checks', 'document_reviews')
ORDER BY table_name, ordinal_position
LIMIT 20;
