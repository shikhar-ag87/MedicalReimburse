# 🚀 Complete Setup & Testing Guide - Medical Reimbursement System

## ✅ Current Status
**Working Features:**
- ✅ Employee Form (all 6 steps)
- ✅ Status Tracking
- ✅ File Upload (just fixed!)
- ✅ Backend API
- ✅ Database schema

**Needs Setup/Testing:**
- ⚠️ Admin Features (OBC, Health Centre, Super Admin)
- ⚠️ Query/Communication System
- ⚠️ File Upload (needs testing)

---

## 📋 Setup Checklist

### Phase 1: Database Setup (CRITICAL - Do This First!)

#### Step 1: Run Main Database Schema
```bash
# This creates all core tables
psql -U postgres -d your_database_name -f database/corrected_database_schema.sql
```

**What it creates:**
- ✅ `users` table
- ✅ `medical_applications` table
- ✅ `application_expenses` table
- ✅ `application_documents` table
- ✅ `reviews` table
- ✅ `audit_logs` table
- ✅ RLS policies
- ✅ Triggers and functions

#### Step 2: Create Admin Users
```bash
# This creates test admin accounts
psql -U postgres -d your_database_name -f database/insert_admin_users.sql
```

**Creates these users:**
| Role | Email | Password | Username |
|------|-------|----------|----------|
| OBC Admin | obc.admin@jnu.ac.in | OBC@dmin2024! | obc_admin |
| Health Centre | health.admin@jnu.ac.in | Health@dmin2024! | health_admin |
| Super Admin | super.admin@jnu.ac.in | Super@dmin2024! | super_admin |

#### Step 3: (Optional) Run Query System Schema
```bash
# Only if you want the query/communication feature
psql -U postgres -d your_database_name -f database/query_system_schema.sql
```

**What it creates:**
- ✅ `application_queries` table
- ✅ `query_messages` table
- ✅ `query_attachments` table
- ✅ Query system triggers and functions

#### Step 4: Verify Database Setup
```sql
-- Connect to your database
psql -U postgres -d your_database_name

-- Check tables exist
\dt

-- Check admin users
SELECT id, username, email, role FROM users WHERE role IN ('obc_admin', 'health_centre_admin', 'super_admin');

-- Check RLS policies
\d medical_applications
\d+ medical_applications

-- Exit
\q
```

**Expected output:**
```
                     List of relations
 Schema |           Name           |   Type   |  Owner
--------+--------------------------+----------+----------
 public | application_documents    | table    | postgres
 public | application_expenses     | table    | postgres
 public | application_queries      | table    | postgres
 public | audit_logs               | table    | postgres
 public | medical_applications     | table    | postgres
 public | query_attachments        | table    | postgres
 public | query_messages           | table    | postgres
 public | reviews                  | table    | postgres
 public | users                    | table    | postgres
```

---

### Phase 2: Backend Setup

#### Step 1: Install Dependencies
```bash
cd backend
npm install
```

#### Step 2: Configure Environment Variables
Create/update `backend/.env`:
```env
# Database (Supabase)
DATABASE_URL=your_supabase_connection_string
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=3005
NODE_ENV=development

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

#### Step 3: Create Uploads Directory
```bash
# From backend directory
mkdir -p uploads
chmod 755 uploads
```

#### Step 4: Start Backend Server
```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm run build
npm start
```

**Expected output:**
```
[INFO] Server starting on port 3005
[INFO] Database connected successfully
[INFO] Server running at http://localhost:3005
[INFO] Swagger docs available at http://localhost:3005/api-docs
```

#### Step 5: Test Backend Health
```bash
# Test health endpoint
curl http://localhost:3005/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-10-11T...",
  "uptime": 123.45,
  "database": "connected"
}
```

---

### Phase 3: Frontend Setup

#### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

#### Step 2: Configure Environment Variables
Create/update `frontend/.env`:
```env
VITE_API_URL=http://localhost:3005/api
VITE_APP_NAME=Medical Reimbursement System
```

#### Step 3: Start Frontend Server
```bash
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

---

## 🧪 Testing Checklist

### Test 1: Employee Form Submission ✅

#### Steps:
1. Open http://localhost:5173/
2. Fill out **Step 1: Employee Details**
   - Faculty/Employee Name: John Doe
   - Designation: Professor
   - School/Centre: School of Computer Science
   - CGHS Card Number: 12345678
   - CGHS Dispensary: JNU Dispensary
   - Card Validity: 2025-12-31
   - Ward Entitlement: Private

