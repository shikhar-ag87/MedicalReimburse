# 🚨 URGENT FIXES NEEDED

## Current Issues

### 1. ❌ Invalid Service Role Key
**Error:** `Invalid API key`
**Location:** `backend/.env` line 13
**Current value:** `SUPABASE_SERVICE_KEY=your_service_key_here`

**Action Required:**
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `rrlmnvnasoeecxineqkz`
3. Navigate to: **Settings → API**
4. Find the **`service_role` key** (NOT the `anon` key)
   - It has a ⚠️ warning: "This key has the ability to bypass Row Level Security"
   - It's much longer than the anon key
5. Copy that key
6. Open `backend/.env`
7. Replace line 13 with:
   ```
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS... (paste your actual key)
   ```
8. Save the file
9. Restart backend: `cd backend && npm run dev`

---

### 2. ❌ Missing Enum Values in Database
**Error:** `invalid input value for enum application_status: "back_to_obc"`

**Action Required:**
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to: **SQL Editor**
3. Click: **New Query**
4. Copy and paste this SQL:

```sql
-- Add new status values to the application_status enum
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'back_to_obc';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'reimbursed';

-- Verify the enum values
SELECT unnest(enum_range(NULL::application_status))::text AS status_values;
```

5. Click: **Run** (or press F5)
6. Verify output shows all values including `back_to_obc` and `reimbursed`

---

## Why These Fixes Are Critical

### Without Service Role Key:
- ❌ Status updates fail with "Invalid API key"
- ❌ RLS blocks admin operations
- ❌ Applications can't be forwarded between departments

### Without Enum Values:
- ❌ Health Centre can't send applications back to OBC
- ❌ Super Admin can't mark applications as reimbursed
- ❌ Workflow is broken

---

## Workflow After Fixes

### Correct Flow:
1. **Employee** → Submit → `pending`
2. **OBC Cell** → Review & Approve → `under_review` (forwards to Health Centre)
3. **Health Centre** → Review & Approve → `back_to_obc` (sends back to OBC)
4. **OBC Cell** → Final Review & Approve → `approved` (forwards to Super Admin)
5. **Super Admin** → Approve → `reimbursed` (final status)

---

## Quick Test After Fixes

1. **OBC Dashboard:**
   - Login as: `obc@jnu.ac.in`
   - Review a pending application
   - Click "Approve & Forward"
   - Status should change to `under_review`
   - Application should appear in Health Centre dashboard

2. **Health Centre Dashboard:**
   - Login as: `health@jnu.ac.in`
   - Review the application
   - Click "Approve"
   - Status should change to `back_to_obc`
   - Application should return to OBC dashboard

3. **OBC Dashboard (Final Review):**
   - Check "Back from Health Centre" tab
   - Review the application again
   - Click "Approve & Forward"
   - Status should change to `approved`
   - Application should appear in Super Admin dashboard

4. **Super Admin Dashboard:**
   - Login as: `superadmin@jnu.ac.in`
   - Review the application
   - Click "Approve"
   - Status should change to `reimbursed`
   - ✅ COMPLETE!

---

## Files Modified (Already Done)

✅ Frontend type definitions updated
✅ Backend type definitions updated
✅ Dashboard tabs added
✅ Workflow logic corrected
✅ Status badges updated

## What YOU Need to Do

1. ⚠️ Fix `SUPABASE_SERVICE_KEY` in `backend/.env`
2. ⚠️ Run SQL migration in Supabase SQL Editor
3. ✅ Restart backend server
4. ✅ Test the workflow

---

## Support Files

- Migration SQL: `/home/aloo/MedicalReimburse/database/add_new_status_values.sql`
- Updated Schema: `/home/aloo/MedicalReimburse/database/corrected_database_schema.sql`
- This Guide: `/home/aloo/MedicalReimburse/URGENT_FIXES_NEEDED.md`
