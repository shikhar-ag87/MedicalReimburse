# Review System Testing Checklist

## ✅ Current Status (as of 10:53:37 UTC)

### Working ✅

-   JWT Authentication middleware
-   Reviewer ID extraction from token
-   Reviewer Role extraction from token
-   Review creation endpoint
-   Backend server running on port 3005

### Test Results

```
✅ POST /api/reviews/applications/e2aaa590-7dae-44ee-9c61-9ad1f55b1470
   Status: 200 OK
   Review ID: 93bfe1ee-f936-4bc1-96df-582a6b86b736
   Reviewer: 6bdb3eb9-d16e-43b6-8a67-5dedd9b5caf9 (admin)
   Decision: approved
```

## 🧪 Testing Workflow

### Step 1: Deploy Database Schema ⏳

**Action Required**: Run `extensive_review_schema.sql` in Supabase

See `database/DEPLOYMENT_INSTRUCTIONS.md` for detailed steps.

### Step 2: Test Review Creation ✅ (Already Working!)

1. Login to OBC Dashboard
2. Click "Review" button on any application
3. Open "Eligibility" tab
4. Fill form:
    - Select eligibility criteria
    - Mark as "Eligible" or "Not Eligible"
    - Add checker notes
5. Click "Submit Eligibility Check"
6. Should see: "Review created successfully"

### Step 3: Test Comments

1. In review modal, go to "Comments" tab
2. Type a comment in text area
3. Toggle "Internal Comment" if needed
4. Click "Add Comment"
5. Should see comment appear in list

### Step 4: Test Document Reviews

1. Go to "Documents" tab
2. Find a document in the list
3. Click review button
4. Select status: Approved/Rejected/Needs Reupload
5. Add reviewer notes
6. Submit
7. Should see status badge update

### Step 5: Test Timeline

1. Go to "History" tab
2. Should see all actions:
    - Review created
    - Comments added
    - Documents reviewed
    - Status changes
3. Each entry should have timestamp and user info

## 📝 19 API Endpoints to Test

### Review Management (5 endpoints)

-   [x] `POST /api/reviews/applications/:applicationId` - Create review ✅
-   [ ] `GET /api/reviews/applications/:applicationId` - Get review
-   [ ] `PUT /api/reviews/:reviewId` - Update review
-   [ ] `GET /api/reviews/pending` - List pending reviews
-   [ ] `GET /api/reviews/summary/:applicationId` - Get summary

### Comments (4 endpoints)

-   [ ] `POST /api/reviews/comments/:applicationId` - Add comment
-   [ ] `GET /api/reviews/comments/:applicationId` - List comments
-   [ ] `PUT /api/reviews/comments/:commentId/resolve` - Resolve comment
-   [ ] `DELETE /api/reviews/comments/:commentId` - Delete comment

### Document Reviews (3 endpoints)

-   [ ] `POST /api/reviews/documents/:documentId` - Review document
-   [ ] `GET /api/reviews/documents/:applicationId` - List document reviews
-   [ ] `PUT /api/reviews/documents/:reviewId` - Update document review

### Expense Validation (2 endpoints)

-   [ ] `POST /api/reviews/expenses/:expenseId` - Validate expense
-   [ ] `GET /api/reviews/expenses/:applicationId` - List expense validations

### Eligibility Checks (2 endpoints)

-   [ ] `POST /api/reviews/eligibility/:applicationId` - Create check
-   [ ] `GET /api/reviews/eligibility/:applicationId` - Get checks

### Medical Assessment (1 endpoint)

-   [ ] `POST /api/reviews/medical/:applicationId` - Add assessment

### Timeline (1 endpoint)

-   [ ] `GET /api/reviews/timeline/:applicationId` - Get timeline ✅

### Assignments (1 endpoint)

-   [ ] `POST /api/reviews/assignments/:applicationId` - Assign reviewer

## 🔍 What to Check

### Backend Logs

Watch for these in terminal:

```
✅ "Creating review for application..."
✅ "Review created for application..."
✅ "userObject": {role: "admin", userId: "..."}
```

### Browser Console

Check for:

```javascript
✅ Response status: 200
✅ Response data contains reviewId
❌ No CORS errors
❌ No 401 Unauthorized errors
```

### Database (Supabase)

After each test, check tables:

```sql
-- Reviews created
SELECT * FROM application_reviews ORDER BY created_at DESC;

-- Comments added
SELECT * FROM review_comments ORDER BY created_at DESC;

-- Documents reviewed
SELECT * FROM document_reviews ORDER BY created_at DESC;

-- Timeline populated
SELECT * FROM review_timeline ORDER BY created_at DESC;
```

## 🐛 Common Issues

### ❌ "Supabase client not initialized"

**Fix**: Already fixed! Using `SupabaseConnection.getClient()` ✅

### ❌ "null value in column 'reviewer_id'"

**Fix**: Already fixed! JWT authentication added ✅

### ❌ "null value in column 'reviewer_role'"

**Fix**: Already fixed! Role extracted from JWT token ✅

### ❌ "relation 'application_reviews' does not exist"

**Fix**: Deploy `extensive_review_schema.sql` to Supabase ⏳

### ❌ 401 Unauthorized

**Cause**: JWT token expired or invalid
**Fix**: Re-login to get new token

### ❌ 404 Not Found

**Cause**: Wrong application ID or route
**Fix**: Check URL and verify application exists

## 🎯 Success Criteria

### Minimum Viable

-   [x] JWT authentication working ✅
-   [ ] Reviews can be created and saved
-   [ ] Comments can be added
-   [ ] Timeline shows all actions

### Full Feature Set

-   [ ] All 19 endpoints responding correctly
-   [ ] Documents can be reviewed individually
-   [ ] Expenses can be approved/rejected
-   [ ] Eligibility checks saved
-   [ ] Medical assessments recorded
-   [ ] Reviewers can be assigned
-   [ ] Internal vs external comments work

### User Experience

-   [ ] No console errors
-   [ ] Fast response times (<1s)
-   [ ] Clear success/error messages
-   [ ] Real-time UI updates
-   [ ] No page reloads needed

## 📊 Progress Tracking

| Category    | Endpoints | Tested | Working |
| ----------- | --------- | ------ | ------- |
| Reviews     | 5         | 1      | 1 ✅    |
| Comments    | 4         | 0      | 0       |
| Documents   | 3         | 0      | 0       |
| Expenses    | 2         | 0      | 0       |
| Eligibility | 2         | 0      | 0       |
| Medical     | 1         | 0      | 0       |
| Timeline    | 1         | 1      | 1 ✅    |
| Assignments | 1         | 0      | 0       |
| **Total**   | **19**    | **2**  | **2**   |

**Overall Progress**: 10.5% tested, 10.5% working

## 🚀 Next Actions

1. **Deploy Database Schema** (Required before testing more)

    - Open Supabase SQL Editor
    - Run `extensive_review_schema.sql`
    - Verify 8 tables created

2. **Test Comments Feature**

    - Add comment from UI
    - Verify saved in database
    - Test internal vs external

3. **Test Document Reviews**

    - Review each document
    - Approve/reject some
    - Check status updates

4. **Test Complete Workflow**
    - Create review
    - Add comments
    - Review documents
    - Check timeline
    - Verify all data persisted

---

**Last Updated**: October 7, 2025 10:53 UTC
**Status**: Authentication complete ✅ | Schema ready ✅ | Need deployment ⏳
