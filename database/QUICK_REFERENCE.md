# Review System Schema - Quick Reference

## ✅ Schema Fixed and Ready!

All table name references have been corrected:

-   ✅ `medical_applications` (was `applications`)
-   ✅ `expense_items` (was `expenses`)
-   ✅ `application_documents` (was `documents`)

## 📋 Deployment Steps

### Step 1: Deploy the Schema

```sql
-- Copy and paste contents of extensive_review_schema.sql
-- into Supabase SQL Editor and run
```

### Step 2: Verify Deployment

```sql
-- Copy and paste contents of verify_schema.sql
-- into Supabase SQL Editor and run
-- This will check all tables, indexes, triggers, etc.
```

### Step 3: Test the System

Use the OBC Dashboard review modal to test:

1. Click "Review" button on any application
2. Complete eligibility check
3. Review documents
4. Add comments
5. Check timeline
6. Make final decision

## 📊 Tables Created (8 total)

| Table Name            | Purpose                  | Key Fields                          |
| --------------------- | ------------------------ | ----------------------------------- |
| `application_reviews` | Main review records      | decision, review_stage, scores      |
| `review_comments`     | Discussion threads       | comment_text, is_resolved           |
| `document_reviews`    | Document verification    | is_verified, verification_status    |
| `expense_validations` | Expense approval         | validated_amount, validation_status |
| `eligibility_checks`  | Eligibility verification | eligibility_status, conditions      |
| `medical_assessments` | Medical evaluations      | diagnosis_verified, medical_opinion |
| `review_timeline`     | Complete audit trail     | action_type, action_description     |
| `review_assignments`  | Task management          | assigned_to, status, priority       |

## 🔗 Foreign Key Relationships

All review tables reference:

-   `medical_applications.id` (NOT `applications.id`)
-   `admin_users.id` for reviewer/actor tracking
-   `expense_items.id` for expense validations
-   `application_documents.id` for document reviews

## 🎯 API Endpoints Available

Once deployed, these endpoints are ready:

### Application Reviews

-   `POST /api/reviews/applications/:applicationId`
-   `GET /api/reviews/applications/:applicationId`

### Comments

-   `POST /api/reviews/comments`
-   `GET /api/reviews/comments/:applicationId`
-   `PATCH /api/reviews/comments/:commentId/resolve`

### Document Reviews

-   `POST /api/reviews/documents`
-   `GET /api/reviews/documents/:applicationId`

### Expense Validations

-   `POST /api/reviews/expenses`
-   `GET /api/reviews/expenses/:applicationId`

### Eligibility Checks

-   `POST /api/reviews/eligibility`
-   `GET /api/reviews/eligibility/:applicationId`

### Medical Assessments

-   `POST /api/reviews/medical`
-   `GET /api/reviews/medical/:applicationId`

### Timeline & Summary

-   `GET /api/reviews/timeline/:applicationId`
-   `GET /api/reviews/summary/:applicationId`

## ⚠️ Important Notes

1. **Run in Supabase SQL Editor** - Don't run locally
2. **Tables use IF NOT EXISTS** - Safe to re-run
3. **Includes auto-triggers** - Timeline entries created automatically
4. **Has views** - `application_review_summary` and `pending_reviews`
5. **Permissions granted** - `authenticated` role can access

## 🧪 Quick Test Query

After deployment, test with:

```sql
-- Get sample application
SELECT id, application_number, employee_name, status
FROM medical_applications
LIMIT 1;

-- Check review tables are empty (expected initially)
SELECT
    (SELECT COUNT(*) FROM application_reviews) AS reviews,
    (SELECT COUNT(*) FROM review_comments) AS comments,
    (SELECT COUNT(*) FROM document_reviews) AS doc_reviews,
    (SELECT COUNT(*) FROM eligibility_checks) AS eligibility;
```

## 🚀 Next Steps After Deployment

1. ✅ Run `verify_schema.sql` to confirm everything
2. ✅ Test API endpoints with Postman
3. ✅ Try review modal in OBC Dashboard
4. ✅ Create first review record
5. ✅ Check timeline is being populated

## 📞 Troubleshooting

### Error: "relation does not exist"

-   Make sure you're using Supabase SQL Editor
-   Check that base tables exist first

### Error: "permission denied"

-   Ensure you have admin access to the database

### No data appearing in frontend

-   Check backend is running
-   Verify API endpoints are registered
-   Check browser console for errors

## 📁 Related Files

-   `extensive_review_schema.sql` - Main schema file (CORRECTED)
-   `verify_schema.sql` - Verification queries
-   `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
-   `REVIEW_SYSTEM_IMPLEMENTATION.md` - Complete implementation docs

---

**Status**: ✅ READY TO DEPLOY
**Last Updated**: October 7, 2025
**Schema Version**: 1.0 (Fixed)
