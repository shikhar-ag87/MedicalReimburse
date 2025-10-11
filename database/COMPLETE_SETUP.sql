-- =====================================================================
-- COMPLETE SETUP SCRIPT - Run this in Supabase SQL Editor
-- =====================================================================
-- This script does 3 things:
-- 1. Adds missing enum values (back_to_obc, reimbursed)
-- 2. Updates admin user passwords
-- 3. Verifies everything is set up correctly
-- =====================================================================

-- STEP 1: Add missing enum values
-- =====================================================================
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'back_to_obc';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'reimbursed';

-- STEP 2: Update admin user passwords with fresh hashes
-- =====================================================================
-- Password: obc123
UPDATE users SET password = '$2b$10$RMcQI6Lshlk6KxnQWS4zB.btHC2wR2fCRgakDY4YFerAeZG8osmbW' 
WHERE email = 'obc@jnu.ac.in';

-- Password: health123
UPDATE users SET password = '$2b$10$pCCfgO/l2Xmz/DKt8SzhQ.MsUWyJKLRkPoxNvolOZVH2Dl59KUwgW' 
WHERE email = 'health@jnu.ac.in';

-- Password: super123
UPDATE users SET password = '$2b$10$n4HzRMA7Cwv4DEedc1TTAu1cam0NOVdN1/UN6G5nM/QuXlj4icdl2' 
WHERE email = 'admin@jnu.ac.in';

-- STEP 3: Verification Queries
-- =====================================================================

-- Check enum values
SELECT '=== APPLICATION STATUS ENUM VALUES ===' as info;
SELECT unnest(enum_range(NULL::application_status))::text AS status_value;

-- Check admin users
SELECT '=== ADMIN USERS ===' as info;
SELECT 
    email, 
    name, 
    role, 
    is_active,
    LEFT(password, 30) || '...' as password_hash,
    CASE 
        WHEN password IS NULL THEN '❌ No password set'
        WHEN LENGTH(password) < 50 THEN '❌ Invalid hash'
        ELSE '✅ Password set'
    END as password_status
FROM users 
WHERE email IN ('obc@jnu.ac.in', 'health@jnu.ac.in', 'admin@jnu.ac.in')
ORDER BY email;

-- =====================================================================
-- Expected Results:
-- =====================================================================
-- Enum values should include:
--   - pending
--   - under_review
--   - back_to_obc ← NEW
--   - approved
--   - rejected
--   - completed
--   - reimbursed ← NEW
--
-- All 3 admin users should show:
--   - is_active: true
--   - password_status: ✅ Password set
-- =====================================================================
