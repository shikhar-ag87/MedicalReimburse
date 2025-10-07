# Review System Database Deployment Guide

## Prerequisites

-   Access to Supabase SQL Editor
-   Admin privileges on the database
-   Existing tables: `medical_applications`, `expense_items`, `application_documents`, `admin_users`

## Deployment Steps

### Step 1: Open Supabase SQL Editor

1. Log in to your Supabase project dashboard
2. Navigate to SQL Editor (from left sidebar)
3. Click "New Query"

### Step 2: Copy and Execute Schema

1. Open the file: `database/extensive_review_schema.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click "Run" button (or press Ctrl+Enter)

### Step 3: Verify Table Creation

Run this query to check if all tables were created successfully:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'application_reviews',
    'review_comments',
    'document_reviews',
    'expense_validations',
    'eligibility_checks',
    'medical_assessments',
    'review_timeline',
    'review_assignments'
)
ORDER BY table_name;
```

You should see all 8 tables listed.

### Step 4: Verify Foreign Keys

Check that foreign key relationships are properly established:

```sql
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name LIKE '%review%'
ORDER BY tc.table_name;
```

### Step 5: Test Insert (Optional)

Test that you can insert a sample review record:

```sql
-- Get a sample application ID
SELECT id, application_number FROM medical_applications LIMIT 1;

-- Get your admin user ID
SELECT id, email FROM admin_users WHERE email = 'your-email@example.com';

-- Insert a test review (replace UUIDs with actual values from above)
INSERT INTO application_reviews (
    application_id,
    reviewer_id,
    reviewer_role,
    review_stage,
    decision,
    eligibility_verified,
    documents_verified,
    medical_validity_checked,
    expensesvalidated,
    review_notes
) VALUES (
    'YOUR-APPLICATION-ID',
    'YOUR-ADMIN-USER-ID',
    'obc_cell',
    'initial',
    'pending',
    false,
    false,
    false,
    false,
    'Test review entry'
);

-- Verify insert
SELECT * FROM application_reviews ORDER BY created_at DESC LIMIT 1;

-- Clean up test data (optional)
DELETE FROM application_reviews WHERE review_notes = 'Test review entry';
```

## Troubleshooting

### Error: "relation does not exist"

**Problem**: Referenced tables don't exist
**Solution**: Ensure these tables exist first:

-   `medical_applications`
-   `expense_items`
-   `application_documents`
-   `admin_users`

Run this to check:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('medical_applications', 'expense_items', 'application_documents', 'admin_users');
```

### Error: "permission denied"

**Problem**: Insufficient database privileges
**Solution**: You need admin/owner access to create tables. Contact your Supabase project owner.

### Error: "constraint already exists"

**Problem**: Tables already created from a previous run
**Solution**: Drop existing tables first (⚠️ **WARNING: This deletes all review data!**):

```sql
-- DROP TABLES (use with extreme caution!)
DROP TABLE IF EXISTS review_assignments CASCADE;
DROP TABLE IF EXISTS review_timeline CASCADE;
DROP TABLE IF EXISTS medical_assessments CASCADE;
DROP TABLE IF EXISTS eligibility_checks CASCADE;
DROP TABLE IF EXISTS expense_validations CASCADE;
DROP TABLE IF EXISTS document_reviews CASCADE;
DROP TABLE IF EXISTS review_comments CASCADE;
DROP TABLE IF EXISTS application_reviews CASCADE;
```

## Post-Deployment Verification

### Check Row-Level Security (RLS)

Review system tables should have appropriate RLS policies:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%review%';
```

### Check Indexes

Verify that performance indexes are created:

```sql
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE '%review%'
ORDER BY tablename, indexname;
```

## Tables Created

1. **application_reviews** - Main review records
2. **review_comments** - Discussion threads
3. **document_reviews** - Document verification tracking
4. **expense_validations** - Expense approval/rejection
5. **eligibility_checks** - Eligibility verification details
6. **medical_assessments** - Medical officer evaluations
7. **review_timeline** - Complete audit trail
8. **review_assignments** - Review task management

## Next Steps

After successful deployment:

1. ✅ Test API endpoints in Postman/Thunder Client
2. ✅ Test frontend review modal in OBC Dashboard
3. ✅ Verify data is being saved correctly
4. ✅ Check audit trail is recording actions
5. ✅ Test with real application data

## Rollback Procedure

If you need to completely remove the review system:

```sql
-- ⚠️ WARNING: This permanently deletes all review data!
BEGIN;

DROP TABLE IF EXISTS review_assignments CASCADE;
DROP TABLE IF EXISTS review_timeline CASCADE;
DROP TABLE IF EXISTS medical_assessments CASCADE;
DROP TABLE IF EXISTS eligibility_checks CASCADE;
DROP TABLE IF EXISTS expense_validations CASCADE;
DROP TABLE IF EXISTS document_reviews CASCADE;
DROP TABLE IF EXISTS review_comments CASCADE;
DROP TABLE IF EXISTS application_reviews CASCADE;

DROP FUNCTION IF EXISTS update_review_updated_at() CASCADE;

COMMIT;
```

## Support

If you encounter issues:

1. Check the Supabase logs for detailed error messages
2. Verify all prerequisite tables exist
3. Ensure your user has proper permissions
4. Review the foreign key constraints

---

**Schema Version**: 1.0
**Last Updated**: October 7, 2025
**Compatible With**: Supabase PostgreSQL 15+
