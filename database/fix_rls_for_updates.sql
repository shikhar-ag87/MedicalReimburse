-- Fix RLS Policies for Application Status Updates
-- Run this in Supabase SQL Editor

-- =============================================================================
-- CRITICAL FIX: Allow updates to medical_applications table
-- =============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view applications" ON medical_applications;
DROP POLICY IF EXISTS "Service role full access" ON medical_applications;

-- Create new permissive policies that allow updates

-- 1. Allow SELECT for everyone (for viewing)
CREATE POLICY "Allow select for all" ON medical_applications
    FOR SELECT 
    USING (true);

-- 2. Allow INSERT for everyone (for anonymous submissions)
CREATE POLICY "Allow insert for all" ON medical_applications
    FOR INSERT 
    WITH CHECK (true);

-- 3. Allow UPDATE for everyone (backend uses service role key, but policy still applies)
CREATE POLICY "Allow update for all" ON medical_applications
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- 4. Allow DELETE for service role only
CREATE POLICY "Allow delete for service role" ON medical_applications
    FOR DELETE 
    USING (auth.role() = 'service_role');

-- =============================================================================
-- Verify the fix
-- =============================================================================

-- Check current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'medical_applications'
ORDER BY policyname;

-- Test query - this should return the application
SELECT id, status, application_number 
FROM medical_applications 
LIMIT 1;

SELECT '✅ RLS policies updated! Status updates should now work.' as status;
