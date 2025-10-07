# Database Schema Deployment Instructions

## 🎉 Good News - Authentication Fixed!

The JWT authentication is now working correctly:

-   ✅ `reviewerId` extracted from JWT token
-   ✅ `reviewerRole` extracted from JWT token
-   ✅ Review successfully created (ID: `93bfe1ee-f936-4bc1-96df-582a6b86b736`)
-   ✅ HTTP 200 response

## 📋 Next Step: Deploy Database Schema

You need to run the SQL schema in your Supabase database to create the 8 review tables.

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**

    - Go to https://supabase.com/dashboard
    - Select your project

2. **Navigate to SQL Editor**

    - Click "SQL Editor" in the left sidebar
    - Click "New Query"

3. **Copy and Execute SQL**

    - Open `d:\dev\CIS Project\MedicalReimburse\database\extensive_review_schema.sql`
    - Copy the entire contents (390 lines)
    - Paste into Supabase SQL Editor
    - Click "Run" button

4. **Verify Success**
    - You should see "Success. No rows returned"
    - Check "Table Editor" to see the new tables:
        - ✅ application_reviews
        - ✅ review_comments
        - ✅ document_reviews
        - ✅ expense_validations
        - ✅ eligibility_checks
        - ✅ medical_assessments
        - ✅ review_timeline
        - ✅ review_assignments

### Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
cd "d:\dev\CIS Project\MedicalReimburse"
supabase db push --db-url "your-supabase-connection-string"
```

## 🗂️ What Gets Created

### Tables (8 total)

1. **application_reviews** - Main review records with decisions
2. **review_comments** - Thread-based comments and discussions
3. **document_reviews** - Individual document verification
4. **expense_validations** - Expense item approvals/rejections
5. **eligibility_checks** - Eligibility criteria verification
6. **medical_assessments** - Medical condition evaluations
7. **review_timeline** - Audit trail of all actions
8. **review_assignments** - Workflow assignment tracking

### Triggers (5 total)

-   Auto-populate review_timeline on review creation
-   Auto-populate timeline on comment addition
-   Auto-populate timeline on document review
-   Auto-populate timeline on expense validation
-   Auto-populate timeline on eligibility check

### Views (2 total)

1. **pending_reviews** - All applications needing review
2. **application_review_summary** - Comprehensive review statistics

## 🔍 Verification Steps

After running the schema, verify with these SQL queries:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%review%';

-- Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Check views exist
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public';

-- Test the pending_reviews view
SELECT * FROM pending_reviews LIMIT 5;
```

## ⚠️ Prerequisites

Before deployment, ensure these tables exist:

-   ✅ `medical_applications` (main application table)
-   ✅ `admin_users` (reviewer accounts)
-   ✅ `expense_items` (expense line items)
-   ✅ `application_documents` (uploaded documents)

If any are missing, you'll see errors like:

```
relation "medical_applications" does not exist
```

## 🧪 Test After Deployment

1. **Test Review Creation**

    - Log in to OBC Dashboard
    - Click "Review" on an application
    - Fill eligibility form and submit
    - Should see success message

2. **Check Database**

    ```sql
    -- Verify review was created
    SELECT * FROM application_reviews ORDER BY created_at DESC LIMIT 1;

    -- Check timeline was populated
    SELECT * FROM review_timeline ORDER BY created_at DESC LIMIT 5;

    -- View pending reviews
    SELECT * FROM pending_reviews;
    ```

3. **Test Other Features**
    - Add comments (should appear in `review_comments`)
    - Review documents (should populate `document_reviews`)
    - Validate expenses (should create `expense_validations`)

## 📊 Expected Results

After successful deployment:

-   8 new tables in Supabase
-   5 triggers active
-   2 views available
-   Review creation working end-to-end
-   Timeline automatically tracking all actions

## 🆘 Troubleshooting

### Error: "relation already exists"

This is fine - it means tables were already created. The script uses `CREATE TABLE IF NOT EXISTS`.

### Error: "relation X does not exist"

You need to create the prerequisite table first (medical_applications, admin_users, etc.)

### Error: "permission denied"

Check that your Supabase user has CREATE TABLE privileges.

### Reviews not saving

1. Check backend logs for errors
2. Verify JWT token is valid
3. Check browser console for network errors
4. Verify tables were created successfully

## 🎯 What Happens Next

Once the schema is deployed:

1. ✅ Reviews can be saved to database
2. ✅ Comments will persist
3. ✅ Timeline will track all actions
4. ✅ Full audit trail enabled
5. ✅ All 19 API endpoints will work completely

## 📝 Notes

-   The schema uses UUID primary keys for all tables
-   All foreign keys have CASCADE delete for data integrity
-   Timestamps are automatically managed
-   Triggers ensure timeline is always up-to-date
-   Views provide convenient data aggregation

---

**Current Status**: Authentication working ✅ | Database schema ready ✅ | **Need to deploy** ⏳
