-- =====================================================================
-- FIX EVERYTHING - Complete Setup Script
-- =====================================================================
-- Run this ENTIRE script in Supabase SQL Editor
-- This fixes all known issues in one go
-- =====================================================================

-- =====================================================================
-- PART 1: Add missing enum values
-- =====================================================================
DO $$ 
BEGIN
    -- Add back_to_obc if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'application_status' AND e.enumlabel = 'back_to_obc'
    ) THEN
        ALTER TYPE application_status ADD VALUE 'back_to_obc';
    END IF;
    
    -- Add reimbursed if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'application_status' AND e.enumlabel = 'reimbursed'
    ) THEN
        ALTER TYPE application_status ADD VALUE 'reimbursed';
    END IF;
END $$;

-- =====================================================================
-- PART 2: Fix RLS Policies for medical_applications
-- =====================================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone can submit applications" ON medical_applications;
DROP POLICY IF EXISTS "Anyone can view applications" ON medical_applications;
DROP POLICY IF EXISTS "Service role full access" ON medical_applications;
DROP POLICY IF EXISTS "Allow update for all" ON medical_applications;
DROP POLICY IF EXISTS "Allow select for all" ON medical_applications;
DROP POLICY IF EXISTS "Allow insert for all" ON medical_applications;
DROP POLICY IF EXISTS "Allow delete for service role" ON medical_applications;

-- Create new permissive policies
CREATE POLICY "Allow select for all" ON medical_applications
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for all" ON medical_applications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for all" ON medical_applications
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete for service role" ON medical_applications
    FOR DELETE USING (auth.role() = 'service_role');

-- =====================================================================
-- PART 3: Update admin user passwords
-- =====================================================================

-- Password: obc123
UPDATE admin_users 
SET password = '$2b$10$RMcQI6Lshlk6KxnQWS4zB.btHC2wR2fCRgakDY4YFerAeZG8osmbW',
    is_active = true
WHERE email = 'obc@jnu.ac.in';

-- Password: health123
UPDATE admin_users 
SET password = '$2b$10$pCCfgO/l2Xmz/DKt8SzhQ.MsUWyJKLRkPoxNvolOZVH2Dl59KUwgW',
    is_active = true
WHERE email = 'health@jnu.ac.in';

-- Password: super123
UPDATE admin_users 
SET password = '$2b$10$n4HzRMA7Cwv4DEedc1TTAu1cam0NOVdN1/UN6G5nM/QuXlj4icdl2',
    is_active = true
WHERE email = 'admin@jnu.ac.in';

-- =====================================================================
-- PART 4: Verification
-- =====================================================================

-- Check enum values
SELECT '=== ✅ APPLICATION STATUS ENUM VALUES ===' as info;
SELECT unnest(enum_range(NULL::application_status))::text AS status_value
ORDER BY status_value;

-- Check RLS policies
SELECT '=== ✅ RLS POLICIES ON medical_applications ===' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'medical_applications'
ORDER BY policyname;

-- Check admin users
SELECT '=== ✅ ADMIN USERS ===' as info;
SELECT 
    email, 
    name, 
    role, 
    is_active,
    LEFT(password, 30) || '...' as password_preview,
    CASE 
        WHEN password IS NULL THEN '❌ No password'
        WHEN LENGTH(password) < 50 THEN '❌ Invalid hash'
        ELSE '✅ Password OK'
    END as status
FROM admin_users 
WHERE email IN ('obc@jnu.ac.in', 'health@jnu.ac.in', 'admin@jnu.ac.in')
ORDER BY email;

-- =====================================================================
-- SUCCESS! Expected Results:
-- =====================================================================
-- ✅ Enum values: pending, under_review, back_to_obc, approved, rejected, completed, reimbursed
-- ✅ RLS Policies: 4 policies (select, insert, update for all; delete for service role)
-- ✅ Admin users: All 3 active with valid password hashes
-- =====================================================================

-- =====================================================================
-- PART 5: Create Review Persistence Tables
-- =====================================================================
-- These tables store review states so they persist across workflow transitions

-- Table: eligibility_checks
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
    CONSTRAINT unique_application_checker_time UNIQUE (application_id, checker_id, checked_at)
);

CREATE INDEX IF NOT EXISTS idx_eligibility_checks_application ON eligibility_checks(application_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_checks_checker ON eligibility_checks(checker_id);

-- Add foreign key constraints after table creation
ALTER TABLE eligibility_checks 
    DROP CONSTRAINT IF EXISTS fk_eligibility_checks_application,
    DROP CONSTRAINT IF EXISTS fk_eligibility_checks_checker;

ALTER TABLE eligibility_checks 
    ADD CONSTRAINT fk_eligibility_checks_application 
        FOREIGN KEY (application_id) REFERENCES medical_applications(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_eligibility_checks_checker 
        FOREIGN KEY (checker_id) REFERENCES admin_users(id) ON DELETE CASCADE;

-- Table: document_reviews
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
    
    CONSTRAINT unique_document_reviewer UNIQUE (document_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_document_reviews_application ON document_reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_document_reviews_document ON document_reviews(document_id);
CREATE INDEX IF NOT EXISTS idx_document_reviews_reviewer ON document_reviews(reviewer_id);

-- Add foreign key constraints after table creation
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

-- Enable RLS on review tables
ALTER TABLE eligibility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on eligibility_checks" ON eligibility_checks;
DROP POLICY IF EXISTS "Allow all operations on document_reviews" ON document_reviews;

-- Permissive policies for all authenticated users
CREATE POLICY "Allow all operations on eligibility_checks" ON eligibility_checks
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on document_reviews" ON document_reviews
    FOR ALL USING (true) WITH CHECK (true);

-- Verify review tables created
SELECT '=== ✅ REVIEW PERSISTENCE TABLES ===' as info;
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('eligibility_checks', 'document_reviews')
ORDER BY table_name;

-- =====================================================================
-- ALL DONE! ✅
-- =====================================================================
-- Next steps:
-- 1. Restart backend: cd backend && npm run dev
-- 2. Test workflow: OBC review → forward → comes back → data preserved!
-- =====================================================================
