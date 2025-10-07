-- ===============================================
-- Verification Queries After Schema Deployment
-- Run these in Supabase SQL Editor to verify everything is working
-- ===============================================

-- 1. CHECK ALL TABLES EXIST
-- Should return 8 rows (all review tables)
SELECT table_name, 
       (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
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
ORDER BY table_name;

-- 2. CHECK TRIGGERS EXIST
-- Should return 5 rows (automatic timeline triggers)
SELECT trigger_name, 
       event_object_table as table_name,
       action_timing,
       event_manipulation as event
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND trigger_name LIKE 'log_%timeline%'
ORDER BY trigger_name;

-- 3. CHECK VIEWS EXIST
-- Should return 2 rows (pending_reviews, application_review_summary)
SELECT table_name as view_name,
       view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
AND table_name IN ('pending_reviews', 'application_review_summary');

-- 4. TEST PENDING REVIEWS VIEW
-- Should return applications without reviews
SELECT application_id,
       employee_name,
       submitted_at,
       current_status
FROM pending_reviews
ORDER BY submitted_at DESC
LIMIT 10;

-- 5. CHECK LATEST REVIEW (from your test)
-- Should show the review created at 10:53:37
SELECT id as review_id,
       application_id,
       reviewer_id,
       reviewer_role,
       decision,
       created_at
FROM application_reviews
ORDER BY created_at DESC
LIMIT 1;

-- 6. VERIFY TIMELINE TRIGGER WORKED
-- Should show timeline entry for the review
SELECT event_type,
       performed_by,
       event_data,
       created_at
FROM review_timeline
ORDER BY created_at DESC
LIMIT 5;

-- 7. COUNT RECORDS IN EACH TABLE
-- Good for seeing which tables have data
SELECT 'application_reviews' as table_name, count(*) as records FROM application_reviews
UNION ALL
SELECT 'review_comments', count(*) FROM review_comments
UNION ALL
SELECT 'document_reviews', count(*) FROM document_reviews
UNION ALL
SELECT 'expense_validations', count(*) FROM expense_validations
UNION ALL
SELECT 'eligibility_checks', count(*) FROM eligibility_checks
UNION ALL
SELECT 'medical_assessments', count(*) FROM medical_assessments
UNION ALL
SELECT 'review_timeline', count(*) FROM review_timeline
UNION ALL
SELECT 'review_assignments', count(*) FROM review_assignments
ORDER BY table_name;

-- 8. CHECK FOREIGN KEY CONSTRAINTS
-- Ensures referential integrity is set up
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name LIKE '%review%'
ORDER BY tc.table_name, kcu.column_name;

-- 9. CHECK INDEXES
-- Ensures queries will be fast
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE '%review%'
ORDER BY tablename, indexname;

-- 10. TEST APPLICATION REVIEW SUMMARY VIEW
-- Shows comprehensive review statistics
SELECT *
FROM application_review_summary
LIMIT 5;

-- ===============================================
-- EXPECTED RESULTS AFTER DEPLOYMENT
-- ===============================================

-- Query 1: Should show 8 tables with varying column counts
-- Query 2: Should show 5 triggers (log_review_timeline, etc.)
-- Query 3: Should show 2 views
-- Query 4: Shows applications needing review
-- Query 5: Shows your test review (ID: 93bfe1ee-f936-4bc1-96df-582a6b86b736)
-- Query 6: Shows timeline entry for the review
-- Query 7: Shows record counts (application_reviews should have 1+)
-- Query 8: Shows foreign key relationships
-- Query 9: Shows indexes for performance
-- Query 10: Shows review summary statistics

-- ===============================================
-- TROUBLESHOOTING QUERIES
-- ===============================================

-- If tables missing, check if schema was run:
SELECT * FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%review%';

-- If triggers not firing, check trigger status:
SELECT * FROM pg_trigger WHERE tgname LIKE 'log_%';

-- If views not working, check view definition:
\d+ pending_reviews
\d+ application_review_summary

-- Check table structure:
\d application_reviews
\d review_comments
\d review_timeline

-- ===============================================
-- SAMPLE DATA QUERIES (After Testing)
-- ===============================================

-- See all reviews with reviewer details
SELECT 
    ar.id as review_id,
    ar.application_id,
    ar.decision,
    ar.reviewer_role,
    au.email as reviewer_email,
    ar.created_at
FROM application_reviews ar
JOIN admin_users au ON ar.reviewer_id = au.id
ORDER BY ar.created_at DESC;

-- See all comments on an application
SELECT 
    rc.comment_text,
    rc.is_internal,
    rc.is_resolved,
    au.email as commenter_email,
    rc.created_at
FROM review_comments rc
JOIN admin_users au ON rc.commenter_id = au.id
WHERE rc.application_id = 'YOUR-APPLICATION-ID'
ORDER BY rc.created_at DESC;

-- See complete timeline for an application
SELECT 
    event_type,
    event_data->>'decision' as decision,
    event_data->>'status' as status,
    performed_by,
    created_at
FROM review_timeline
WHERE application_id = 'YOUR-APPLICATION-ID'
ORDER BY created_at ASC;

-- ===============================================
-- CLEANUP QUERIES (Use with caution!)
-- ===============================================

-- Delete test data (ONLY if needed)
-- DELETE FROM application_reviews WHERE id = '93bfe1ee-f936-4bc1-96df-582a6b86b736';

-- Reset all review tables (DANGER: deletes all review data)
-- TRUNCATE TABLE application_reviews CASCADE;
-- TRUNCATE TABLE review_comments CASCADE;
-- TRUNCATE TABLE document_reviews CASCADE;
-- TRUNCATE TABLE expense_validations CASCADE;
-- TRUNCATE TABLE eligibility_checks CASCADE;
-- TRUNCATE TABLE medical_assessments CASCADE;
-- TRUNCATE TABLE review_timeline CASCADE;
-- TRUNCATE TABLE review_assignments CASCADE;
