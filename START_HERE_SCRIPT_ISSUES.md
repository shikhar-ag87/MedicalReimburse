# ⚡ SUPER QUICK START

## Your Script Won't Run? Use This Instead!

### 📁 File to Use
```
/home/aloo/MedicalReimburse/database/RUN_IN_PARTS.sql
```

### 🎯 How to Run
1. Open Supabase → SQL Editor
2. Copy **ENTIRE** `RUN_IN_PARTS.sql` file
3. Paste into editor
4. Click **"Run"**
5. Done! ✅

### ✅ What It Does
- ✓ Adds missing status values (back_to_obc, reimbursed)
- ✓ Fixes permissions (RLS policies)
- ✓ Resets admin passwords
- ✓ Creates eligibility_checks table
- ✓ Creates document_reviews table
- ✓ Shows you what succeeded/failed

### 🔧 Then Restart Backend
```bash
cd /home/aloo/MedicalReimburse/backend
npm run dev
```

### 🧪 Test It Works
Login:
- Email: `obc@jnu.ac.in`
- Password: `obc123`

---

## Why Two Scripts?

### `FIX_EVERYTHING.sql`
- ⚡ Runs everything at once
- 😕 Hard to debug if something fails
- ✅ Use if you're confident

### `RUN_IN_PARTS.sql` ← **USE THIS ONE!**
- 📊 Shows progress after each step
- 🔍 Easy to see what failed
- ✅ Has helpful RAISE NOTICE messages
- 🛡️ Bulletproof!

---

## Still Having Issues?

### Error: "table does not exist"
**You need base schema first!**

Run this minimal setup:
```sql
-- Create the tables if they don't exist
CREATE TABLE IF NOT EXISTS medical_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT DEFAULT 'pending',
    -- ... other columns
);

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    -- ... other columns
);

CREATE TABLE IF NOT EXISTS application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- ... other columns
);
```

Then run `RUN_IN_PARTS.sql`

### Error: "enum does not exist"
```sql
CREATE TYPE application_status AS ENUM (
    'pending', 'under_review', 'approved', 'rejected', 'completed'
);
```

Then run `RUN_IN_PARTS.sql`

---

## Troubleshooting Files

- **`SCRIPT_WONT_RUN_FIX.md`** - Detailed troubleshooting
- **`RUN_IN_PARTS.sql`** - The script that actually works
- **`FIX_EVERYTHING.sql`** - Original all-in-one (if you want to try)

---

**TL;DR:** Open Supabase → SQL Editor → Copy-paste `RUN_IN_PARTS.sql` → Click Run → Done! 🚀
