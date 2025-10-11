-- ================================================================
-- REFRESH SUPABASE SCHEMA CACHE
-- ================================================================
-- Run this when you get errors like:
-- "Could not find the 'column_name' column of 'table_name' in the schema cache"
--
-- This forces Supabase to reload its PostgREST schema cache
-- ================================================================

-- Method 1: Use NOTIFY to trigger schema reload
NOTIFY pgrst, 'reload schema';

-- Method 2: Touch the table to force cache invalidation
-- (Comment triggers an ALTER without changing structure)
COMMENT ON TABLE eligibility_checks IS 'Stores eligibility check data for review persistence - Updated at ' || NOW()::TEXT;
COMMENT ON TABLE document_reviews IS 'Stores document review data for review persistence - Updated at ' || NOW()::TEXT;

-- Method 3: Grant permissions again (forces cache refresh)
GRANT SELECT, INSERT, UPDATE, DELETE ON eligibility_checks TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_reviews TO anon, authenticated;

-- Verify the columns exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('eligibility_checks', 'document_reviews')
    AND column_name LIKE '%updated_at%'
ORDER BY table_name, ordinal_position;

-- Show the actual table structure
SELECT 
    table_name,
    COUNT(*) as column_count,
    array_agg(column_name ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_name IN ('eligibility_checks', 'document_reviews')
GROUP BY table_name;
