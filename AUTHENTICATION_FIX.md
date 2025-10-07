# Authentication Fix for Review System

## Problem

The review API endpoints were throwing errors:

```
error: null value in column "reviewer_id" of relation "application_reviews" violates not-null constraint
error: null value in column "reviewer_role" of relation "application_reviews" violates not-null constraint
```

## Root Cause

**Issue 1:** The `reviews.ts` router did not have authentication middleware configured. The authentication middleware was commented out:

```typescript
// All routes require authentication (add auth middleware)
// router.use(authenticateAdmin);
```

This meant that `req.user` was undefined, and therefore `reviewer_id` was null when trying to create reviews.

**Issue 2:** The backend was expecting `reviewerRole` from the request body, but the frontend wasn't sending it. The role should come from the authenticated user's JWT token, not the request body.

## Solution

Added proper JWT authentication middleware to the reviews router:

### 1. Added JWT Import and Authentication Middleware

```typescript
import jwt from "jsonwebtoken";

const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
        res.status(401).json({
            success: false,
            message: "Access token required",
        });
        return;
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your-secret-key"
        ) as any;

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
        return;
    }
};
```

### 2. Applied Middleware to All Routes

```typescript
// All routes require authentication
router.use(authenticateToken);
```

### 3. Get Role from Authenticated User

Changed the code to extract `reviewerRole` from the JWT token instead of request body:

```typescript
const reviewerId = req.user?.userId;
const reviewerRole = req.user?.role; // Get role from authenticated user
```

This ensures the reviewer's role comes from the verified JWT token, not from client input (which is more secure and prevents role spoofing).

### 4. Added Validation and Logging

Added explicit check for `reviewer_id` with helpful error logging:

```typescript
if (!reviewerId) {
    logger.error("Review creation failed: No reviewer ID", {
        user: req.user,
        hasUser: !!req.user,
        userId: req.user?.userId,
    });
    res.status(401).json({
        success: false,
        message: "User authentication required",
    });
    return;
}

logger.info(`Creating review for application ${applicationId}`, {
    reviewerId,
    reviewerRole,
    decision,
});
```

## How Authentication Works

### Frontend Flow

1. User logs in via `/api/auth/login`
2. Backend returns JWT token containing: `{ userId, email, role }`
3. Frontend stores token in localStorage with key `"authToken"`
4. `apiService` automatically includes token in `Authorization: Bearer <token>` header for all API calls

### Backend Flow

1. `authenticateToken` middleware intercepts all review API requests
2. Extracts token from `Authorization` header
3. Verifies token using JWT_SECRET
4. Decodes token payload and attaches to `req.user`
5. Route handler can access `req.user.userId`, `req.user.email`, `req.user.role`

## JWT Token Structure

```json
{
    "userId": "6bdb3eb9-d16e-43b6-8a67-5dedd9b5caf9",
    "email": "obc@jnu.ac.in",
    "role": "admin",
    "iat": 1696662007,
    "exp": 1697266807
}
```

## Testing the Fix

### 1. Verify Backend Server Restarted

```bash
# Check terminal output for:
[nodemon] starting `tsx src/server.ts src/server.ts`
info: Server running on port 3005
```

### 2. Login as Admin User

1. Navigate to http://localhost:5173/admin/login
2. Login with OBC admin credentials
3. Verify you're redirected to OBC Dashboard

### 3. Test Review Creation

1. Click "Review" button on any application
2. Fill in the review form (Eligibility Check tab)
3. Click "Submit Eligibility Check"
4. Should see success message (not 500 error)

### 4. Check Backend Logs

Should see:

```
info: Creating review for application <uuid> {reviewerId, reviewerRole, decision}
```

Instead of:

```
error: null value in column "reviewer_id" violates not-null constraint
```

### 5. Verify with Browser DevTools

**Check Request Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Check localStorage:**

```javascript
localStorage.getItem("authToken");
// Should return a valid JWT token
```

## Files Modified

-   `backend/src/routes/reviews.ts` - Added authentication middleware and validation
-   `backend/src/routes/auth.ts` - Already had JWT token generation
-   `frontend/src/services/api.ts` - Already includes auth token in requests

## Next Steps

1. ✅ Authentication middleware added
2. ✅ Server restarted with new code
3. ⏳ Test review creation from UI
4. ⏳ Deploy database schema (if not already done)
5. ⏳ Test all 19 review endpoints

## Troubleshooting

### If you still get "reviewer_id null" error:

1. **Check if logged in:**

    ```javascript
    // In browser console
    console.log(localStorage.getItem("authToken"));
    ```

2. **Check token is valid:**

    - Visit https://jwt.io
    - Paste token to decode
    - Verify `userId` exists in payload

3. **Check backend logs:**

    - Look for "Review creation failed: No reviewer ID"
    - Check the logged user object

4. **Re-login:**
    - Logout and login again to get fresh token
    - Old tokens might not have been created with proper JWT structure

### If endpoints return 401 Unauthorized:

-   Token expired (7 days expiration)
-   Token missing from localStorage
-   JWT_SECRET mismatch between sessions
-   Need to re-login

## Database Schema Status

⚠️ **Important:** The review tables must be created in Supabase before testing:

```bash
# Run this in Supabase SQL Editor:
# File: database/extensive_review_schema.sql
```

Tables needed:

-   application_reviews
-   review_comments
-   document_reviews
-   expense_validations
-   eligibility_checks
-   medical_assessments
-   review_timeline
-   review_assignments

## API Endpoint Security

All 19 review endpoints now require authentication:

-   POST /api/reviews/applications/:applicationId
-   GET /api/reviews/applications/:applicationId
-   POST /api/reviews/comments
-   GET /api/reviews/comments/:applicationId
-   PATCH /api/reviews/comments/:commentId/resolve
-   POST /api/reviews/documents
-   GET /api/reviews/documents/:applicationId
-   POST /api/reviews/expenses
-   GET /api/reviews/expenses/:applicationId
-   POST /api/reviews/eligibility
-   GET /api/reviews/eligibility/:applicationId
-   POST /api/reviews/medical
-   GET /api/reviews/medical/:applicationId
-   GET /api/reviews/timeline/:applicationId
-   POST /api/reviews/timeline
-   POST /api/reviews/assignments
-   GET /api/reviews/my-assignments
-   PATCH /api/reviews/assignments/:assignmentId
-   GET /api/reviews/summary/:applicationId

All require: `Authorization: Bearer <jwt-token>` header
