# Review Persistence Setup Instructions

## Problem Fixed

Previously, when you filled out the review form (eligibility checks, document reviews) and forwarded the application to the next stage, **all your review data was lost**. When the application came back, the form would be empty and you'd have to start over.

## Solution

Created database tables to persist review states across workflow transitions:
- `eligibility_checks` - Stores all eligibility form data
- `document_reviews` - Stores document review states
- `review_comments` - Enhanced comments tracking

## What's Fixed

### 1. **Amount Approved showing ₹0** ✅
- Now shows "Amount Claimed" as fallback when no approved amount exists
- Will display "Amount Approved" once Health Centre sets it

### 2. **Review States Not Persisting** ✅
- Eligibility checks now saved to database
- When application returns from Health Centre, OBC sees their previous review
- All checkboxes, dropdowns, and notes are preserved

## Setup Steps

### Step 1: Run the SQL Script

Open Supabase SQL Editor and run:

```bash
/home/aloo/MedicalReimburse/database/create_review_persistence_tables.sql
```

This will create:
- ✅ `eligibility_checks` table with all form fields
- ✅ `document_reviews` table for document states
- ✅ `review_comments` table (if doesn't exist)
- ✅ RLS policies (permissive for all operations)
- ✅ Helper functions for fetching latest reviews

### Step 2: Verify Tables Were Created

Run this query in Supabase SQL Editor:

```sql
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('eligibility_checks', 'document_reviews', 'review_comments')
ORDER BY table_name;
```

You should see:
```
eligibility_checks      | 19
document_reviews        | 13
review_comments         | 9
```

### Step 3: Restart Backend

```bash
cd /home/aloo/MedicalReimburse/backend
npm run dev
```

### Step 4: Test the Workflow

1. **OBC Initial Review:**
   - Login as OBC admin
   - Open an application in `pending` status
   - Fill out eligibility form (all checkboxes and fields)
   - Click "Complete Review" → Forward to Health Centre
   - Note: Your form data is now saved!

2. **Health Centre Review:**
   - Login as Health Centre user
   - Review the application (status: `under_review`)
   - Complete review → Return to OBC

3. **OBC Final Review:**
   - Login as OBC admin again
   - Open the SAME application (status: `back_to_obc`)
   - **VERIFY:** All your previous eligibility check data is still there!
   - Your checkboxes should be checked
   - Your notes should be visible
   - Make any additional changes
   - Forward to Super Admin

## Technical Details

### Database Schema

**eligibility_checks:**
- Stores all 17 fields from the eligibility form
- Links to application and checker (admin user)
- Timestamps: `checked_at`, `updated_at`
- Unique constraint: One check per checker per application (per session)

**document_reviews:**
- Stores per-document review data
- Fields: status, authenticity, completeness, legibility
- Links to application, document, and reviewer

**Backend Changes:**
- `/api/reviews/eligibility/:applicationId` (GET) - Now fetches from database
- `/api/reviews/eligibility/:applicationId` (PATCH) - Saves to database with upsert logic
- Uses service client to bypass RLS

**Frontend Changes:**
- Modal loads existing eligibility data on open
- Form pre-fills with saved values
- Amount display shows claimed amount as fallback

## What Persists

### Eligibility Check Form:
- ✅ All checkboxes (category, employee, policy compliance)
- ✅ Prior Permission Status dropdown
- ✅ Eligibility Status (Eligible/Not Eligible/Conditional)
- ✅ Ineligibility Reasons array
- ✅ Conditions array
- ✅ Additional Notes text

### Document Reviews:
- ✅ Per-document review status
- ✅ Authenticity/Complete/Legible flags
- ✅ Review notes

### Review Comments:
- ✅ All comments persist across transitions
- ✅ Comment type and resolution status

## Troubleshooting

### Issue: "relation 'eligibility_checks' does not exist"
**Solution:** Run `create_review_persistence_tables.sql` in Supabase

### Issue: "permission denied" when saving
**Solution:** Check that RLS policies are permissive (all set to `true`)

### Issue: Form still empty after coming back
**Solution:** 
1. Check browser console for API errors
2. Verify backend is using service client
3. Check that `checker_id` matches logged-in user

### Issue: Multiple reviews showing up
**Solution:** This is by design! Each reviewer's data is saved separately. The system shows the LATEST check by checking timestamp.

## Success Criteria

✅ Fill eligibility form → forward → come back → **data still there**
✅ Amount shows claimed value when not yet approved
✅ Comments persist across workflow stages
✅ Document reviews remain in their state

## Next Steps

Consider implementing:
- Review history view (show all past checks)
- Diff view (compare OBC vs Health Centre reviews)
- Export review data to PDF
- Review analytics dashboard

---

**All changes are backward compatible!** Existing applications will work fine, they just won't have old review data (which was being lost anyway).
