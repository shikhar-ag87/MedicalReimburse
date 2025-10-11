# 🔧 Schema Cache Error Fix

## Error
```
API Error 500: Could not find the 'updated_at' column of 'eligibility_checks' in the schema cache
```

## What Happened
Supabase PostgREST maintains a **schema cache** of table structures. When you:
1. Create/alter tables
2. Add new columns
3. Change table structure

The cache **doesn't automatically refresh**, causing errors like this.

## Root Cause
The `eligibility_checks` table has an `updated_at` column, but:
- ❌ Supabase's PostgREST schema cache hasn't loaded it
- ❌ Backend was trying to manually set `updated_at` 
- ❌ No trigger exists to auto-update the column

## Solutions (Do in order)

### ✅ Solution 1: Remove Manual updated_at (DONE)
The backend code has been updated to **NOT** manually set `updated_at`:

```typescript
// ❌ BEFORE - Causes schema cache error
.update({
    ...fields,
    updated_at: new Date().toISOString(), // ← This line removed
})

// ✅ AFTER - Let database handle it
.update({
    ...fields,
    // updated_at removed - handled by trigger
})
```

### ✅ Solution 2: Add Trigger (RUN THIS)
Run this SQL in Supabase SQL Editor:

```bash
# Run this file in Supabase:
cat database/ADD_UPDATED_AT_TRIGGERS.sql
```

Or manually in SQL editor:
```sql
-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger
CREATE TRIGGER set_updated_at_eligibility_checks
    BEFORE UPDATE ON eligibility_checks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- Refresh cache
NOTIFY pgrst, 'reload schema';
```

### ✅ Solution 3: Refresh Schema Cache (RUN THIS)
Run this in Supabase SQL Editor:

```bash
# Run this file:
cat database/REFRESH_SCHEMA_CACHE.sql
```

Or manually:
```sql
-- Method 1: Notify PostgREST
NOTIFY pgrst, 'reload schema';

-- Method 2: Touch the table
COMMENT ON TABLE eligibility_checks IS 'Updated ' || NOW()::TEXT;

-- Method 3: Regrant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON eligibility_checks TO anon, authenticated;
```

### ✅ Solution 4: Restart Backend (ALWAYS DO THIS)
After SQL changes, restart the backend:

```bash
# In backend terminal (Ctrl+C first):
cd backend
npm run dev
```

## Testing
After fixes, test the review workflow:

```bash
# 1. Login as OBC
# 2. Review an application
# 3. Check for errors in browser console
# 4. Should see success message
```

## Why This Happens
Supabase PostgREST uses a **schema cache** for performance. When tables change:
- ✅ PostgreSQL knows immediately
- ❌ PostgREST cache is stale
- ❌ API calls fail with "column not found in schema cache"

## Prevention
After running **any SQL that changes table structure**:
1. Always run `NOTIFY pgrst, 'reload schema';`
2. Restart your backend server
3. Clear browser cache (Ctrl+Shift+R)

## Files Modified
- ✅ `backend/src/routes/reviews.ts` - Removed manual `updated_at`
- ✅ `database/ADD_UPDATED_AT_TRIGGERS.sql` - Trigger script
- ✅ `database/REFRESH_SCHEMA_CACHE.sql` - Cache refresh script

## Quick Fix Commands
```bash
# 1. Run trigger script in Supabase SQL Editor
cat database/ADD_UPDATED_AT_TRIGGERS.sql

# 2. Restart backend
cd backend
# Press Ctrl+C to stop
npm run dev

# 3. Test in browser (hard refresh)
# Press Ctrl+Shift+R
```

## If Still Broken
If you still get schema cache errors:

```sql
-- Nuclear option: Drop and recreate
DROP TABLE eligibility_checks CASCADE;
DROP TABLE document_reviews CASCADE;

-- Then re-run:
\i database/FIX_EVERYTHING.sql

-- Force cache refresh:
NOTIFY pgrst, 'reload schema';
```

Then restart backend again.

## Related Issues
- "Could not find relationship" - Schema cache not seeing foreign keys
- "Column does not exist" - Column exists but not in cache
- "Relation does not exist" - Table exists but not in cache

All fixed by: **NOTIFY pgrst, 'reload schema';** + restart backend
