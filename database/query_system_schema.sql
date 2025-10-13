-- =====================================================
-- QUERY/COMMUNICATION SYSTEM SCHEMA
-- Allows admins to send queries to users via email
-- Users can respond via temporary links with documents
-- =====================================================

-- Drop existing tables if recreating
DROP TABLE IF EXISTS query_attachments CASCADE;
DROP TABLE IF EXISTS query_messages CASCADE;
DROP TABLE IF EXISTS application_queries CASCADE;

-- =====================================================
-- 1. APPLICATION QUERIES (Main query threads)
-- =====================================================
CREATE TABLE application_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES medical_applications(id) ON DELETE CASCADE,
    
    -- Query metadata
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- open, user_replied, admin_replied, resolved, closed
    priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
    
    -- Participants
    created_by UUID NOT NULL REFERENCES users(id), -- Admin who created query
    created_by_role TEXT NOT NULL, -- 'obc', 'health-centre', 'super-admin'
    employee_email TEXT NOT NULL, -- Employee's email for notifications
    
    -- Access control
    access_token TEXT UNIQUE NOT NULL, -- Temporary token for public access
    token_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- Stats
    total_messages INTEGER DEFAULT 1,
    unread_by_admin BOOLEAN DEFAULT FALSE,
    unread_by_user BOOLEAN DEFAULT TRUE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_by TEXT, -- 'admin' or 'user'
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_app_queries_application ON application_queries(application_id);
CREATE INDEX idx_app_queries_token ON application_queries(access_token);
CREATE INDEX idx_app_queries_status ON application_queries(status);
CREATE INDEX idx_app_queries_created_by ON application_queries(created_by);

-- =====================================================
-- 2. QUERY MESSAGES (Individual messages in threads)
-- =====================================================
CREATE TABLE query_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID NOT NULL REFERENCES application_queries(id) ON DELETE CASCADE,
    
    -- Message content
    message TEXT NOT NULL,
    sender_type TEXT NOT NULL, -- 'admin' or 'user'
    sender_id UUID REFERENCES users(id), -- NULL for user messages
    sender_name TEXT NOT NULL,
    sender_role TEXT, -- Role if admin sent it
    
    -- Metadata
    is_internal_note BOOLEAN DEFAULT FALSE, -- Only visible to admins
    read_by_recipient BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_query_messages_query ON query_messages(query_id);
CREATE INDEX idx_query_messages_created ON query_messages(created_at DESC);

-- =====================================================
-- 3. QUERY ATTACHMENTS (Files uploaded in threads)
-- =====================================================
CREATE TABLE query_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID NOT NULL REFERENCES application_queries(id) ON DELETE CASCADE,
    message_id UUID REFERENCES query_messages(id) ON DELETE CASCADE,
    
    -- File details
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in storage
    file_size INTEGER, -- Size in bytes
    file_type TEXT, -- MIME type
    
    -- Upload metadata
    uploaded_by TEXT NOT NULL, -- 'admin' or 'user'
    uploader_id UUID REFERENCES users(id), -- NULL for user uploads
    uploader_name TEXT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_query_attachments_query ON query_attachments(query_id);
CREATE INDEX idx_query_attachments_message ON query_attachments(message_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update query stats when message is added
CREATE OR REPLACE FUNCTION update_query_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE application_queries
    SET 
        total_messages = (
            SELECT COUNT(*) 
            FROM query_messages 
            WHERE query_id = NEW.query_id
        ),
        last_message_at = NEW.created_at,
        last_message_by = NEW.sender_type,
        unread_by_admin = CASE 
            WHEN NEW.sender_type = 'user' THEN TRUE 
            ELSE unread_by_admin 
        END,
        unread_by_user = CASE 
            WHEN NEW.sender_type = 'admin' THEN TRUE 
            ELSE unread_by_user 
        END,
        status = CASE
            WHEN NEW.sender_type = 'user' THEN 'user_replied'
            WHEN NEW.sender_type = 'admin' THEN 'admin_replied'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = NEW.query_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_query_stats
AFTER INSERT ON query_messages
FOR EACH ROW
EXECUTE FUNCTION update_query_stats();

-- Function: Generate random access token
CREATE OR REPLACE FUNCTION generate_access_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE application_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all queries
CREATE POLICY query_admin_access ON application_queries
    FOR ALL
    USING (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    );

-- Policy: Public can access via token (for user responses)
CREATE POLICY query_public_access ON application_queries
    FOR SELECT
    USING (
        access_token = current_setting('request.jwt.claims', true)::json ->> 'token'
        OR token_expires_at > NOW()
    );

-- Policy: Admins can view all messages
CREATE POLICY message_admin_access ON query_messages
    FOR ALL
    USING (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    );

-- Policy: Public can view messages for their query
CREATE POLICY message_public_access ON query_messages
    FOR SELECT
    USING (
        query_id IN (
            SELECT id FROM application_queries 
            WHERE access_token = current_setting('request.jwt.claims', true)::json ->> 'token'
        )
    );

-- Policy: Admins can view all attachments
CREATE POLICY attachment_admin_access ON query_attachments
    FOR ALL
    USING (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    );

-- Policy: Public can view attachments for their query
CREATE POLICY attachment_public_access ON query_attachments
    FOR SELECT
    USING (
        query_id IN (
            SELECT id FROM application_queries 
            WHERE access_token = current_setting('request.jwt.claims', true)::json ->> 'token'
        )
    );

-- =====================================================
-- SAMPLE QUERIES FOR TESTING
-- =====================================================

-- Get all open queries for an admin
-- SELECT q.*, a.employee_name, a.application_number
-- FROM application_queries q
-- JOIN medical_applications a ON q.application_id = a.id
-- WHERE q.status IN ('open', 'user_replied')
-- ORDER BY q.created_at DESC;

-- Get full conversation thread
-- SELECT m.*, q.subject
-- FROM query_messages m
-- JOIN application_queries q ON m.query_id = q.id
-- WHERE q.id = 'query-uuid-here'
-- ORDER BY m.created_at ASC;

-- Get queries with unread replies
-- SELECT * FROM application_queries 
-- WHERE unread_by_admin = TRUE 
-- ORDER BY last_message_at DESC;

-- =====================================================
-- COMMENTS & DOCUMENTATION
-- =====================================================

COMMENT ON TABLE application_queries IS 'Main query threads between admins and employees';
COMMENT ON TABLE query_messages IS 'Individual messages within query threads';
COMMENT ON TABLE query_attachments IS 'File attachments uploaded in query threads';

COMMENT ON COLUMN application_queries.access_token IS 'Temporary token for public access via email link';
COMMENT ON COLUMN application_queries.token_expires_at IS 'Token expiration (default 30 days)';
COMMENT ON COLUMN query_messages.is_internal_note IS 'Internal admin notes, not visible to users';
