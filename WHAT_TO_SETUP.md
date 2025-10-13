# 📋 What You Need to Setup - Summary

Hi! Based on your request, here's **exactly** what you need to do to get everything working:

---

## ✅ What's Already Working

You mentioned everything works **till status tracking**, so these are good:
- ✅ Employee form (all 6 steps)
- ✅ Form submission
- ✅ Status tracking page
- ✅ Backend API
- ✅ Frontend UI

---

## ⚠️ What Needs Setup

### 1. 🗄️ **Database Setup** (CRITICAL - Do First!)

Run these SQL files in your Supabase/PostgreSQL database:

```bash
# Main database schema (creates all tables)
psql -U postgres -d your_database -f database/corrected_database_schema.sql

# Admin users (creates test login accounts)
psql -U postgres -d your_database -f database/insert_admin_users.sql
```

**Or via Supabase Dashboard:**
1. Go to SQL Editor
2. Copy contents of `corrected_database_schema.sql`
3. Run it
4. Copy contents of `insert_admin_users.sql`
5. Run it

---

### 2. 📁 **File Upload Directory**

Create the uploads folder:

```bash
cd backend
mkdir -p uploads
chmod 755 uploads
```

**Why?** Files selected in Step 5 need somewhere to be saved!

---

### 3. ⚙️ **Environment Variables**

Make sure your `.env` files are configured:

**Backend** (`backend/.env`):
```env
DATABASE_URL=your_supabase_connection_string
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your-secret-key
PORT=3005
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3005/api
```

---

### 4. 🧪 **Test File Upload** (Just Fixed!)

I just fixed the file upload issue. You need to test:

1. Fill out employee form (Steps 1-6)
2. **In Step 5, upload 2-3 test files**
3. Submit the form
4. Check:
   - ✅ Console shows "Documents uploaded successfully"
   - ✅ Files exist in `backend/uploads/{application-id}/`
   - ✅ Database has records in `application_documents` table

**If files don't upload**, check:
- `backend/uploads/` directory exists
- Backend console for errors
- Browser console (F12) for errors

---

### 5. 👤 **Test Admin Features**

These need testing since you only tested employee features:

#### A) Admin Login
1. Go to http://localhost:5173/admin/login
2. Try logging in:
   - Email: `obc.admin@jnu.ac.in`
   - Password: `OBC@dmin2024!`
3. Should redirect to OBC Dashboard

#### B) OBC Dashboard
1. Should see list of applications
2. Should see your test application from employee form
3. Try clicking "View" to see details
4. Try clicking "Review" to approve/reject

#### C) Review Workflow
1. As OBC Admin, review and approve an application
2. Logout
3. Login as Health Centre Admin:
   - Email: `health.admin@jnu.ac.in`
   - Password: `Health@dmin2024!`
4. Should see the same application
5. Review and approve again

---

## 🎯 Priority Order

Do these in this order:

1. **FIRST**: Run database schemas ⭐⭐⭐
2. **SECOND**: Create uploads directory ⭐⭐⭐
3. **THIRD**: Test file upload ⭐⭐
4. **FOURTH**: Test admin login ⭐⭐
5. **FIFTH**: Test review workflow ⭐

---

## 📊 How to Verify Everything Works

### Quick Verification Commands

```bash
# 1. Check backend is running
curl http://localhost:3005/health

# 2. Check uploads directory exists
ls -la backend/uploads/

# 3. Check database has tables
psql -U postgres -d your_database -c "\dt"

# 4. Check admin users exist
psql -U postgres -d your_database -c "SELECT email, role FROM users WHERE role LIKE '%admin%';"
```

### Database Verification Queries

```sql
-- Check all tables exist
\dt

-- Expected tables:
-- users
-- medical_applications
-- application_expenses
-- application_documents
-- reviews
-- audit_logs

-- Check admin users
SELECT id, username, email, role 
FROM users 
WHERE role IN ('obc_admin', 'health_centre_admin', 'super_admin');

-- Should return 3 users

-- Check if any applications exist
SELECT application_number, status, employee_name 
FROM medical_applications 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if files uploaded
SELECT original_name, file_size, document_type
FROM application_documents
ORDER BY uploaded_at DESC
LIMIT 10;
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Admin login fails"
**Solution:**
```sql
-- Check if users exist
SELECT * FROM users WHERE role = 'obc_admin';

-- If no result, rerun:
psql -U postgres -d your_db -f database/insert_admin_users.sql
```

### Issue 2: "Files not uploading"
**Solution:**
```bash
# Create directory
mkdir -p backend/uploads
chmod 755 backend/uploads

# Check backend console for errors
# Check browser console (F12) for errors
```

### Issue 3: "Empty admin dashboard"
**Solution:**
```sql
-- Check if applications exist
SELECT COUNT(*) FROM medical_applications;

-- If 0, submit a test application first

-- Check RLS policies aren't blocking
-- Temporarily disable to test:
ALTER TABLE medical_applications DISABLE ROW LEVEL SECURITY;
-- (Re-enable after testing!)
```

### Issue 4: "Backend can't connect to database"
**Solution:**
- Check `.env` has correct `DATABASE_URL`
- Check Supabase project is active
- Check `SUPABASE_SERVICE_ROLE_KEY` is correct (not anon key)

---

## 📖 Documentation Files

I created these guides for you:

| File | Purpose |
|------|---------|
| **COMPLETE_SETUP_GUIDE.md** | Detailed step-by-step setup (READ THIS!) |
| **SETUP_CARD.md** | Quick reference card |
| **FILE_UPLOAD_FIX.md** | Details about file upload fix |
| **QUERY_SYSTEM_*.md** | Query/communication system docs (optional) |

---

## 🚀 Quick Start (10 Minutes)

```bash
# 1. Database (2 min)
psql -U postgres -d your_db -f database/corrected_database_schema.sql
psql -U postgres -d your_db -f database/insert_admin_users.sql

# 2. Backend (1 min)
cd backend
mkdir -p uploads
npm run dev

# 3. Frontend (1 min) - in new terminal
cd frontend
npm run dev

# 4. Test Employee Form (3 min)
# Go to http://localhost:5173
# Fill all steps
# Upload files in Step 5
# Submit

# 5. Test Admin (3 min)
# Go to http://localhost:5173/admin/login
# Login: obc.admin@jnu.ac.in / OBC@dmin2024!
# Review your application
```

---

## ✅ Success Checklist

You're fully set up when:

- [ ] Database has all tables (`\dt` shows 8+ tables)
- [ ] Admin users exist (can query `users` table)
- [ ] Backend running at http://localhost:3005
- [ ] Frontend running at http://localhost:5173
- [ ] Can submit employee form
- [ ] **Files upload successfully** (check `backend/uploads/`)
- [ ] Can login as OBC admin
- [ ] Can see applications in dashboard
- [ ] Can review and approve applications
- [ ] Application status changes after review
- [ ] Can download uploaded files from admin panel

---

## 🎯 Bottom Line

**You need to do 3 things:**

1. ✅ **Run database schemas** (create tables and admin users)
2. ✅ **Create uploads directory** (for file storage)
3. ✅ **Test the new features** (admin login, review, file upload)

Everything else is already working! 🎉

---

**Need Help?** 
- Read `COMPLETE_SETUP_GUIDE.md` for detailed instructions
- Check backend console for errors
- Check browser console (F12) for frontend errors
- Run the verification queries above

**Ready to start?** Begin with the Quick Start section above! 🚀

---

**Last Updated**: October 11, 2025  
**Status**: Ready for setup and testing