3. Fill out **Step 2: Patient Details**
   - Patient Name: Jane Doe
   - CGHS Card Number: 12345679
   - Relationship: Spouse

4. Fill out **Step 3: Treatment Details**
   - Hospital Name: AIIMS
   - Hospital Address: Ansari Nagar, New Delhi
   - Treatment Type: OPD
   - Clothes Provided: No
   - Prior Permission: No
   - Emergency Treatment: No
   - Health Insurance: No

5. Fill out **Step 4: Expense Details**
   - Click "Add Expense"
   - Bill No: 001
   - Date: Today
   - Particulars: Consultation
   - Amount Claimed: 1000
   - Amount Passed: 1000

6. Fill out **Step 5: Document Upload** 🆕 **TEST THIS!**
   - Enclosures: 3
   - Check all required documents
   - Click "Choose Files"
   - Select 2-3 test files (PDF, images)
   - Verify files appear in list
   - ⚠️ **Check console** for any errors

7. Fill out **Step 6: Declaration**
   - Place: New Delhi
   - Date: Today
   - Faculty/Employee ID: EMP123
   - Mobile: 9876543210
   - Email: john.doe@jnu.ac.in
   - Bank Name: SBI
   - Branch: JNU Campus
   - Account Number: 1234567890
   - IFSC Code: SBIN0001234
   - Signature: John Doe

8. Click "Submit Application"

#### Expected Results:
✅ Success page appears
✅ Application ID displayed
✅ Reference number shown
✅ Console shows "Documents uploaded successfully"
✅ No errors in console

#### Verify in Backend:
```bash
# Check uploads directory
ls -la backend/uploads/

# Should see a folder with application ID
ls -la backend/uploads/{application-id}/

# Should see your uploaded files
```

#### Verify in Database:
```sql
-- Check application created
SELECT id, application_number, status, employee_name 
FROM medical_applications 
ORDER BY created_at DESC 
LIMIT 1;

-- Check files uploaded
SELECT id, original_name, file_size, document_type
FROM application_documents
WHERE application_id = 'your-application-id';
```

---

### Test 2: Status Tracking ✅

#### Steps:
1. Go to http://localhost:5173/status
2. Enter the application number from Test 1
3. Click "Track Status"

#### Expected Results:
✅ Application details displayed
✅ Status shows "Pending"
✅ Timeline shows submission
✅ No errors

---

### Test 3: Admin Login 🆕 **TEST THIS!**

#### Steps:
1. Go to http://localhost:5173/admin/login
2. Login with OBC Admin credentials:
   - Email: `obc.admin@jnu.ac.in`
   - Password: `OBC@dmin2024!`
3. Click "Sign In"

#### Expected Results:
✅ Redirects to OBC Dashboard
✅ Shows list of applications
✅ Shows application from Test 1
✅ Token stored in localStorage

#### If Login Fails:
```bash
# Check if admin users exist
psql -U postgres -d your_database_name

SELECT id, username, email, role, password_hash 
FROM users 
WHERE email = 'obc.admin@jnu.ac.in';

# If no results, run:
\i database/insert_admin_users.sql
```

---

### Test 4: OBC Dashboard 🆕 **TEST THIS!**

#### Prerequisites:
- Completed Test 3 (logged in as OBC Admin)
- Application exists from Test 1

#### Steps:
1. Should be on http://localhost:5173/admin/obc
2. Verify you see the applications table
3. Find the application from Test 1
4. Click "View Details"

#### Expected Results:
✅ Dashboard loads
✅ Applications table visible
✅ Can view application details
✅ Can see review options

#### If Dashboard is Empty:
```sql
-- Check application status
SELECT id, application_number, status, employee_name
FROM medical_applications;

-- Applications should have status 'pending' to appear in OBC dashboard
```

---

### Test 5: Review Application 🆕 **TEST THIS!**

#### Steps:
1. In OBC Dashboard, click "Review" on an application
2. Fill in review form:
   - Recommendation: Approve
   - Amount Approved: 1000
   - Comments: "All documents verified"
3. Click "Submit Review"

#### Expected Results:
✅ Success message
✅ Application status changes
✅ Review appears in timeline
✅ Application moves to next stage

