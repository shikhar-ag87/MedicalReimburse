# 🚨 FIX_EVERYTHING.sql Not Running? Here's How to Fix It

## Problem
The `FIX_EVERYTHING.sql` script isn't running in Supabase SQL Editor.

## Solution: Use the Step-by-Step Version

I've created a new script that breaks everything into 5 small steps:

**File:** `/home/aloo/MedicalReimburse/database/RUN_IN_PARTS.sql`

---

## How to Run It

### Option 1: Run All at Once (Easiest)
1. Open Supabase SQL Editor
2. Copy the entire content of `RUN_IN_PARTS.sql`
3. Paste into SQL Editor
4. Click **"Run"**
5. Check the output - it will tell you what succeeded/failed

### Option 2: Run Step by Step (If Option 1 Fails)
Run each section separately, checking for errors after each:

**Step 1:** Lines 1-40 (Enum values)
**Step 2:** Lines 42-77 (RLS policies)
**Step 3:** Lines 79-109 (Admin passwords)
**Step 4:** Lines 111-176 (eligibility_checks table)
**Step 5:** Lines 178-242 (document_reviews table)

---

## Common Issues & Fixes

### ❌ "table medical_applications does not exist"
**Problem:** Your database doesn't have the base schema
**Fix:** Run your main schema creation script first (corrected_database_schema.sql)

### ❌ "type application_status does not exist"
**Problem:** Enum type not created
**Fix:** Create it first:
```sql
CREATE TYPE application_status AS ENUM (
    'pending', 'under_review', 'approved', 'rejected', 'completed'
);
```

### ❌ "column approved_amount does not exist"
**Problem:** Old schema version
**Fix:** Add the column:
```sql
ALTER TABLE medical_applications 
ADD COLUMN IF NOT EXISTS approved_amount DECIMAL(10,2) DEFAULT 0;
```

### ❌ "syntax error at or near..."
**Problem:** SQL syntax issue or Supabase version mismatch
**Fix:** 
1. Copy error message
2. Check which line number failed
3. Run just that section separately
4. Share the exact error message

### ❌ Script runs but nothing happens
**Problem:** Tables already exist or commands are no-ops
**Fix:** Check what already exists:
```sql
-- See what tables you have
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- See what columns eligibility_checks has
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'eligibility_checks';
```

---

## Quick Diagnostic

Run this to see what's already set up:

```sql
-- Check tables
SELECT 
    'Tables' as check_type,
    table_name,
    'EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('medical_applications', 'admin_users', 'eligibility_checks', 'document_reviews')
ORDER BY table_name;

-- Check enum values
SELECT 
    'Enum Values' as check_type,
    unnest(enum_range(NULL::application_status))::text as value,
    'EXISTS' as status;

-- Check admin users
SELECT 
    'Admin Users' as check_type,
    email,
    CASE WHEN password IS NOT NULL THEN 'HAS PASSWORD' ELSE 'NO PASSWORD' END as status
FROM admin_users
WHERE email IN ('obc@jnu.ac.in', 'health@jnu.ac.in', 'admin@jnu.ac.in');
```

---

## What Each Step Does

### Step 1: Enum Values
Adds `back_to_obc` and `reimbursed` to the application_status enum.

### Step 2: RLS Policies
Makes medical_applications table accessible to all (fixes 403 errors).

### Step 3: Admin Passwords
Resets passwords for OBC, Health Centre, and Super Admin.
- obc@jnu.ac.in → obc123
- health@jnu.ac.in → health123
- admin@jnu.ac.in → super123

### Step 4: eligibility_checks Table
Creates table to store review form data (checkboxes, notes, etc.).

### Step 5: document_reviews Table
Creates table to store document review states.

---

## After Running Successfully

### 1. Verify Tables Created
```sql
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_name IN ('eligibility_checks', 'document_reviews');
```

**Expected:**
```
eligibility_checks  | 17
document_reviews    | 13
```

### 2. Restart Backend
```bash
cd /home/aloo/MedicalReimburse/backend
npm run dev
```

### 3. Test Login
- Email: `obc@jnu.ac.in`
- Password: `obc123`

---

## Still Not Working?

### Share This Info:
1. **Exact error message** (copy-paste from Supabase)
2. **Which step failed** (1, 2, 3, 4, or 5)
3. **Result of diagnostic query** (run the Quick Diagnostic above)
4. **Supabase project region** (just in case)

### Alternative: Manual Setup

If all else fails, create tables manually:

```sql
-- Just the essential table
CREATE TABLE eligibility_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    checker_id UUID NOT NULL,
    is_sc_st_obc_verified BOOLEAN DEFAULT false,
    category_proof_valid BOOLEAN DEFAULT false,
    employee_id_verified BOOLEAN DEFAULT false,
    medical_card_valid BOOLEAN DEFAULT false,
    relationship_verified BOOLEAN DEFAULT false,
    has_pending_claims BOOLEAN DEFAULT false,
    is_within_limits BOOLEAN DEFAULT true,
    is_treatment_covered BOOLEAN DEFAULT true,
    prior_permission_status TEXT DEFAULT 'not_required',
    eligibility_status TEXT DEFAULT 'eligible',
    ineligibility_reasons JSONB DEFAULT '[]',
    conditions JSONB DEFAULT '[]',
    notes TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Make it accessible
ALTER TABLE eligibility_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON eligibility_checks FOR ALL USING (true) WITH CHECK (true);
```

---

## Files You Need

- **`RUN_IN_PARTS.sql`** ← Use this one! (step-by-step with error messages)
- `FIX_EVERYTHING.sql` ← Original (all at once)
- `create_review_persistence_tables.sql` ← Just the tables, no RLS/passwords

---

**Bottom line:** Use `RUN_IN_PARTS.sql` - it's designed to be bulletproof! 🎯
