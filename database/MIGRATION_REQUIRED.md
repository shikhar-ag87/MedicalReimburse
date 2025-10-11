# 🚨 CRITICAL: Database Migration Required

## Problem
The database enum `application_status` is missing the new status values `'back_to_obc'` and `'reimbursed'`.

## Error Message
```
API Error 500: Failed to update application status: invalid input value for enum application_status: "back_to_obc"
```

## Solution
Run the migration script to add the new status values to the database.

---

## 📋 Step-by-Step Migration Instructions

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `rrlmnvnasoeecxineqkz`
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Migration Script
1. Click **"New Query"** button
2. Copy the contents of `/home/aloo/MedicalReimburse/database/add_new_status_values.sql`
3. Paste into the SQL Editor
4. Click **"Run"** button (or press Ctrl+Enter)

### Step 3: Verify Success
You should see output showing all status values including the new ones:
```
pending
under_review
back_to_obc      ← NEW
approved
rejected
completed
reimbursed       ← NEW
```

### Step 4: Restart Backend Server
After the migration completes:
```bash
cd /home/aloo/MedicalReimburse/backend
# Stop the running server (Ctrl+C)
npm run dev
```

---

## ✅ What This Migration Does

Adds two new status values to support the complete workflow:

### New Workflow (After Migration):
1. **Employee** submits application → `pending`
2. **OBC Cell** reviews & forwards → `under_review` (goes to Health Centre)
3. **Health Centre** reviews & approves → `back_to_obc` (goes back to OBC)
4. **OBC Cell** final review & forwards → `approved` (goes to Super Admin)
5. **Super Admin** marks as reimbursed → `reimbursed` (FINAL STATUS)

---

## 🔍 Verification Queries

After migration, you can verify the data:

```sql
-- Count applications by status
SELECT status, COUNT(*) 
FROM medical_applications 
GROUP BY status 
ORDER BY status;

-- Check if any applications need to be updated
SELECT id, application_number, status 
FROM medical_applications 
WHERE status IN ('under_review', 'approved')
LIMIT 10;
```

---

## ⚠️ Important Notes

1. **This is a NON-DESTRUCTIVE migration** - it only adds new enum values
2. **Existing data is NOT affected** - all current statuses remain valid
3. **Run this BEFORE testing the Health Centre approval workflow**
4. **The migration uses `IF NOT EXISTS`** - safe to run multiple times

---

## 🐛 Troubleshooting

### If you see "permission denied"
- Make sure you're logged in to Supabase with the correct account
- Verify you have admin access to the project

### If enum values already exist
- The migration will succeed silently (IF NOT EXISTS clause)
- No duplicate values will be created

### If backend still shows errors after migration
- Restart the backend server completely
- Clear any cached connections
- Check that SUPABASE_SERVICE_KEY is correctly set in `.env`

---

## 📝 After Migration

Test the complete workflow:
1. OBC approves a pending application → should go to Health Centre (`under_review`)
2. Health Centre approves → should go back to OBC (`back_to_obc`)
3. OBC reviews `back_to_obc` application → should forward to Super Admin (`approved`)
4. Super Admin marks as reimbursed → final status (`reimbursed`)
