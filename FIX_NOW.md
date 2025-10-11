# 🚨 IMMEDIATE ACTION REQUIRED

## You have 2 CRITICAL issues to fix:

### ❌ Issue 1: Database enum missing values
**Error:** `invalid input value for enum application_status: "back_to_obc"`

### ❌ Issue 2: Admin passwords not set correctly
**Error:** `Invalid email or password` (401)

---

## ✅ ONE-STEP FIX

### Run this SQL script in Supabase:

1. Open: **https://supabase.com/dashboard**
2. Select project: **rrlmnvnasoeecxineqkz**
3. Go to: **SQL Editor** (left sidebar)
4. Click: **New Query**
5. Copy the entire file: `/home/aloo/MedicalReimburse/database/COMPLETE_SETUP.sql`
6. Paste into SQL Editor
7. Click: **Run** (or press F5)

### What the script does:
- ✅ Adds `back_to_obc` status to enum
- ✅ Adds `reimbursed` status to enum
- ✅ Updates OBC password to `obc123`
- ✅ Updates Health Centre password to `health123`
- ✅ Updates Super Admin password to `super123`
- ✅ Shows verification results

---

## 📋 Test After Running SQL

### 1. Login as OBC Admin
- Go to: `http://localhost:5173/admin/login`
- Email: `obc@jnu.ac.in`
- Password: `obc123`
- Should redirect to OBC Dashboard ✅

### 2. Login as Health Centre
- Go to: `http://localhost:5173/admin/login`
- Email: `health@jnu.ac.in`
- Password: `health123`
- Should redirect to Health Centre Dashboard ✅

### 3. Login as Super Admin
- Go to: `http://localhost:5173/admin/login`
- Email: `admin@jnu.ac.in`
- Password: `super123`
- Should redirect to Super Admin Dashboard ✅

---

## ⚠️ Still Need Service Role Key

After fixing the database, you STILL need to add the service role key:

1. In Supabase Dashboard: **Settings → API**
2. Find: **service_role secret**
3. Copy the long key (starts with `eyJhbGc...`)
4. Edit: `backend/.env` line 13
5. Replace: `SUPABASE_SERVICE_KEY=your_service_key_here`
6. With: `SUPABASE_SERVICE_KEY=eyJhbG...` (your actual key)
7. Save and restart backend

---

## 🎯 Priority Order

1. **FIRST:** Run `COMPLETE_SETUP.sql` in Supabase (fixes enum + passwords)
2. **SECOND:** Add service role key to `.env` (fixes RLS)
3. **THIRD:** Restart backend server
4. **FOURTH:** Test login and workflow

---

## Files to Use

- Complete Setup: `/home/aloo/MedicalReimburse/database/COMPLETE_SETUP.sql`
- Environment: `/home/aloo/MedicalReimburse/backend/.env`
- Credentials: `/home/aloo/MedicalReimburse/ADMIN_CREDENTIALS.md`
