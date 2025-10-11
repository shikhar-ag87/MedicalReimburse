-- =====================================================================
-- SIMPLIFIED SETUP SCRIPT - Run in Parts
-- =====================================================================
-- If FIX_EVERYTHING.sql fails, run this script instead
-- It breaks everything into smaller chunks that are easier to debug
-- =====================================================================

-- =====================================================================
-- STEP 1: Add Enum Values
-- Run this section first, check for errors before continuing
-- =====================================================================

-- Add back_to_obc
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'application_status' AND e.enumlabel = 'back_to_obc'
    ) THEN
        ALTER TYPE application_status ADD VALUE 'back_to_obc';
        RAISE NOTICE '✅ Added back_to_obc status';
    ELSE
        RAISE NOTICE 'ℹ️  back_to_obc already exists';
    END IF;
END $$;

-- Add reimbursed
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'application_status' AND e.enumlabel = 'reimbursed'
    ) THEN
        ALTER TYPE application_status ADD VALUE 'reimbursed';
        RAISE NOTICE '✅ Added reimbursed status';
    ELSE
        RAISE NOTICE 'ℹ️  reimbursed already exists';
    END IF;
END $$;

-- Verify enum values
SELECT '=== STEP 1 COMPLETE: Enum Values ===' as status;
SELECT unnest(enum_range(NULL::application_status))::text AS status_value;

-- =====================================================================
-- STEP 2: Fix RLS Policies
-- Run after Step 1 succeeds
-- =====================================================================

-- Drop existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can submit applications" ON medical_applications;
    DROP POLICY IF EXISTS "Anyone can view applications" ON medical_applications;
    DROP POLICY IF EXISTS "Service role full access" ON medical_applications;
    DROP POLICY IF EXISTS "Allow update for all" ON medical_applications;
    DROP POLICY IF EXISTS "Allow select for all" ON medical_applications;
    DROP POLICY IF EXISTS "Allow insert for all" ON medical_applications;
    DROP POLICY IF EXISTS "Allow delete for service role" ON medical_applications;
    RAISE NOTICE '✅ Dropped old policies';
END $$;

-- Create new policies
CREATE POLICY "Allow select for all" ON medical_applications
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for all" ON medical_applications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for all" ON medical_applications
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete for service role" ON medical_applications
    FOR DELETE USING (auth.role() = 'service_role');

-- Verify policies
SELECT '=== STEP 2 COMPLETE: RLS Policies ===' as status;
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'medical_applications';

-- =====================================================================
-- STEP 3: Update Admin Passwords
-- Run after Step 2 succeeds
-- =====================================================================

-- Update passwords
UPDATE admin_users 
SET password = '$2b$10$RMcQI6Lshlk6KxnQWS4zB.btHC2wR2fCRgakDY4YFerAeZG8osmbW',
    is_active = true
WHERE email = 'obc@jnu.ac.in';

UPDATE admin_users 
SET password = '$2b$10$pCCfgO/l2Xmz/DKt8SzhQ.MsUWyJKLRkPoxNvolOZVH2Dl59KUwgW',
    is_active = true
WHERE email = 'health@jnu.ac.in';

UPDATE admin_users 
SET password = '$2b$10$n4HzRMA7Cwv4DEedc1TTAu1cam0NOVdN1/UN6G5nM/QuXlj4icdl2',
    is_active = true
WHERE email = 'admin@jnu.ac.in';

-- Verify passwords
SELECT '=== STEP 3 COMPLETE: Admin Users ===' as status;
SELECT email, name, role, is_active,
    CASE 
        WHEN password IS NULL THEN '❌ No password'
        WHEN LENGTH(password) < 50 THEN '❌ Invalid'
        ELSE '✅ OK'
    END as password_status
FROM admin_users 
WHERE email IN ('obc@jnu.ac.in', 'health@jnu.ac.in', 'admin@jnu.ac.in');

-- =====================================================================
-- STEP 4: Create eligibility_checks Table
-- Run after Step 3 succeeds
-- =====================================================================

