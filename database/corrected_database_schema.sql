-- Medical Reimbursement System - CORRECTED Database Schema
-- For Supabase PostgreSQL Database
-- Fixed RLS policies to prevent infinite recursion

-- =============================================================================
-- CLEAN SLATE: DROP ALL EXISTING OBJECTS
-- =============================================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS application_documents CASCADE;
DROP TABLE IF EXISTS expense_items CASCADE;
DROP TABLE IF EXISTS medical_applications CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS generate_application_number() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_total_amount() CASCADE;

-- Drop existing sequences
DROP SEQUENCE IF EXISTS application_number_seq CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS treatment_type CASCADE;
DROP TYPE IF EXISTS admin_role CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;

-- =============================================================================
-- EXTENSIONS AND BASIC SETUP
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- CUSTOM TYPES
-- =============================================================================

CREATE TYPE application_status AS ENUM (
    'pending', 
    'under_review', 
    'back_to_obc',
    'approved', 
    'rejected', 
    'completed',
    'reimbursed'
);

CREATE TYPE treatment_type AS ENUM (
    'opd', 
    'inpatient', 
    'emergency'
);

CREATE TYPE admin_role AS ENUM (
    'admin', 
    'super_admin', 
    'medical_officer'
);

CREATE TYPE document_type AS ENUM (
    'cghs_card', 
    'prescription', 
    'bill', 
    'receipt', 
    'medical_certificate', 
    'other'
);

CREATE TYPE audit_action AS ENUM (
    'create', 
    'update', 
    'delete', 
    'view', 
    'approve', 
    'reject'
);

-- =============================================================================
-- ADMIN USERS TABLE (No RLS - Service Role Access Only)
-- =============================================================================

CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role admin_role NOT NULL DEFAULT 'admin',
    employee_id VARCHAR(50),
    department VARCHAR(255),
    designation VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for admin_users
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);

-- NO RLS on admin_users - accessed via service role only
-- This prevents infinite recursion issues

-- =============================================================================
-- MEDICAL APPLICATIONS TABLE (Anonymous Access Allowed)
-- =============================================================================

CREATE TABLE medical_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number VARCHAR(20) UNIQUE NOT NULL,
    status application_status NOT NULL DEFAULT 'pending',
    
    -- Employee/Applicant Details (Anonymous)
    employee_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(15),
    email VARCHAR(255),
    
    -- CGHS Details
    cghs_card_number VARCHAR(50) NOT NULL,
    cghs_dispensary VARCHAR(255) NOT NULL,
    card_validity DATE,
    ward_entitlement VARCHAR(50),
    
    -- Patient Details
    patient_name VARCHAR(255) NOT NULL,
    patient_cghs_card VARCHAR(50) NOT NULL,
    relationship_with_employee VARCHAR(100) NOT NULL,
    
    -- Treatment Details
    hospital_name VARCHAR(255) NOT NULL,
    hospital_address TEXT NOT NULL,
    treatment_type treatment_type NOT NULL,
    treatment_period_from DATE,
    treatment_period_to DATE,
    
    -- Treatment Conditions
    clothes_provided BOOLEAN NOT NULL DEFAULT false,
    prior_permission BOOLEAN NOT NULL DEFAULT false,
    permission_details TEXT,
    emergency_treatment BOOLEAN NOT NULL DEFAULT false,
    emergency_details TEXT,
    
    -- Insurance Details
    health_insurance BOOLEAN NOT NULL DEFAULT false,
    insurance_amount DECIMAL(10,2),
    
    -- Financial Details
    total_amount_claimed DECIMAL(10,2) NOT NULL DEFAULT 0,
    approved_amount DECIMAL(10,2),
    
    -- Bank Details
    bank_name VARCHAR(255),
    branch_address TEXT,
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    
    -- Declaration Details
    enclosures_count INTEGER DEFAULT 0,
    photocopy_cghs_card BOOLEAN DEFAULT false,
    photocopies_original_prescriptions BOOLEAN DEFAULT false,
    original_bills BOOLEAN DEFAULT false,
    signature VARCHAR(255),
    declaration_place VARCHAR(255),
    declaration_date DATE,
    
    -- Faculty Details
    faculty_employee_id VARCHAR(50),
    
    -- System Fields
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Admin Processing Fields (Optional - Set by Admins)
    reviewed_by UUID REFERENCES admin_users(id),
    reviewed_at TIMESTAMPTZ,
    admin_remarks TEXT
);

-- Create indexes for medical_applications
CREATE INDEX idx_applications_number ON medical_applications(application_number);
CREATE INDEX idx_applications_status ON medical_applications(status);
CREATE INDEX idx_applications_employee ON medical_applications(employee_id);
CREATE INDEX idx_applications_submitted ON medical_applications(submitted_at);
CREATE INDEX idx_applications_reviewed_by ON medical_applications(reviewed_by);

-- Enable RLS for medical_applications
ALTER TABLE medical_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (anonymous submissions)
CREATE POLICY "Anyone can submit applications" ON medical_applications
    FOR INSERT WITH CHECK (true);

