-- =====================================================================
-- Add new status values to application_status enum
-- =====================================================================
-- This migration adds 'back_to_obc' and 'reimbursed' status values
-- to support the complete workflow:
-- 1. OBC → under_review (Health Centre)
-- 2. Health Centre → back_to_obc (back to OBC)
-- 3. OBC final review → approved (Super Admin)
-- 4. Super Admin → reimbursed (final status)
-- =====================================================================

-- Add 'back_to_obc' status (Health Centre sends back to OBC for final review)
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'back_to_obc';

-- Add 'reimbursed' status (Super Admin marks as reimbursed - final status)
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'reimbursed';

-- Verify the enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'application_status'::regtype 
ORDER BY enumsortorder;
