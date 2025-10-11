-- ============================================
-- DIAGNOSTIC: Check Application Existence
-- Run this to debug the foreign key constraint violation
-- ============================================

-- 1. Check if the specific application exists
SELECT 
    'Checking Application' as step,
    id,
    application_number,
    status,
    employee_name,
    submitted_at
FROM medical_applications
WHERE id = 'ab6e3d2c-40de-437e-bb24-0cc952b00704'::uuid;

-- If the above returns no rows, the application doesn't exist!

-- 2. List all existing applications (last 10)
SELECT 
    '=== EXISTING APPLICATIONS ===' as info;

SELECT 
    id,
    application_number,
    status,
    employee_name,
    submitted_at,
    updated_at
FROM medical_applications
ORDER BY submitted_at DESC
LIMIT 10;

-- 3. Check if there are any eligibility checks
SELECT 
    '=== EXISTING ELIGIBILITY CHECKS ===' as info;

SELECT 
    ec.id,
    ec.application_id,
    ma.application_number,
    au.name as checker_name,
    ec.eligibility_status,
    ec.checked_at
FROM eligibility_checks ec
LEFT JOIN medical_applications ma ON ec.application_id = ma.id
LEFT JOIN admin_users au ON ec.checker_id = au.id
ORDER BY ec.checked_at DESC
LIMIT 5;

-- 4. Check for orphaned records (eligibility checks with no application)
SELECT 
    '=== ORPHANED CHECKS (IF ANY) ===' as info;

SELECT 
    ec.id,
    ec.application_id,
    ec.checker_id,
    ec.checked_at,
    'Application missing!' as status
FROM eligibility_checks ec
LEFT JOIN medical_applications ma ON ec.application_id = ma.id
WHERE ma.id IS NULL;

-- ============================================
-- SOLUTION OPTIONS
-- ============================================

-- Option 1: If application was deleted, clean up orphaned checks
-- DELETE FROM eligibility_checks 
-- WHERE application_id NOT IN (SELECT id FROM medical_applications);

-- Option 2: If you need to test with a specific application, use an existing ID
-- Run this to get a valid application ID:
SELECT 
    '=== USE ONE OF THESE APPLICATION IDs FOR TESTING ===' as info;

SELECT 
    id,
    application_number,
    status,
    employee_name
FROM medical_applications
WHERE status IN ('pending', 'under_review', 'back_to_obc')
ORDER BY submitted_at DESC
LIMIT 5;
