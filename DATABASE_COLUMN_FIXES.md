# Database Column Mapping Fixes

## Issue
The backend repositories were using incorrect column names that didn't match the actual Supabase database schema.

## Fixes Applied

### 1. MedicalApplicationRepository ✅
**Wrong:** `total_amount_passed`  
**Correct:** `approved_amount`

**Files Modified:**
- `backend/src/database/repositories/supabase/MedicalApplicationRepository.ts`

**Changes:**
- Line 47: `total_amount_passed` → `approved_amount` (INSERT)
- Line 140: `total_amount_passed` → `approved_amount` (UPDATE)
- Line 346: `total_amount_passed` → `approved_amount` (SELECT mapping)

---

### 2. ExpenseItemRepository ✅
**Wrong:** `amount_passed`  
**Correct:** `amount_approved`

**Files Modified:**
- `backend/src/database/repositories/supabase/ExpenseItemRepository.ts`

**Changes:**
- Line 23: `amount_passed` → `amount_approved` (INSERT)
- Line 37: `amount_passed` → `amount_approved` (SELECT mapping - create)
- Line 63: `amount_passed` → `amount_approved` (SELECT mapping - findById)
- Line 87: `amount_passed` → `amount_approved` (SELECT mapping - findAll)
- Line 103: `amount_passed` → `amount_approved` (SELECT query)
- Line 113: `amount_passed` → `amount_approved` (reduce calculation)
- Line 133: `amount_passed` → `amount_approved` (UPDATE)
- Line 150: `amount_passed` → `amount_approved` (SELECT mapping - update result)

---

### 3. UserRepository ✅
**Wrong:** `password_hash`  
**Correct:** `password`

**Files Modified:**
- `backend/src/database/repositories/supabase/UserRepository.ts`

**Changes:**
- Line 15: `password_hash` → `password` (SELECT mapping)
- Line 38: Confirmed `password` is correct (INSERT)

---

### 4. ApplicationDocumentRepository ✅
**Wrong:** `uploaded_at`  
**Correct:** `upload_timestamp`

**Files Modified:**
- `backend/src/database/repositories/supabase/ApplicationDocumentRepository.ts`

**Changes:**
- Line 43: `uploaded_at` → `upload_timestamp` (SELECT mapping - create)
- Line 69: `uploaded_at` → `upload_timestamp` (SELECT mapping - findById)
- Line 86: `uploaded_at` → `upload_timestamp` (ORDER BY)
- Line 100: `uploaded_at` → `upload_timestamp` (SELECT mapping - findAll)
- Line 141: `uploaded_at` → `upload_timestamp` (SELECT mapping - update result)

---

## Database Schema Reference

### medical_applications table
```sql
total_amount_claimed DECIMAL(10,2) NOT NULL DEFAULT 0,
approved_amount DECIMAL(10,2),  -- NOT total_amount_passed
```

### expense_items table
```sql
amount_claimed DECIMAL(10,2) NOT NULL,
amount_approved DECIMAL(10,2),  -- NOT amount_passed
```

### admin_users table
```sql
password VARCHAR(255) NOT NULL,  -- NOT password_hash
```

### application_documents table
```sql
upload_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- NOT uploaded_at
```

---

## Testing

After these fixes, the following should work:
- ✅ Employee can submit application with expenses
- ✅ Backend correctly inserts into expense_items table
- ✅ Backend correctly inserts into medical_applications table
- ✅ Admin login works (password column correct)
- ✅ Expense totals calculate correctly
- ✅ Approved amounts update correctly

---

## Status: ALL FIXED ✅

All repository column names now match the actual Supabase database schema.
Backend should restart successfully and application submission should work.

---

**Date:** 2025-10-11  
**Backend Server:** Will auto-reload via nodemon