-- Create table
CREATE TABLE IF NOT EXISTS eligibility_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    checker_id UUID NOT NULL,
    is_sc_st_obc_verified BOOLEAN DEFAULT false,
    category_proof_valid BOOLEAN DEFAULT false,
    employee_id_verified BOOLEAN DEFAULT false,
    medical_card_valid BOOLEAN DEFAULT false,
    relationship_verified BOOLEAN DEFAULT false,
    has_pending_claims BOOLEAN DEFAULT false,
    is_within_limits BOOLEAN DEFAULT true,
    is_treatment_covered BOOLEAN DEFAULT true,
    prior_permission_status TEXT CHECK (prior_permission_status IN ('required', 'obtained', 'not_required', 'pending')) DEFAULT 'not_required',
    eligibility_status TEXT CHECK (eligibility_status IN ('eligible', 'not_eligible', 'conditional')) DEFAULT 'eligible',
    ineligibility_reasons JSONB DEFAULT '[]'::jsonb,
    conditions JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_application_checker_time UNIQUE (application_id, checker_id, checked_at)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_eligibility_checks_application ON eligibility_checks(application_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_checks_checker ON eligibility_checks(checker_id);

-- Add foreign keys
ALTER TABLE eligibility_checks 
    DROP CONSTRAINT IF EXISTS fk_eligibility_checks_application,
    DROP CONSTRAINT IF EXISTS fk_eligibility_checks_checker;

ALTER TABLE eligibility_checks 
    ADD CONSTRAINT fk_eligibility_checks_application 
        FOREIGN KEY (application_id) REFERENCES medical_applications(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_eligibility_checks_checker 
        FOREIGN KEY (checker_id) REFERENCES admin_users(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE eligibility_checks ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Allow all operations on eligibility_checks" ON eligibility_checks;
CREATE POLICY "Allow all operations on eligibility_checks" ON eligibility_checks
    FOR ALL USING (true) WITH CHECK (true);

-- Verify table
SELECT '=== STEP 4 COMPLETE: eligibility_checks ===' as status;
SELECT COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'eligibility_checks';

-- =====================================================================
-- STEP 5: Create document_reviews Table
-- Run after Step 4 succeeds
-- =====================================================================

-- Create table
CREATE TABLE IF NOT EXISTS document_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    document_id UUID NOT NULL,
    reviewer_id UUID NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'needs_clarification')) DEFAULT 'pending',
    document_type TEXT NOT NULL,
    is_authentic BOOLEAN DEFAULT true,
    is_complete BOOLEAN DEFAULT true,
    is_legible BOOLEAN DEFAULT true,
    notes TEXT,
    rejection_reason TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_document_reviewer UNIQUE (document_id, reviewer_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_reviews_application ON document_reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_document_reviews_document ON document_reviews(document_id);
CREATE INDEX IF NOT EXISTS idx_document_reviews_reviewer ON document_reviews(reviewer_id);

-- Add foreign keys
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

-- Enable RLS
ALTER TABLE document_reviews ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Allow all operations on document_reviews" ON document_reviews;
CREATE POLICY "Allow all operations on document_reviews" ON document_reviews
    FOR ALL USING (true) WITH CHECK (true);

-- Verify table
SELECT '=== STEP 5 COMPLETE: document_reviews ===' as status;
SELECT COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'document_reviews';

-- =====================================================================
-- FINAL VERIFICATION
-- =====================================================================

SELECT '=== ✅ ALL STEPS COMPLETE ===' as status;

-- Check all tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('medical_applications', 'eligibility_checks', 'document_reviews')
ORDER BY table_name;

-- Check foreign keys
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name IN ('eligibility_checks', 'document_reviews')
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- =====================================================================
-- DONE! 🎉
-- =====================================================================
-- If all steps completed without errors, restart your backend:
-- cd /home/aloo/MedicalReimburse/backend && npm run dev
-- =====================================================================
