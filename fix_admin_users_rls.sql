-- Quick fix for admin_users RLS recursion issue
-- Run this in Supabase SQL Editor

-- Disable RLS entirely on admin_users table
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies on admin_users (in case they exist)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Service role full access" ON admin_users;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'admin_users';

-- Success message
SELECT 'RLS disabled on admin_users table - recursion issue should be resolved!' as status;