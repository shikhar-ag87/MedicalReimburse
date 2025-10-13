# 🔧 Database Schema Fix Required!

## Problem

The code is trying to insert `original_name` column but it doesn't exist in the database!

**Error:**
```
Could not find the 'original_name' column of 'application_documents' in the schema cache
```

## What Happened

The TypeScript interface has:
```typescript
export interface ApplicationDocument {
    originalName: string;  // ← This field
    fileName: string;
    ...
}
```

But the database schema (`corrected_database_schema.sql`) only has:
```sql
CREATE TABLE application_documents (
    file_name VARCHAR(255) NOT NULL,
    -- missing: original_name
    ...
);
```

## Quick Fix - Run This SQL!

### Option 1: Using Supabase SQL Editor

1. Go to your Supabase dashboard
2. Click **SQL Editor**
3. Paste this SQL:

```sql
-- Add missing original_name column
ALTER TABLE application_documents 
ADD COLUMN IF NOT EXISTS original_name VARCHAR(255);

-- For existing records
UPDATE application_documents 
SET original_name = file_name 
WHERE original_name IS NULL;
```

4. Click **Run**

### Option 2: Using psql (if you have PostgreSQL locally)

```bash
# Run the migration file I created
cd database
psql $DATABASE_URL -f add_original_name_column.sql
```

### Option 3: Quick One-Liner

```bash
cd /home/aloo/MedicalReimburse
echo "ALTER TABLE application_documents ADD COLUMN IF NOT EXISTS original_name VARCHAR(255);" | psql $DATABASE_URL
```

## After Running the SQL

1. **Restart the backend server** (Ctrl+C and `npm run dev` again)
2. **Clear browser cache** (Ctrl+Shift+R)
3. **Test file upload again**

## Verify It Worked

Run this to check:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'application_documents'
ORDER BY ordinal_position;
```

Should see:
```
column_name    | data_type
---------------+-----------
id             | uuid
application_id | uuid
file_name      | varchar
original_name  | varchar  ← This should now be here!
file_path      | text
...
```

## What Each Column Does

- `file_name`: The generated unique filename on server (e.g., `bill-1728654321-123456789.pdf`)
- `original_name`: The original filename from user (e.g., `Medical Bill.pdf`)

Both are needed!

---

**Run the SQL migration and then try uploading files again!** 🚀

File created: `database/add_original_name_column.sql`
