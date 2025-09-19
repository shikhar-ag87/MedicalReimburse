-- Medical Reimbursement System Database Schema
-- This script creates all necessary tables for the Supabase database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE application_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'completed');
CREATE TYPE treatment_type AS ENUM ('opd', 'inpatient', 'emergency');
CREATE TYPE user_role AS ENUM ('employee', 'admin', 'super_admin', 'medical_officer');
CREATE TYPE document_type AS ENUM ('cghs_card', 'prescription', 'bill', 'receipt', 'medical_certificate', 'other');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'view', 'approve', 'reject');
CREATE TYPE entity_type AS ENUM ('application', 'user', 'document');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    department VARCHAR(255),
    designation VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical applications table
CREATE TABLE medical_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number VARCHAR(50) UNIQUE NOT NULL,
    status application_status DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Employee details
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
    
    -- Documents
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
    
    -- Admin fields
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_comments TEXT,
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- User who submitted the application
    submitted_by UUID REFERENCES users(id)
);

-- Expense items table
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

-- Application documents table
CREATE TABLE application_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES medical_applications(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    document_type document_type NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID NOT NULL REFERENCES users(id)
);

-- Audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type entity_type NOT NULL,
    entity_id UUID NOT NULL,
    action audit_action NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    user_email VARCHAR(255) NOT NULL,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_medical_applications_status ON medical_applications(status);
CREATE INDEX idx_medical_applications_employee_id ON medical_applications(employee_id);
CREATE INDEX idx_medical_applications_submitted_at ON medical_applications(submitted_at);
CREATE INDEX idx_medical_applications_application_number ON medical_applications(application_number);

CREATE INDEX idx_expense_items_application_id ON expense_items(application_id);
CREATE INDEX idx_application_documents_application_id ON application_documents(application_id);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_role ON users(role);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_applications_updated_at BEFORE UPDATE ON medical_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_items_updated_at BEFORE UPDATE ON expense_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate application numbers
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

-- Trigger to automatically generate application number
CREATE OR REPLACE FUNCTION set_application_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.application_number IS NULL OR NEW.application_number = '' THEN
        NEW.application_number := generate_application_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_medical_application_number BEFORE INSERT ON medical_applications
    FOR EACH ROW EXECUTE FUNCTION set_application_number();

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
CREATE TRIGGER update_totals_after_expense_insert AFTER INSERT ON expense_items
    FOR EACH ROW EXECUTE FUNCTION update_application_totals();

CREATE TRIGGER update_totals_after_expense_update AFTER UPDATE ON expense_items
    FOR EACH ROW EXECUTE FUNCTION update_application_totals();

CREATE TRIGGER update_totals_after_expense_delete AFTER DELETE ON expense_items
    FOR EACH ROW EXECUTE FUNCTION update_application_totals();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policies for medical_applications table
CREATE POLICY "Users can view their own applications" ON medical_applications
    FOR SELECT USING (
        submitted_by::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'super_admin', 'medical_officer')
        )
    );

CREATE POLICY "Users can insert their own applications" ON medical_applications
    FOR INSERT WITH CHECK (submitted_by::text = auth.uid()::text);

CREATE POLICY "Admins can update applications" ON medical_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'super_admin', 'medical_officer')
        )
    );

-- Insert default admin user (password should be changed after setup)
INSERT INTO users (email, password_hash, role, name, is_active) VALUES
('admin@jnu.ac.in', crypt('admin123', gen_salt('bf')), 'super_admin', 'System Administrator', true);

-- Create a function to check password
CREATE OR REPLACE FUNCTION check_password(email_input TEXT, password_input TEXT)
RETURNS TABLE(user_id UUID, user_email TEXT, user_role user_role, user_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.email, u.role, u.name
    FROM users u
    WHERE u.email = email_input
    AND u.password_hash = crypt(password_input, u.password_hash)
    AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;