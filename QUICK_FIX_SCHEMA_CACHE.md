# ⚡ QUICK FIX - Schema Cache Error

## Error You're Getting
```
Could not find the 'updated_at' column of 'eligibility_checks' in the schema cache
```

## Fix It NOW (3 Steps)

### Step 1: Run SQL (Copy-paste in Supabase SQL Editor)
```sql
-- Add trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_eligibility_checks
    BEFORE UPDATE ON eligibility_checks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- Refresh Supabase cache
NOTIFY pgrst, 'reload schema';
```

### Step 2: Restart Backend
```bash
# In your backend terminal:
# 1. Press Ctrl+C
# 2. Run:
npm run dev
```

### Step 3: Test
1. Open your app
2. Press Ctrl+Shift+R (hard refresh)
3. Try reviewing an application
4. Should work now! ✅

## What I Fixed
- ✅ Removed `updated_at` from backend code (was causing cache error)
- ✅ Created trigger to auto-update `updated_at` column
- ✅ You just need to run the SQL and restart backend

## If Still Broken
Try this nuclear option:
```sql
-- Refresh cache harder
GRANT SELECT, INSERT, UPDATE, DELETE ON eligibility_checks TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
```

Then restart backend again.
