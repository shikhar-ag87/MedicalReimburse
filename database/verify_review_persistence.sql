-- ============================================
-- VERIFICATION SCRIPT
-- Run this AFTER running create_review_persistence_tables.sql
-- ============================================

-- 1. Check if all tables exist
SELECT 
    'Tables Check' as test_name,
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ PASS - All 3 tables exist'
        ELSE '❌ FAIL - Missing tables'
    END as result,
    STRING_AGG(table_name, ', ') as tables_found
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name IN ('eligibility_checks', 'document_reviews', 'review_comments');

-- 2. Check column counts
SELECT 
    'Column Counts' as test_name,
    table_name,
    COUNT(*) as column_count,
    CASE 
        WHEN table_name = 'eligibility_checks' AND COUNT(*) >= 18 THEN '✅ PASS'
        WHEN table_name = 'document_reviews' AND COUNT(*) >= 12 THEN '✅ PASS'
        WHEN table_name = 'review_comments' AND COUNT(*) >= 8 THEN '✅ PASS'
        ELSE '⚠️ CHECK'
    END as result
FROM information_schema.columns
WHERE table_name IN ('eligibility_checks', 'document_reviews', 'review_comments')
GROUP BY table_name
ORDER BY table_name;

-- 3. Check RLS is enabled
SELECT 
    'RLS Enabled' as test_name,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ PASS'
        ELSE '❌ FAIL - RLS not enabled'
    END as result
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('eligibility_checks', 'document_reviews', 'review_comments');

-- 4. Check policies exist
SELECT 
    'RLS Policies' as test_name,
    tablename,
    policyname,
    permissive,
    '✅ PASS' as result
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('eligibility_checks', 'document_reviews', 'review_comments')
ORDER BY tablename, policyname;

-- 5. Check foreign key constraints
SELECT 
    'Foreign Keys' as test_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✅ PASS' as result
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('eligibility_checks', 'document_reviews')
ORDER BY tc.table_name, kcu.column_name;

-- 6. Check helper functions exist
SELECT 
    'Helper Functions' as test_name,
    routine_name,
    routine_type,
    '✅ PASS' as result
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_latest_eligibility_check', 'get_application_document_reviews');

-- 7. Test inserting a sample eligibility check (will rollback)
BEGIN;
    -- Try to insert (will fail if columns don't exist)
    INSERT INTO eligibility_checks (
        application_id,
        checker_id,
        is_sc_st_obc_verified,
        category_proof_valid,
        employee_id_verified,
        medical_card_valid,
        relationship_verified,
        has_pending_claims,
        is_within_limits,
        is_treatment_covered,
        prior_permission_status,
        eligibility_status,
        notes
    ) VALUES (
        '00000000-0000-0000-0000-000000000001'::uuid,
        '00000000-0000-0000-0000-000000000002'::uuid,
        true,
        true,
        true,
        true,
        false,
        false,
        true,
        true,
        'not_required',
        'eligible',
        'Test verification insert'
    );
    
    SELECT 'Insert Test' as test_name, '✅ PASS - Insert works' as result;
ROLLBACK;

-- ============================================
-- FINAL SUMMARY
-- ============================================
SELECT 
    '===================' as divider,
    'VERIFICATION SUMMARY' as title,
    '===================' as divider2;

-- Count checks
SELECT 
    'Total Checks' as metric,
    'Should see ~15-20 rows above with ✅ PASS' as expected_result;

-- If you see any ❌ FAIL, re-run create_review_persistence_tables.sql
SELECT 
    'Next Step' as action,
    'If all PASS → Restart backend → Test the workflow' as instruction;

-- Show table sizes (should be 0 initially)
SELECT 
    'eligibility_checks' as table_name,
    COUNT(*) as row_count,
    '(should be 0 initially)' as note
FROM eligibility_checks
UNION ALL
SELECT 
    'document_reviews',
    COUNT(*),
    '(should be 0 initially)'
FROM document_reviews
UNION ALL
SELECT 
    'review_comments',
    COUNT(*),
    '(may have existing data)'
FROM review_comments;
