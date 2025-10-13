# 🚀 Query System - Quick Start Guide

## Prerequisites
- Backend server running
- Supabase database access
- Frontend development environment

---

## Step 1: Install Database Schema (5 minutes)

### Option A: Supabase Dashboard
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `database/query_system_schema.sql`
4. Run the SQL
5. Verify tables created:
   ```sql
   SELECT * FROM application_queries LIMIT 1;
   SELECT * FROM query_messages LIMIT 1;
   SELECT * FROM query_attachments LIMIT 1;
   ```

### Option B: psql Command Line
```bash
psql postgresql://postgres:[password]@[host]:5432/postgres -f database/query_system_schema.sql
```

---

## Step 2: Backend Setup (ALREADY DONE ✅)

The backend is already set up:
- ✅ Route file: `backend/src/routes/queries.ts`
- ✅ Registered in `backend/src/app.ts`
- ✅ Auth middleware configured
- ✅ File upload with multer
- ✅ 11 API endpoints ready

### Test Backend
```bash
# Start backend if not running
cd backend
npm run dev

# Test health check
curl http://localhost:3000/health

# Should see queries endpoint in list
curl http://localhost:3000/api
```

---

## Step 3: Frontend Service (ALREADY DONE ✅)

The service is ready:
- ✅ `frontend/src/services/queryService.ts`
- ✅ All methods implemented
- ✅ TypeScript interfaces defined

---

## Step 4: Test the API (10 minutes)

### Test 1: Create a Query
```bash
# Get an admin token first (login as admin)
# Then use that token:

curl -X POST http://localhost:3000/api/queries/create \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "ACTUAL_APP_UUID",
    "subject": "Test Query - Need Documents",
    "message": "Please provide additional medical certificates",
    "priority": "normal"
  }'

# Should return:
# {
#   "message": "Query created successfully",
#   "query": {
#     "id": "...",
#     "queryLink": "http://localhost:5173/query/token123...",
#     ...
#   }
# }
```

### Test 2: Get All Queries
```bash
curl http://localhost:3000/api/queries/all \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Should return array of queries
```

### Test 3: Public Access (No Auth)
```bash
# Use the token from Test 1 response
curl http://localhost:3000/api/queries/public/TOKEN_FROM_TEST1

# Should return query details without auth
```

---

## Step 5: Create UI Components (Next Task)

### Components Needed:

1. **QueryComposer.tsx** - Modal to create queries
   - Location: `frontend/src/components/query/QueryComposer.tsx`
   - Used by: All admin dashboards

2. **QueryThread.tsx** - View conversation
   - Location: `frontend/src/components/query/QueryThread.tsx`
   - Used by: Admin dashboards

3. **QueryList.tsx** - List all queries
   - Location: `frontend/src/components/query/QueryList.tsx`
   - Used by: Admin dashboards

4. **PublicQueryResponse.tsx** - Public query page
   - Location: `frontend/src/pages/PublicQueryResponse.tsx`
   - Route: `/query/:token`
   - No auth required

### Quick Component Template:

```typescript
// frontend/src/components/query/QueryComposer.tsx
import { useState } from 'react';
import { queryService } from '../../services/queryService';

interface QueryComposerProps {
  applicationId: string;
  applicationNumber: string;
  employeeName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QueryComposer({
  applicationId,
  applicationNumber,
  employeeName,
  onClose,
  onSuccess,
}: QueryComposerProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await queryService.createQuery({
        applicationId,
        subject,
        message,
        priority,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">Send Query to Employee</h2>
        
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p><strong>Application:</strong> {applicationNumber}</p>
          <p><strong>Employee:</strong> {employeeName}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., Need Additional Documents"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              className="w-full border rounded px-3 py-2"
              placeholder="Describe what you need from the employee..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Query'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## Step 6: Add to Dashboards (Quick Integration)

### OBC Dashboard Example:

```typescript
// In OBCDashboard.tsx

// 1. Add imports
import QueryComposer from '../components/query/QueryComposer';
import { queryService } from '../services/queryService';

// 2. Add state
const [showQueryModal, setShowQueryModal] = useState(false);
const [selectedApp, setSelectedApp] = useState<any>(null);

