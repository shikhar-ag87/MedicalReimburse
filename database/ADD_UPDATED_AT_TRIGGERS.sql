-- ================================================================
-- FIX: Add updated_at trigger for eligibility_checks
-- ================================================================
-- This creates a trigger to automatically update the updated_at 
-- column whenever a row is modified
-- ================================================================

-- Step 1: Create the trigger function (if not exists)
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Add trigger to eligibility_checks
DROP TRIGGER IF EXISTS set_updated_at_eligibility_checks ON eligibility_checks;
CREATE TRIGGER set_updated_at_eligibility_checks
    BEFORE UPDATE ON eligibility_checks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- Step 3: Add trigger to document_reviews (if it has updated_at)
DROP TRIGGER IF EXISTS set_updated_at_document_reviews ON document_reviews;
CREATE TRIGGER set_updated_at_document_reviews
    BEFORE UPDATE ON document_reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- Step 4: Force schema cache refresh
NOTIFY pgrst, 'reload schema';

-- Verify triggers were created
SELECT 
    event_object_table as table_name,
    trigger_name,
    event_manipulation as event,
    action_statement as action
FROM information_schema.triggers
WHERE event_object_table IN ('eligibility_checks', 'document_reviews')
    AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;

SELECT 'Triggers added successfully! ✅' as status;
