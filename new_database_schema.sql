-- Medical Reimbursement System - Clean Database Schema
-- For Supabase PostgreSQL Database
-- Hybrid System: Anonymous application submissions + Admin user management

-- =============================================================================
-- EXTENSIONS AND BASIC SETUP
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- CUSTOM TYPES
-- =============================================================================

-- Application status enum
CREATE TYPE application_status AS ENUM (
    'pending', 
    'under_review', 
    'approved', 
    'rejected', 
    'completed'
);

-- Treatment type enum
CREATE TYPE treatment_type AS ENUM (
    'opd', 
    'inpatient', 
    'emergency'
);

-- Admin user roles enum
CREATE TYPE admin_role AS ENUM (
    'admin', 
    'super_admin', 
    'medical_officer'
);

-- Document types enum
CREATE TYPE document_type AS ENUM (
    'cghs_card', 
    'prescription', 
    'bill', 
    'receipt', 
    'medical_certificate', 
    'other'
);

-- Audit actions enum
CREATE TYPE audit_action AS ENUM (
    'create', 
    'update', 
    'delete', 
    'view', 
    'approve', 
    'reject'
);

-- Entity types for audit
CREATE TYPE entity_type AS ENUM (
    'application', 
    'document'
);

-- =============================================================================
-- ADMIN USERS TABLE
-- =============================================================================

CREATE TABLE admin_users (
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
-- MEDICAL APPLICATIONS TABLE (Anonymous Submissions)
-- =============================================================================

CREATE TABLE medical_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number VARCHAR(50) UNIQUE NOT NULL,
    status application_status DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Employee details (self-reported, no user account required)
    employee_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    cghs_card_number VARCHAR(50) NOT NULL,
    cghs_dispensary VARCHAR(255) NOT NULL,
    card_validity DATE NOT NULL,
    ward_entitlement VARCHAR(100) NOT NULL,
    
    -- Patient details
    patient_name VARCHAR(255) NOT NULL,
    patient_cghs_card VARCHAR(50) NOT NULL,
    relationship_with_employee VARCHAR(100) NOT NULL,
    
    -- Treatment details
    hospital_name VARCHAR(255) NOT NULL,
    hospital_address TEXT NOT NULL,
    treatment_type treatment_type NOT NULL,
    clothes_provided BOOLEAN DEFAULT FALSE,
    prior_permission BOOLEAN DEFAULT FALSE,
    permission_details TEXT,
    emergency_treatment BOOLEAN DEFAULT FALSE,
    emergency_details TEXT,
    health_insurance BOOLEAN DEFAULT FALSE,
    insurance_amount DECIMAL(10,2),
    
    -- Financial details
    total_amount_claimed DECIMAL(10,2) DEFAULT 0,
    total_amount_passed DECIMAL(10,2) DEFAULT 0,
    
    -- Bank details
    bank_name VARCHAR(255) NOT NULL,
    branch_address TEXT NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    
    -- Documents checklist
    enclosures_count INTEGER DEFAULT 0,
    photocopy_cghs_card BOOLEAN DEFAULT FALSE,
    photocopies_original_prescriptions BOOLEAN DEFAULT FALSE,
    original_bills BOOLEAN DEFAULT FALSE,
    
    -- Declaration
    signature TEXT,
    declaration_place VARCHAR(255),
    declaration_date DATE,
    faculty_employee_id VARCHAR(50),
    mobile_number VARCHAR(15),
    email VARCHAR(255),
    
    -- Admin processing fields (optional, filled by admin users)
    reviewed_by_admin_id UUID REFERENCES admin_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_comments TEXT,
    processed_by_admin_id UUID REFERENCES admin_users(id),
    processed_at TIMESTAMP WITH TIME ZONE
);

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
    amount_passed DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- APPLICATION DOCUMENTS TABLE (Anonymous uploads allowed)
-- =============================================================================