// 3. Add button in application table
<button
  onClick={() => {
    setSelectedApp(claim);
    setShowQueryModal(true);
  }}
  className="text-blue-600 hover:underline"
  title="Send Query to Employee"
>
  📨 Query
</button>

// 4. Add modal at end of component
{showQueryModal && selectedApp && (
  <QueryComposer
    applicationId={selectedApp.id}
    applicationNumber={selectedApp.application_number}
    employeeName={selectedApp.employee_name}
    onClose={() => setShowQueryModal(false)}
    onSuccess={() => {
      setShowQueryModal(false);
      alert('Query sent successfully! Employee will receive an email.');
    }}
  />
)}
```

---

## Step 7: Email Notifications (Optional - Can Do Later)

### Install Email Package
```bash
cd backend
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### Create Email Service
```typescript
// backend/src/utils/emailService.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendQueryEmail(
  to: string,
  subject: string,
  message: string,
  queryLink: string,
  applicationNumber: string
) {
  const html = `
    <h2>Query Regarding Your Application</h2>
    <p><strong>Application:</strong> ${applicationNumber}</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p>${message}</p>
    <a href="${queryLink}">View and Respond</a>
  `;

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: `Query: ${subject}`,
    html,
  });
}
```

### Update .env
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@jnu.ac.in
```

### Use in Routes
```typescript
// In backend/src/routes/queries.ts
// After creating query:
import { sendQueryEmail } from '../utils/emailService';

try {
  await sendQueryEmail(
    application.employee_email,
    subject,
    message,
    queryLink,
    application.application_number
  );
} catch (emailError) {
  logger.error('Email failed:', emailError);
}
```

---

## Verification Checklist

- [ ] Database tables created (`application_queries`, `query_messages`, `query_attachments`)
- [ ] Backend starts without errors
- [ ] Can create query via API (Test 1)
- [ ] Can retrieve queries via API (Test 2)
- [ ] Public endpoint works without auth (Test 3)
- [ ] QueryComposer component created
- [ ] Added "Send Query" button to at least one dashboard
- [ ] Can open query modal from dashboard
- [ ] Can submit query from modal
- [ ] Query appears in database

---

## Quick Test Workflow

1. **Login as OBC Admin**
2. **Open an application** for review
3. **Click "Send Query"** button
4. **Fill form**:
   - Subject: "Test Query"
   - Message: "Please provide test documents"
   - Priority: Normal
5. **Submit**
6. **Check database**:
   ```sql
   SELECT * FROM application_queries ORDER BY created_at DESC LIMIT 1;
   ```
7. **Copy access_token** from result
8. **Test public access**:
   ```
   http://localhost:5173/query/YOUR_TOKEN_HERE
   ```

---

## Common Issues & Solutions

### Issue: "Cannot find module 'multer'"
```bash
cd backend
npm install multer @types/multer
```

### Issue: "Query not found"
- Check application ID is valid UUID
- Verify you're using correct auth token
- Check database connection

### Issue: "CORS error"
- Add frontend URL to ALLOWED_ORIGINS in backend .env
- Restart backend server

### Issue: "Token expired"
- Tokens expire after 30 days
- Create new query for fresh token

---

## Next Steps

### Phase 1 (Now)
1. ✅ Database schema - DONE
2. ✅ Backend API - DONE
3. ✅ Frontend service - DONE
4. ⏳ Create QueryComposer component
5. ⏳ Add to one dashboard (OBC)
6. ⏳ Test end-to-end

### Phase 2 (Later)
7. Create QueryThread component
8. Create QueryList component
9. Create PublicQueryResponse page
10. Add to all dashboards
11. Email notifications
12. Polish UI/UX

### Phase 3 (Future)
13. Real-time notifications
14. Query analytics
15. Templates
16. Bulk operations

---

## Success! 🎉

You now have:
- ✅ Complete database schema
- ✅ 11 backend API endpoints
- ✅ Frontend service ready
- ✅ Component templates
- ✅ Integration guide

**Time to completion**: ~30 minutes to get basic functionality working!

**Start with**: Create QueryComposer component and add to OBC Dashboard! 🚀
