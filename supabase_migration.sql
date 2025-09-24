-- SUPABASE DATABASE MIGRATION COMMANDS
-- Run these commands in your Supabase SQL Editor to update the database schema
-- This will convert your existing database to the new hybrid anonymous/admin system

-- =============================================================================
-- STEP 1: Drop existing constraints and tables that depend on users
-- =============================================================================

-- Drop foreign key constraints first
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'audit_logs_user_id_fkey' AND table_name = 'audit_logs'
    ) THEN
        ALTER TABLE audit_logs DROP CONSTRAINT audit_logs_user_id_fkey;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'application_documents_uploaded_by_fkey' AND table_name = 'application_documents'
    ) THEN
        ALTER TABLE application_documents DROP CONSTRAINT application_documents_uploaded_by_fkey;
    END IF;
    
    -- Add more constraint drops as needed based on current schema
END $$;

-- Drop columns that reference users table
DO $$
BEGIN
    -- Remove user_id from audit_logs if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE audit_logs DROP COLUMN user_id;
    END IF;
    
    -- Remove uploaded_by from application_documents if it exists  
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'application_documents' AND column_name = 'uploaded_by'
    ) THEN
        ALTER TABLE application_documents DROP COLUMN uploaded_by;
    END IF;
    
    -- Remove submitted_by from medical_applications if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medical_applications' AND column_name = 'submitted_by'
    ) THEN
        ALTER TABLE medical_applications DROP COLUMN submitted_by;
    END IF;
END $$;

-- =============================================================================  
-- STEP 2: Create new admin_users table and update enums
-- =============================================================================

-- Drop and recreate user_role enum as admin_role
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE admin_role AS ENUM ('admin', 'super_admin', 'medical_officer');

-- Update entity_type enum to remove 'user'
DROP TYPE IF EXISTS entity_type CASCADE;
CREATE TYPE entity_type AS ENUM ('application', 'document');

-- Create admin_users table (replacing users table for admin-only accounts)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role admin_role NOT NULL DEFAULT 'admin',
    name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    department VARCHAR(255),
    designation VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STEP 3: Update medical_applications table to remove user dependencies
-- =============================================================================

-- Add admin reference columns to medical_applications
ALTER TABLE medical_applications 
ADD COLUMN IF NOT EXISTS reviewed_by_admin_id UUID REFERENCES admin_users(id),
ADD COLUMN IF NOT EXISTS processed_by_admin_id UUID REFERENCES admin_users(id);

-- Remove old user reference columns if they exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medical_applications' AND column_name = 'reviewed_by'
    ) THEN
        ALTER TABLE medical_applications DROP COLUMN reviewed_by;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medical_applications' AND column_name = 'processed_by'
    ) THEN
        ALTER TABLE medical_applications DROP COLUMN processed_by;
    END IF;
END $$;

-- =============================================================================
-- STEP 4: Update audit_logs table to support optional admin reference
-- =============================================================================

-- Add optional admin_user_id to audit_logs
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES admin_users(id);

-- =============================================================================
-- STEP 5: Update RLS policies for anonymous access
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own applications" ON medical_applications;
DROP POLICY IF EXISTS "Users can insert their own applications" ON medical_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON medical_applications;

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create new policies for anonymous access + admin management
CREATE POLICY "Admin users can view their own profile" ON admin_users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Super admins can view all admin users" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id::text = auth.uid()::text 
            AND role = 'super_admin'
        )
    );

-- Update medical_applications policies for anonymous access
CREATE POLICY "Anyone can view applications by ID" ON medical_applications
    FOR SELECT USING (true);

CREATE POLICY "Anyone can submit applications" ON medical_applications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update applications" ON medical_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'super_admin', 'medical_officer')
        )
    );

CREATE POLICY "Admins can delete applications" ON medical_applications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'super_admin', 'medical_officer')
        )
    );

-- Update expense_items policies
CREATE POLICY "Anyone can view expenses for applications" ON expense_items
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert expenses for applications" ON expense_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update expenses" ON expense_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'super_admin', 'medical_officer')
        )
    );

-- Update application_documents policies
CREATE POLICY "Anyone can upload documents" ON application_documents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view documents" ON application_documents
    FOR SELECT USING (true);

CREATE POLICY "Admins can delete documents" ON application_documents
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'super_admin', 'medical_officer')
        )
    );

-- =============================================================================
-- STEP 6: Create indexes for better performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_employee_id ON admin_users(employee_id);

-- =============================================================================
-- STEP 7: Create default admin user
-- =============================================================================

-- Insert default admin user (change password in production!)
INSERT INTO admin_users (email, password_hash, role, name, employee_id, designation)
VALUES (
    'admin@jnu.ac.in',
    crypt('admin123', gen_salt('bf')),
    'super_admin',
    'System Administrator',
    'ADMIN001',
    'System Administrator'
)
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- STEP 8: Create utility functions
-- =============================================================================

-- Function to check admin password  
CREATE OR REPLACE FUNCTION check_admin_password(email_input TEXT, password_input TEXT)
RETURNS TABLE(user_id UUID, user_email TEXT, user_role admin_role, user_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.email, u.role, u.name
    FROM admin_users u
    WHERE u.email = email_input
    AND u.password_hash = crypt(password_input, u.password_hash)
    AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 9: Drop old users table (CAREFUL - BACKUP FIRST!)
-- =============================================================================

-- UNCOMMENT ONLY AFTER CONFIRMING EVERYTHING WORKS
-- DROP TABLE IF EXISTS users CASCADE;

COMMIT;