#### Verify in Database:
```sql
-- Check review created
SELECT id, reviewer_role, recommendation, comments
FROM reviews
WHERE application_id = 'your-application-id'
ORDER BY reviewed_at DESC;

-- Check application status updated
SELECT id, application_number, status
FROM medical_applications
WHERE id = 'your-application-id';
```

---

### Test 6: Health Centre Dashboard 🆕 **TEST THIS!**

#### Steps:
1. Logout from OBC Admin
2. Login as Health Centre Admin:
   - Email: `health.admin@jnu.ac.in`
   - Password: `Health@dmin2024!`
3. Go to http://localhost:5173/admin/health-centre
4. Review the same application

#### Expected Results:
✅ Can see applications forwarded by OBC
✅ Can review and approve/reject
✅ Can add comments

---

### Test 7: Super Admin Dashboard 🆕 **TEST THIS!**

#### Steps:
1. Logout from Health Centre Admin
2. Login as Super Admin:
   - Email: `super.admin@jnu.ac.in`
   - Password: `Super@dmin2024!`
3. Go to http://localhost:5173/admin/super
4. View all applications and analytics

#### Expected Results:
✅ Can see ALL applications (all statuses)
✅ Can see user management
✅ Can view analytics/statistics
✅ Can perform any action

---

### Test 8: File Download 🆕 **TEST THIS!**

#### Steps:
1. Login as any admin
2. View an application with uploaded documents
3. Click download button on a document

#### Expected Results:
✅ File downloads successfully
✅ Correct filename
✅ Correct file content

#### If Download Fails:
- Check `backend/uploads/{application-id}/` directory exists
- Check file permissions: `chmod 644 backend/uploads/*/*`
- Check backend logs for errors

---

## 🐛 Troubleshooting

### Issue: Backend won't start

#### Error: "Database connection failed"
```bash
# Check Supabase credentials
cat backend/.env

# Test connection
curl https://your-project.supabase.co/rest/v1/

# Verify SUPABASE_SERVICE_ROLE_KEY is correct
```

#### Error: "Port 3005 already in use"
```bash
# Kill existing process
lsof -ti:3005 | xargs kill -9

# Or use different port
PORT=3006 npm run dev
```

---

### Issue: Frontend won't connect to backend

#### Error: "Network error" or "Failed to fetch"
```bash
# Check backend is running
curl http://localhost:3005/health

# Check CORS settings in backend/src/app.ts
# Should allow localhost:5173

# Check frontend .env
cat frontend/.env
# Should have: VITE_API_URL=http://localhost:3005/api
```

---

### Issue: Admin login fails

#### Error: "Invalid credentials"
```sql
-- Check if users exist
SELECT username, email, role FROM users WHERE role LIKE '%admin%';

-- If empty, insert admin users
\i database/insert_admin_users.sql

-- Verify passwords are hashed
SELECT length(password_hash) FROM users WHERE role = 'obc_admin';
-- Should return ~60 (bcrypt hash length)
```

---

### Issue: Files not uploading

#### Symptoms:
- Files selected but not saved
- "No files uploaded" error
- Files disappear after submission

#### Solutions:
1. **Check uploads directory exists:**
   ```bash
   ls -la backend/uploads/
   # If not exists:
   mkdir -p backend/uploads
   chmod 755 backend/uploads
   ```

2. **Check console for errors:**
   - Open browser DevTools (F12)
   - Check Console tab
   - Look for "Document upload failed" errors

3. **Check backend logs:**
   ```bash
   # In backend terminal
   # Look for "File upload error" messages
   ```

4. **Check database:**
   ```sql
   -- Check if documents table exists
   \d application_documents
   
   -- Check if any documents exist
   SELECT COUNT(*) FROM application_documents;
   ```

5. **Verify fix is applied:**
   ```bash
   # Check files.ts doesn't have authenticateToken on /upload
   grep -A 5 "router.post.*upload" backend/src/routes/files.ts
   # Should NOT see authenticateToken
   ```

---

### Issue: RLS policies blocking access

#### Symptoms:
- Applications not appearing in dashboard
- "Permission denied" errors
- Empty tables despite data existing

#### Solutions:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'medical_applications';

-- Temporarily disable RLS for testing (NOT for production!)
ALTER TABLE medical_applications DISABLE ROW LEVEL SECURITY;

-- Or check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'medical_applications';

