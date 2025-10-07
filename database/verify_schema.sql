-- Verification Script for Review System Schema
-- Run this AFTER deploying extensive_review_schema.sql

-- ============================================
-- 1. CHECK ALL TABLES EXIST
-- ============================================
SELECT 
    CASE 
        WHEN COUNT(*) = 8 THEN '✅ All 8 review tables created successfully'
        ELSE '❌ Missing tables! Expected 8, found ' || COUNT(*)
    END AS table_check,
    string_agg(table_name, ', ' ORDER BY table_name) AS tables_found
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'application_reviews',
    'review_comments',
    'document_reviews',
    'expense_validations',
    'eligibility_checks',
    'medical_assessments',
    'review_timeline',
    'review_assignments'
);

-- ============================================
-- 2. CHECK FOREIGN KEY REFERENCES
-- ============================================
SELECT 
    '✅ Foreign key check' AS status,
    tc.table_name AS from_table, 
    kcu.column_name AS from_column, 
    ccu.table_name AS references_table,
    ccu.column_name AS references_column 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN (
    'application_reviews',
    'review_comments',
    'document_reviews',
    'expense_validations',
    'eligibility_checks',
    'medical_assessments',
    'review_timeline',
    'review_assignments'
)
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 3. CHECK INDEXES
-- ============================================
SELECT 
    CASE 
        WHEN COUNT(*) >= 20 THEN '✅ All indexes created (' || COUNT(*) || ' found)'
        ELSE '⚠️ Some indexes might be missing (' || COUNT(*) || ' found)'
    END AS index_check
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'application_reviews',
    'review_comments',
    'document_reviews',
    'expense_validations',
    'eligibility_checks',
    'medical_assessments',
    'review_timeline',
    'review_assignments'
);

-- ============================================
-- 4. CHECK TRIGGERS
-- ============================================
SELECT 
    '✅ Trigger: ' || trigger_name AS status,
    event_object_table AS table_name,
    action_timing || ' ' || event_manipulation AS trigger_event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%review%'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 5. CHECK VIEWS
-- ============================================
SELECT 
    '✅ View: ' || table_name AS status,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('application_review_summary', 'pending_reviews');

-- ============================================
-- 6. CHECK FUNCTIONS
-- ============================================
SELECT 
    '✅ Function: ' || routine_name AS status,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('update_updated_at_column', 'create_review_timeline_entry');

-- ============================================
-- 7. SAMPLE DATA CHECK (Safe - no inserts)
-- ============================================

-- Check if we have any applications to work with
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Found ' || COUNT(*) || ' applications ready for review'
        ELSE '⚠️ No applications found in database'
    END AS application_check
FROM medical_applications;

-- Check if we have admin users
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Found ' || COUNT(*) || ' admin users'
        ELSE '❌ No admin users found! Need admin users for reviews'
    END AS admin_check
FROM admin_users;

-- ============================================
-- 8. PERMISSIONS CHECK
-- ============================================
SELECT 
    grantee,
    string_agg(DISTINCT privilege_type, ', ') AS privileges
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name IN (
    'application_reviews',
    'review_comments',
    'document_reviews',
    'expense_validations',
    'eligibility_checks',
    'medical_assessments',
    'review_timeline',
    'review_assignments'
)
GROUP BY grantee
ORDER BY grantee;

-- ============================================
-- 9. TABLE STRUCTURE VERIFICATION
-- ============================================

-- Check application_reviews structure
SELECT 
    'application_reviews' AS table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'application_reviews'
ORDER BY ordinal_position;

-- ============================================
-- FINAL SUMMARY
-- ============================================
SELECT 
    '✅ VERIFICATION COMPLETE' AS status,
    'Review system schema is ready to use!' AS message,
    NOW() AS verified_at;
