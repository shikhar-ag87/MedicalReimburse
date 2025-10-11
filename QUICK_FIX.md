# 🚀 QUICK FIX GUIDE

## 🔥 IMMEDIATE ACTION REQUIRED

### The Problem
```
Error: invalid input value for enum application_status: "back_to_obc"
```

### The Fix (2 Minutes)
1. Open https://supabase.com/dashboard
2. Go to **SQL Editor**
3. Run this SQL:

```sql
-- Add new status values
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'back_to_obc';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'reimbursed';

-- Verify
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'application_status'::regtype ORDER BY enumsortorder;
```

4. Restart backend: `cd backend && npm run dev`

### Done! ✅

---

## 📋 New Workflow Cheat Sheet

```
Employee
   ↓ submits
PENDING ──────────────────┐
                          │
OBC reviews & approves    │
   ↓                      │
UNDER_REVIEW ─────────────┤
                          │
Health Centre reviews     │
   ↓                      │
BACK_TO_OBC ──────────────┤  ← NEW STATUS
                          │
OBC final review          │
   ↓                      │
APPROVED ─────────────────┤
                          │
Super Admin marks paid    │
   ↓                      │
REIMBURSED ───────────────┘  ← NEW STATUS (FINAL)
```

---

## 🎯 Quick Test

After migration:
1. **OBC** approves pending → goes to Health Centre ✓
2. **Health Centre** approves → goes back to OBC ✓
3. **OBC** reviews returned app → forwards to Admin ✓
4. **Admin** marks reimbursed → DONE ✓

---

## 📞 Need Help?

See detailed docs:
- `database/MIGRATION_REQUIRED.md` - Full migration guide
- `WORKFLOW_UPDATE_SUMMARY.md` - Complete changes documentation
