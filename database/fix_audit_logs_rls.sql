-- Fix Audit Logs RLS Policies
-- This migration fixes the Row Level Security policies for the audit_logs table
-- to allow anonymous file uploads and operations to create audit log entries

-- First, show existing policies
SELECT 'Current policies on audit_logs:' as info;
SELECT policyname FROM pg_policies WHERE tablename = 'audit_logs';

-- Drop ALL existing policies on audit_logs (regardless of name)
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'audit_logs'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON audit_logs', policy_record.policyname);
    END LOOP;
END $$;

-- Create new policies that properly handle anonymous operations

-- Policy 1: Allow all inserts (for any authenticated or anonymous operations)
CREATE POLICY "Allow all inserts to audit_logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Policy 2: Service role has full access to view and manage audit logs
CREATE POLICY "Service role full access to audit_logs" ON audit_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Policy 3: Explicitly allow anon role to insert audit logs
CREATE POLICY "Anon can insert audit logs" ON audit_logs
    FOR INSERT TO anon WITH CHECK (true);

-- Verify the new policies were created
SELECT 'New policies on audit_logs:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'audit_logs'
ORDER BY policyname;

-- Success message
SELECT 'Audit logs RLS policies updated successfully! File uploads should now work.' as status;
