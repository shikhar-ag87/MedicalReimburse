# 🎯 Quick Setup Card - Medical Reimbursement System

## ⚡ 5-Minute Setup

### 1️⃣ Database (2 min)
```bash
psql -U postgres -d your_database -f database/corrected_database_schema.sql
psql -U postgres -d your_database -f database/insert_admin_users.sql
```

### 2️⃣ Backend (1 min)
```bash
cd backend
npm install
mkdir -p uploads
# Edit .env with Supabase credentials
npm run dev
```

### 3️⃣ Frontend (1 min)
```bash
cd frontend
npm install  
# Edit .env: VITE_API_URL=http://localhost:3005/api
npm run dev
```

### 4️⃣ Verify (1 min)
✅ Backend: http://localhost:3005/health  
✅ Frontend: http://localhost:5173

---

## 🧪 Quick Test (10 min)

### Employee Flow:
1. Open http://localhost:5173
2. Fill Steps 1-6
3. **Upload files in Step 5** ⭐
4. Submit & note application number

### Admin Flow:
1. Login: `obc.admin@jnu.ac.in` / `OBC@dmin2024!`
2. Find your application
3. Review & approve

---

## 🔑 Credentials

| Role | Email | Password |
|------|-------|----------|
| OBC | obc.admin@jnu.ac.in | OBC@dmin2024! |
| Health | health.admin@jnu.ac.in | Health@dmin2024! |
| Super | super.admin@jnu.ac.in | Super@dmin2024! |

---

## 🐛 Quick Fixes

**Backend won't start?**
```bash
lsof -ti:3005 | xargs kill -9
npm run dev
```

**Files not uploading?**
```bash
mkdir -p backend/uploads
chmod 755 backend/uploads
```

**Login fails?**
```sql
psql -U postgres -d your_db -f database/insert_admin_users.sql
```

---

## ✅ Success = All These Work

- [ ] Backend: http://localhost:3005/health returns ok
- [ ] Frontend: http://localhost:5173 loads
- [ ] Can submit form with files
- [ ] Files in `backend/uploads/{id}/`
- [ ] Can login as admin
- [ ] Can see & review applications

---

📖 **Full Guide**: See `COMPLETE_SETUP_GUIDE.md`  
🐛 **File Upload**: See `FILE_UPLOAD_FIX.md`
