# 🔴 Foreign Key Constraint Violation - Application Not Found

## Error Message
```
ERROR: insert or update on table "eligibility_checks" violates foreign key constraint "fk_eligibility_checks_application"
DETAIL: Key (application_id)=(ab6e3d2c-40de-437e-bb24-0cc952b00704) is not present in table "medical_applications".
```

## What This Means
The foreign key constraint is **working correctly**! It's preventing you from saving a review for an application that doesn't exist in the database.

## Why This Happens

### Scenario 1: Application Was Deleted
- You opened an application in the UI
- Someone deleted it from the database
- You tried to save a review
- ❌ Foreign key prevents orphaned data

### Scenario 2: Wrong Application ID
- Frontend is passing an incorrect application ID
- Application never existed with that ID
- ❌ Foreign key prevents invalid reference

### Scenario 3: Database Not Synced
- Application exists in old database
- You're using a fresh/different Supabase instance
- ❌ Application ID doesn't match

## How to Fix

### Step 1: Run Diagnostic Query
```bash
# Run this in Supabase SQL Editor:
/home/aloo/MedicalReimburse/database/DIAGNOSE_APPLICATION_NOT_FOUND.sql
```

This will show:
- ✅ If the application exists
- 📋 List of valid application IDs you can use
- 🔍 Any orphaned eligibility checks

### Step 2: Use a Valid Application

**Option A: Get application list from database**
```sql
SELECT id, application_number, status, employee_name
FROM medical_applications
WHERE status IN ('pending', 'under_review', 'back_to_obc')
ORDER BY submitted_at DESC
LIMIT 10;
```

**Option B: Create a new test application**
- Go to frontend employee form
- Submit a new medical reimbursement application
- Use that application ID for testing

### Step 3: Backend Now Validates (Already Fixed!)

I've updated the backend to check if the application exists BEFORE trying to save:

```typescript
// Validate that the application exists first
const { data: application } = await client
    .from("medical_applications")
    .select("id")
    .eq("id", applicationId)
    .maybeSingle();

if (!application) {
    res.status(404).json({
        success: false,
        error: "Application not found",
    });
    return;
}
```

Now you'll get a clear 404 error instead of a cryptic foreign key violation!

## Testing Steps

### 1. Find a Valid Application ID
```sql
-- Run in Supabase
SELECT id FROM medical_applications LIMIT 1;
```

### 2. Test in Browser Console
```javascript
// Replace with actual application ID from step 1
const appId = "YOUR-VALID-UUID-HERE";

fetch(`http://localhost:3000/api/reviews/eligibility/${appId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR-JWT-TOKEN'
  },
  body: JSON.stringify({
    isScStObcVerified: true,
    categoryProofValid: true,
    // ... other fields
  })
})
.then(r => r.json())
.then(console.log);
```

### 3. Test Full Workflow
1. Submit a NEW application from frontend
2. Login as OBC admin
3. Open that application for review
4. Fill eligibility form
5. Save (should work now!)

## Common Causes

### ❌ Stale Frontend State
**Problem:** Frontend has old application ID in memory
**Fix:** Refresh the page, reload application list

### ❌ Copy-Paste Error
**Problem:** Testing with hardcoded UUID that doesn't exist
**Fix:** Use actual ID from database

### ❌ Database Reset
**Problem:** Ran schema migration that deleted data
**Fix:** Re-submit test applications

### ❌ Wrong Environment
**Problem:** Frontend pointing to different Supabase than backend
**Fix:** Check `.env` files match

## Prevention

### Backend Now Validates ✅
- Checks application exists before insert
- Returns clear 404 error
- Prevents cryptic foreign key violations

### Frontend Should Check
Before opening review modal, ensure application is loaded:
```typescript
if (!application || !application.id) {
  console.error("Cannot review: Application not loaded");
  return;
}
```

## Quick Resolution

**90% of the time, this fixes it:**

```bash
# 1. Restart backend (picks up validation changes)
cd backend && npm run dev

# 2. In frontend, REFRESH the applications list
# 3. Open a FRESH application from the list
# 4. Try reviewing again
```

## When to Worry

🟢 **Normal:** Foreign key doing its job, preventing bad data
🟡 **Check:** Make sure you're using valid application IDs
🔴 **Problem:** If ALL applications fail, check database connection

## Files Changed

- ✅ `backend/src/routes/reviews.ts` - Added application existence validation
- 📄 `database/DIAGNOSE_APPLICATION_NOT_FOUND.sql` - Diagnostic queries
- 📄 `database/FK_CONSTRAINT_TROUBLESHOOTING.md` - This guide

---

**TL;DR:** Use a valid application ID from your database. The foreign key is protecting your data integrity! 🛡️
