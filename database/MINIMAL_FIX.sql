-- =====================================================================
-- MINIMAL FIX - Just Create the Tables
-- If FIX_EVERYTHING.sql is failing, use this minimal version
-- =====================================================================

-- Step 1: Create eligibility_checks table
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
    prior_permission_status TEXT DEFAULT 'not_required',
    eligibility_status TEXT DEFAULT 'eligible',
    ineligibility_reasons JSONB DEFAULT '[]',
    conditions JSONB DEFAULT '[]',
    notes TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create document_reviews table
CREATE TABLE IF NOT EXISTS document_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    document_id UUID NOT NULL,
    reviewer_id UUID NOT NULL,
    status TEXT DEFAULT 'pending',
    document_type TEXT NOT NULL,
    is_authentic BOOLEAN DEFAULT true,
    is_complete BOOLEAN DEFAULT true,
    is_legible BOOLEAN DEFAULT true,
    notes TEXT,
    rejection_reason TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add indexes
CREATE INDEX IF NOT EXISTS idx_eligibility_checks_application ON eligibility_checks(application_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_checks_checker ON eligibility_checks(checker_id);
CREATE INDEX IF NOT EXISTS idx_document_reviews_application ON document_reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_document_reviews_document ON document_reviews(document_id);
CREATE INDEX IF NOT EXISTS idx_document_reviews_reviewer ON document_reviews(reviewer_id);

-- Step 4: Enable RLS (Row Level Security)
ALTER TABLE eligibility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_reviews ENABLE ROW LEVEL SECURITY;

-- Step 5: Create permissive policies (allow everything)
DROP POLICY IF EXISTS "Allow all" ON eligibility_checks;
CREATE POLICY "Allow all" ON eligibility_checks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON document_reviews;
CREATE POLICY "Allow all" ON document_reviews FOR ALL USING (true) WITH CHECK (true);

-- Step 6: Verify tables exist
SELECT 
    'Tables created successfully!' as message,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('eligibility_checks', 'document_reviews')
ORDER BY table_name;
