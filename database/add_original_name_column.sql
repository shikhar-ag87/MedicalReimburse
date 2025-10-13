-- Add missing original_name column to application_documents table
-- This stores the original filename as uploaded by the user

ALTER TABLE application_documents 
ADD COLUMN IF NOT EXISTS original_name VARCHAR(255);

-- Update the column comment
COMMENT ON COLUMN application_documents.original_name IS 'Original filename as uploaded by user';

-- For existing records, copy file_name to original_name
UPDATE application_documents 
SET original_name = file_name 
WHERE original_name IS NULL;

-- Verify the column was added
SELECT 'original_name column added successfully!' as status;

-- Show the table structure
\d application_documents