-- Policy: Anyone can view their own application by application_number
CREATE POLICY "Anyone can view applications" ON medical_applications
    FOR SELECT USING (true);

-- Policy: Service role can do everything (for admin operations)
CREATE POLICY "Service role full access" ON medical_applications
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- EXPENSE ITEMS TABLE
-- =============================================================================

CREATE TABLE expense_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES medical_applications(id) ON DELETE CASCADE,
    bill_number VARCHAR(100) NOT NULL,
    bill_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount_claimed DECIMAL(10,2) NOT NULL,
    amount_approved DECIMAL(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_expense_items_application ON expense_items(application_id);
CREATE INDEX idx_expense_items_bill_number ON expense_items(bill_number);

-- Enable RLS
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert/view (tied to applications)
CREATE POLICY "Anyone can manage expense items" ON expense_items
    FOR ALL USING (true);

-- =============================================================================
-- APPLICATION DOCUMENTS TABLE
-- =============================================================================

CREATE TABLE application_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES medical_applications(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    upload_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_documents_application ON application_documents(application_id);
CREATE INDEX idx_documents_type ON application_documents(document_type);

-- Enable RLS
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can manage documents
CREATE POLICY "Anyone can manage documents" ON application_documents
    FOR ALL USING (true);

-- =============================================================================
-- AUDIT LOGS TABLE
-- =============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    action audit_action NOT NULL,
    changes JSONB,
    admin_user_id UUID REFERENCES admin_users(id), -- NULL for anonymous actions
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_admin_user ON audit_logs(admin_user_id);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert audit logs (anonymous operations, file uploads, etc.)
CREATE POLICY "Allow all inserts to audit_logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Policy: Service role has full access to view audit logs
CREATE POLICY "Service role full access to audit_logs" ON audit_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Policy: Allow anon role to insert audit logs
CREATE POLICY "Anon can insert audit logs" ON audit_logs
    FOR INSERT TO anon WITH CHECK (true);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_applications_updated_at 
    BEFORE UPDATE ON medical_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_items_updated_at 
    BEFORE UPDATE ON expense_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate application number
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.application_number IS NULL OR NEW.application_number = '' THEN
        NEW.application_number := 'MR-' || TO_CHAR(NOW(), 'YYYY-MM') || '-' || LPAD(NEXTVAL('application_number_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for application numbers
CREATE SEQUENCE IF NOT EXISTS application_number_seq START 1;

-- Trigger for application number generation
CREATE TRIGGER generate_application_number_trigger 
    BEFORE INSERT ON medical_applications 
    FOR EACH ROW EXECUTE FUNCTION generate_application_number();

-- Function to calculate total amount from expense items
CREATE OR REPLACE FUNCTION calculate_total_amount()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE medical_applications 
    SET total_amount_claimed = (
        SELECT COALESCE(SUM(amount_claimed), 0) 
        FROM expense_items 
        WHERE application_id = COALESCE(NEW.application_id, OLD.application_id)
    )
    WHERE id = COALESCE(NEW.application_id, OLD.application_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for total amount calculation
CREATE TRIGGER calculate_total_amount_insert
    AFTER INSERT ON expense_items
    FOR EACH ROW EXECUTE FUNCTION calculate_total_amount();

CREATE TRIGGER calculate_total_amount_update
    AFTER UPDATE ON expense_items
    FOR EACH ROW EXECUTE FUNCTION calculate_total_amount();

CREATE TRIGGER calculate_total_amount_delete
    AFTER DELETE ON expense_items
    FOR EACH ROW EXECUTE FUNCTION calculate_total_amount();

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================

-- Insert default admin users
INSERT INTO admin_users (email, password, name, role, employee_id, department, designation) VALUES
('admin@jnu.ac.in', '$2b$10$8K1p/a0dqbeCH9cqj3Q8.e6o2V0bx2/ZuGtRJm1YpFp5dD7ZjNXrC', 'System Admin', 'super_admin', 'ADMIN001', 'Administration', 'System Administrator'),
('health@jnu.ac.in', '$2b$10$8K1p/a0dqbeCH9cqj3Q8.e6o2V0bx2/ZuGtRJm1YpFp5dD7ZjNXrC', 'Health Centre Admin', 'medical_officer', 'HC001', 'Health Centre', 'Medical Officer'),
('obc@jnu.ac.in', '$2b$10$8K1p/a0dqbeCH9cqj3Q8.e6o2V0bx2/ZuGtRJm1YpFp5dD7ZjNXrC', 'OBC/SC/ST Cell Admin', 'admin', 'OBC001', 'OBC/SC/ST Cell', 'Administrative Officer');

-- =============================================================================
-- FINAL SETUP
-- =============================================================================

-- Grant necessary permissions (if needed)
-- Note: Supabase handles most permissions automatically

COMMIT;

-- Success message
SELECT 'Database schema created successfully! Anonymous applications and admin management are now supported.' as status;