-- Re-enable and fix policies
ALTER TABLE medical_applications ENABLE ROW LEVEL SECURITY;
\i database/corrected_database_schema.sql
```

---

## 📊 Verification Queries

### Check System Status
```sql
-- Count applications by status
SELECT status, COUNT(*) 
FROM medical_applications 
GROUP BY status;

-- Check recent applications
SELECT 
    application_number,
    employee_name,
    status,
    total_amount_claimed,
    created_at
FROM medical_applications
ORDER BY created_at DESC
LIMIT 5;

-- Check file uploads
SELECT 
    ad.original_name,
    ad.file_size,
    ma.application_number
FROM application_documents ad
JOIN medical_applications ma ON ad.application_id = ma.id
ORDER BY ad.uploaded_at DESC
LIMIT 10;

-- Check reviews
SELECT 
    r.reviewer_role,
    r.recommendation,
    r.amount_approved,
    ma.application_number
FROM reviews r
JOIN medical_applications ma ON r.application_id = ma.id
ORDER BY r.reviewed_at DESC
LIMIT 10;

-- Check audit logs
SELECT 
    entity_type,
    action,
    created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🎯 Priority Setup Order

### 1️⃣ **MUST DO (Critical)**
- ✅ Run `corrected_database_schema.sql`
- ✅ Run `insert_admin_users.sql`
- ✅ Create `backend/uploads` directory
- ✅ Configure `.env` files (both frontend and backend)
- ✅ Start backend server
- ✅ Start frontend server

### 2️⃣ **SHOULD DO (Important)**
- ✅ Test employee form submission
- ✅ Test file upload (verify files save)
- ✅ Test admin login
- ✅ Test OBC dashboard
- ✅ Test review workflow

### 3️⃣ **CAN DO LATER (Optional)**
- ⏳ Run `query_system_schema.sql` (if you want query feature)
- ⏳ Test query/communication system
- ⏳ Setup email notifications
- ⏳ Configure production environment

---

## 📝 Quick Start Commands

### One-Time Setup
```bash
# 1. Database setup
psql -U postgres -d your_db -f database/corrected_database_schema.sql
psql -U postgres -d your_db -f database/insert_admin_users.sql

# 2. Backend setup
cd backend
npm install
mkdir -p uploads
cp .env.example .env  # Edit with your credentials
npm run dev

# 3. Frontend setup (in new terminal)
cd frontend
npm install
cp .env.example .env  # Edit with your API URL
npm run dev
```

### Daily Development
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Database (optional)
psql -U postgres -d your_database_name
```

---

## 🔐 Test Credentials Summary

| Role | Email | Password | Dashboard URL |
|------|-------|----------|---------------|
| OBC Admin | obc.admin@jnu.ac.in | OBC@dmin2024! | /admin/obc |
| Health Centre | health.admin@jnu.ac.in | Health@dmin2024! | /admin/health-centre |
| Super Admin | super.admin@jnu.ac.in | Super@dmin2024! | /admin/super |

---

## 🎉 Success Criteria

Your system is fully working when:

✅ **Employee Side:**
- Can submit forms with all 6 steps
- Can upload files (files appear in uploads folder)
- Can track application status
- No console errors

✅ **Admin Side:**
- Can login with all 3 admin types
- Can see applications in dashboards
- Can review and approve/reject applications
- Can download uploaded files
- Application status changes after review

✅ **Backend:**
- Server starts without errors
- Health endpoint returns "ok"
- Files saved in uploads directory
- Database has all tables and data
- Audit logs are being created

✅ **Database:**
- All tables exist
- Admin users exist
- RLS policies work correctly
- Applications can be inserted
- Reviews can be created

---

## 📞 Next Steps After Setup

1. **Test the complete workflow:**
   - Employee submits → OBC reviews → Health Centre reviews → Approved

2. **Verify file upload:**
   - Submit form with files
   - Check `backend/uploads/{id}/` folder
   - Download files from admin dashboard

3. **Test error handling:**
   - Try invalid login
   - Try uploading large file (>10MB)
   - Try submitting incomplete form

4. **Optional: Setup Query System:**
   - Run `query_system_schema.sql`
   - Integrate query components into dashboards
   - Test admin → employee communication

---

**Status**: Ready for setup and testing! 🚀  
**Last Updated**: October 11, 2025

Good luck with the setup! Let me know if you hit any issues. 🎯