CREATE TABLE application_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES medical_applications(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    document_type document_type NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- AUDIT LOGS TABLE (No user_id constraint - supports anonymous operations)
-- =============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type entity_type NOT NULL,
    entity_id UUID NOT NULL,
    action audit_action NOT NULL,
    admin_user_id UUID REFERENCES admin_users(id), -- Only set for admin actions, NULL for anonymous
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Admin users indexes
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_employee_id ON admin_users(employee_id);
CREATE INDEX idx_admin_users_role ON admin_users(role);

-- Medical applications indexes
CREATE INDEX idx_medical_applications_status ON medical_applications(status);
CREATE INDEX idx_medical_applications_employee_id ON medical_applications(employee_id);
CREATE INDEX idx_medical_applications_submitted_at ON medical_applications(submitted_at);
CREATE INDEX idx_medical_applications_application_number ON medical_applications(application_number);

-- Expense items indexes
CREATE INDEX idx_expense_items_application_id ON expense_items(application_id);
CREATE INDEX idx_expense_items_bill_date ON expense_items(bill_date);

-- Application documents indexes
CREATE INDEX idx_application_documents_application_id ON application_documents(application_id);
CREATE INDEX idx_application_documents_document_type ON application_documents(document_type);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_admin_user_id ON audit_logs(admin_user_id);

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for admin_users
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for medical_applications
CREATE TRIGGER update_medical_applications_updated_at 
    BEFORE UPDATE ON medical_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for expense_items
CREATE TRIGGER update_expense_items_updated_at 
    BEFORE UPDATE ON expense_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- APPLICATION NUMBER GENERATION
-- =============================================================================

-- Function to generate application numbers (MR-YYYY-0001 format)
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    sequence_num INTEGER;
    app_number TEXT;
BEGIN
    year_suffix := EXTRACT(YEAR FROM NOW())::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(application_number FROM 'MR-' || year_suffix || '-(.*)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM medical_applications
    WHERE application_number LIKE 'MR-' || year_suffix || '-%';
    
    app_number := 'MR-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN app_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set application number
CREATE OR REPLACE FUNCTION set_application_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.application_number IS NULL OR NEW.application_number = '' THEN
        NEW.application_number := generate_application_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_medical_application_number 
    BEFORE INSERT ON medical_applications
    FOR EACH ROW EXECUTE FUNCTION set_application_number();

-- =============================================================================
-- AUTOMATIC TOTAL CALCULATION
-- =============================================================================

-- Function to update total amounts when expense items change
CREATE OR REPLACE FUNCTION update_application_totals()
RETURNS TRIGGER AS $$
DECLARE
    total_claimed DECIMAL(10,2);
    total_passed DECIMAL(10,2);
BEGIN
    -- Calculate totals for the application
    SELECT 
        COALESCE(SUM(amount_claimed), 0),
        COALESCE(SUM(amount_passed), 0)
    INTO total_claimed, total_passed
    FROM expense_items
    WHERE application_id = COALESCE(NEW.application_id, OLD.application_id);
    
    -- Update the application totals
    UPDATE medical_applications
    SET 
        total_amount_claimed = total_claimed,
        total_amount_passed = total_passed,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.application_id, OLD.application_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update totals
CREATE TRIGGER update_totals_after_expense_insert 
    AFTER INSERT ON expense_items
    FOR EACH ROW EXECUTE FUNCTION update_application_totals();

CREATE TRIGGER update_totals_after_expense_update 
    AFTER UPDATE ON expense_items
    FOR EACH ROW EXECUTE FUNCTION update_application_totals();

CREATE TRIGGER update_totals_after_expense_delete 
    AFTER DELETE ON expense_items
    FOR EACH ROW EXECUTE FUNCTION update_application_totals();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin users policies
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

CREATE POLICY "Super admins can manage all admin users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id::text = auth.uid()::text 
            AND role = 'super_admin'
        )
    );

-- Medical applications policies (anonymous access allowed)
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

-- Expense items policies
CREATE POLICY "Anyone can view expenses" ON expense_items
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert expenses" ON expense_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update expenses" ON expense_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'super_admin', 'medical_officer')
        )
    );

CREATE POLICY "Admins can delete expenses" ON expense_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'super_admin', 'medical_officer')
        )
    );

-- Application documents policies (anonymous uploads allowed)
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

-- Audit logs policies
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'super_admin', 'medical_officer')
        )
    );

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- =============================================================================
-- UTILITY FUNCTIONS
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

-- Function to get application statistics
CREATE OR REPLACE FUNCTION get_application_stats()
RETURNS TABLE(
    total_applications BIGINT,
    pending_applications BIGINT,
    approved_applications BIGINT,
    rejected_applications BIGINT,
    total_amount_claimed DECIMAL(10,2),
    total_amount_passed DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::BIGINT,
        COUNT(CASE WHEN status = 'approved' THEN 1 END)::BIGINT,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END)::BIGINT,
        COALESCE(SUM(total_amount_claimed), 0)::DECIMAL(10,2),
        COALESCE(SUM(total_amount_passed), 0)::DECIMAL(10,2)
    FROM medical_applications;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================

-- Insert default admin user
-- Username: admin@jnu.ac.in
-- Password: admin123 (CHANGE THIS IN PRODUCTION!)
INSERT INTO admin_users (email, password_hash, role, name, employee_id, designation, department)
VALUES (
    'admin@jnu.ac.in',
    crypt('admin123', gen_salt('bf')),
    'super_admin',
    'System Administrator',
    'ADMIN001',
    'System Administrator',
    'IT Department'
);

-- Insert sample medical officer
INSERT INTO admin_users (email, password_hash, role, name, employee_id, designation, department)
VALUES (
    'medical.officer@jnu.ac.in',
    crypt('medical123', gen_salt('bf')),
    'medical_officer',
    'Dr. Medical Officer',
    'MO001',
    'Medical Officer',
    'Health Centre'
);

-- =============================================================================
-- COMPLETED SETUP
-- =============================================================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Medical Reimbursement Database Setup Complete!';
    RAISE NOTICE 'Default Admin User: admin@jnu.ac.in / admin123';
    RAISE NOTICE 'Default Medical Officer: medical.officer@jnu.ac.in / medical123';
    RAISE NOTICE 'REMEMBER TO CHANGE DEFAULT PASSWORDS IN PRODUCTION!';
END $$;