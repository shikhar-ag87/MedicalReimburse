# Query System - Dashboard Integration Guide

## Overview
This guide shows you exactly how to integrate the query system into your existing dashboards.

---

## 1. OBC Dashboard Integration

### File: `frontend/src/pages/OBCDashboard.tsx`

#### Step 1: Add Imports (at top of file)
```tsx
import { useState } from 'react'; // If not already imported
import QueryComposer from '../components/query/QueryComposer';
import QueryList from '../components/query/QueryList';
import { MessageSquare } from 'lucide-react'; // For icon
```

#### Step 2: Add State Variables (inside component)
```tsx
const [showQueryComposer, setShowQueryComposer] = useState(false);
const [selectedApplication, setSelectedApplication] = useState<any>(null);
const [activeTab, setActiveTab] = useState<'applications' | 'queries'>('applications');
```

#### Step 3: Add Tab Navigation (in your dashboard header)
```tsx
<div className="flex gap-2 mb-6">
  <button
    onClick={() => setActiveTab('applications')}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      activeTab === 'applications'
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`}
  >
    Applications
  </button>
  <button
    onClick={() => setActiveTab('queries')}
    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
      activeTab === 'queries'
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`}
  >
    <MessageSquare size={18} />
    Queries
  </button>
</div>
```

#### Step 4: Add "Send Query" Button to Application Actions
Find where you render application actions (likely in a table row) and add:

```tsx
{/* Existing actions: View, Approve, etc. */}

<button
  onClick={() => {
    setSelectedApplication(application);
    setShowQueryComposer(true);
  }}
  className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
  title="Send Query to Employee"
>
  <MessageSquare size={16} />
  Send Query
</button>
```

#### Step 5: Conditional Render Based on Tab
```tsx
{/* Inside your main content area */}
{activeTab === 'applications' ? (
  <div>
    {/* Your existing applications table/grid */}
  </div>
) : (
  <div>
    <QueryList showFilters={true} />
  </div>
)}
```

#### Step 6: Add QueryComposer Modal (at bottom, before closing component)
```tsx
{/* Query Composer Modal */}
{showQueryComposer && selectedApplication && (
  <QueryComposer
    applicationId={selectedApplication.id}
    applicationNumber={selectedApplication.application_number}
    employeeName={selectedApplication.employee_name}
    employeeEmail={selectedApplication.employee_email}
    onClose={() => {
      setShowQueryComposer(false);
      setSelectedApplication(null);
    }}
    onSuccess={() => {
      setShowQueryComposer(false);
      setSelectedApplication(null);
      // Optional: Show success toast
      alert('Query sent successfully! Employee will be notified via email.');
    }}
  />
)}
```

### Complete Example for OBC Dashboard

```tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { adminService } from '../services/admin';
import QueryComposer from '../components/query/QueryComposer';
import QueryList from '../components/query/QueryList';
import { MessageSquare } from 'lucide-react';

export default function OBCDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Query system state
  const [showQueryComposer, setShowQueryComposer] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [activeTab, setActiveTab] = useState('applications');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    // Your existing load logic
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">OBC Dashboard</h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'applications'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Applications
        </button>
        <button
          onClick={() => setActiveTab('queries')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
            activeTab === 'queries'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <MessageSquare size={18} />
          Queries
        </button>
      </div>

      {/* Content */}
      {activeTab === 'applications' ? (
        <div>
          {/* Applications Table */}
          <table className="w-full">
            <thead>
              <tr>
                <th>Application Number</th>
                <th>Employee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>{app.application_number}</td>
                  <td>{app.employee_name}</td>
                  <td>{app.status}</td>
                  <td>
                    <div className="flex gap-2">
                      {/* Your existing actions */}
                      <button
                        onClick={() => {
                          setSelectedApplication(app);
                          setShowQueryComposer(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <QueryList showFilters={true} />
      )}

      {/* Query Composer Modal */}
      {showQueryComposer && selectedApplication && (
        <QueryComposer
          applicationId={selectedApplication.id}
          applicationNumber={selectedApplication.application_number}
          employeeName={selectedApplication.employee_name}
          employeeEmail={selectedApplication.employee_email}
          onClose={() => {
            setShowQueryComposer(false);
            setSelectedApplication(null);
          }}
          onSuccess={() => {
            setShowQueryComposer(false);
            setSelectedApplication(null);
          }}
        />
      )}
    </div>
  );
}
```

---

## 2. Health Centre Dashboard Integration

### File: `frontend/src/pages/HealthCentreDashboard.tsx`

**Same exact steps as OBC Dashboard** - just copy the integration code above.

The only difference is the dashboard name and potentially different application filters.

---

## 3. Super Admin Dashboard Integration

### File: `frontend/src/pages/SuperAdminDashboard.tsx`

Super Admin gets access to ALL queries across all applications.

#### Add Imports
```tsx
import QueryList from '../components/query/QueryList';
import { MessageSquare } from 'lucide-react';
```

#### Add Tab or Section
```tsx
<div className="mt-8">
  <div className="bg-white rounded-lg shadow-lg p-6">
    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
      <MessageSquare size={24} />
      Query Management
    </h2>
    <p className="text-gray-600 mb-6">
      View and manage all queries across the system
    </p>
    <QueryList showFilters={true} />
  </div>
</div>
```

---

## 4. Application Details View Integration

If you have a detailed view for a single application, add:

### Show Queries for Specific Application

```tsx
import QueryList from '../components/query/QueryList';
import QueryComposer from '../components/query/QueryComposer';

// Inside your application details component:
<div className="mt-8">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-xl font-bold">Queries & Communication</h3>
    <button
      onClick={() => setShowQueryComposer(true)}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      New Query
    </button>
  </div>
  
  <QueryList 
    applicationId={application.id} 
    showFilters={false}
  />
</div>

{/* Query Composer Modal */}
{showQueryComposer && (
  <QueryComposer
    applicationId={application.id}
    applicationNumber={application.application_number}
    employeeName={application.employee_name}
    employeeEmail={application.employee_email}
    onClose={() => setShowQueryComposer(false)}
    onSuccess={() => setShowQueryComposer(false)}
  />
)}
```

---

## 5. Header Notification Badge (Optional)

### File: `frontend/src/components/Header.tsx`

Add a notification badge showing unread queries:

```tsx
import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { queryService } from '../services/queryService';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user && user.role !== 'employee') {
      loadUnreadCount();
      // Poll every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const stats = await queryService.getQueryStats();
      setUnreadCount(stats.total_unread || 0);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  };

  return (
    <header>
      {/* Your existing header content */}
      
      {user && user.role !== 'employee' && (
        <button 
          onClick={() => {/* Navigate to queries */}}
          className="relative p-2 hover:bg-gray-100 rounded-full"
        >
          <MessageSquare size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}
    </header>
  );
}
```

---

## 6. Testing the Integration

### Test Checklist

#### Step 1: Create a Query
1. ✅ Go to OBC or Health Centre Dashboard
2. ✅ Click on an application
3. ✅ Click "Send Query" button
4. ✅ Fill in subject and message
5. ✅ Select priority
6. ✅ Click "Send Query"
7. ✅ Verify success message
8. ✅ Query should appear in Queries tab

#### Step 2: View Query Thread
1. ✅ Go to Queries tab
2. ✅ Click on a query card
3. ✅ QueryThread modal should open
4. ✅ Verify conversation displays correctly
5. ✅ Try sending a reply
6. ✅ Reply should appear in thread

#### Step 3: Test Public Access (Employee Side)
1. ✅ Get the access token from database
2. ✅ Open: `http://localhost:5173/query/{token}`
3. ✅ Verify query details display
4. ✅ Type a reply and send
5. ✅ Upload a document
6. ✅ Verify reply appears in admin view

#### Step 4: Resolve Query
1. ✅ Open QueryThread
2. ✅ Click "Mark as Resolved"
3. ✅ Verify status changes to Resolved
4. ✅ Verify public page shows resolved status
5. ✅ Test "Reopen Query" functionality

---

## 7. Styling Tips

### Match Your Existing Theme

If your dashboard uses different colors, update the component classes:

```tsx
// Example: Change from blue to purple theme
// In QueryComposer, QueryThread, QueryList:

// Old:
className="bg-blue-600 text-white hover:bg-blue-700"

// New (for purple theme):
className="bg-purple-600 text-white hover:bg-purple-700"
```

### Consistent Button Styles

Make sure buttons match your existing design:

```tsx
// Your standard button class:
const buttonClass = "px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark";

// Use it:
<button className={buttonClass}>Send Query</button>
```

---

## 8. Common Integration Issues

### Issue 1: TypeScript Errors
**Problem**: Type errors when passing application data  
**Solution**: Ensure your application type includes required fields:

```tsx
interface Application {
  id: string;
  application_number: string;
  employee_name: string;
  employee_email: string;
  // ... other fields
}
```

### Issue 2: Modal Not Showing
**Problem**: QueryComposer modal doesn't appear  
**Solution**: Check z-index and ensure modal is not behind other elements:

```css
/* In your global CSS or component */
.modal-overlay {
  z-index: 9999;
}
```

### Issue 3: API Errors
**Problem**: 401 Unauthorized when calling query endpoints  
**Solution**: Ensure JWT token is included in requests (handled by apiService)

### Issue 4: Route Not Found
**Problem**: `/query/:token` returns 404  
**Solution**: Verify route is added to App.tsx and restart dev server

---

## 9. Progressive Integration Approach

Don't do everything at once. Follow this order:

### Phase 1: Basic Query Creation ⭐
1. Add QueryComposer to OBC Dashboard
2. Add "Send Query" button
3. Test creating a query

### Phase 2: Query Viewing
1. Add Queries tab
2. Add QueryList component
3. Test viewing and filtering queries

### Phase 3: Query Management
1. Test replying to queries
2. Test resolving queries
3. Test reopening queries

### Phase 4: Public Access
1. Test public query response page
2. Test employee replies
3. Test file uploads

### Phase 5: Polish
1. Add notification badges
2. Add to other dashboards
3. Add analytics/stats

---

## 10. Quick Copy-Paste Snippets

### Minimal OBC Integration (50 lines)

```tsx
import { useState } from 'react';
import QueryComposer from '../components/query/QueryComposer';
import { MessageSquare } from 'lucide-react';

export default function OBCDashboard() {
  const [showQuery, setShowQuery] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  return (
    <div>
      {/* Your existing dashboard */}
      
      {/* Add this button in your application actions */}
      <button
        onClick={() => {
          setSelectedApp(application); // 'application' from your map/loop
          setShowQuery(true);
        }}
        className="text-blue-600 hover:text-blue-800"
      >
        <MessageSquare size={16} />
      </button>

      {/* Add this at the bottom */}
      {showQuery && selectedApp && (
        <QueryComposer
          applicationId={selectedApp.id}
          applicationNumber={selectedApp.application_number}
          employeeName={selectedApp.employee_name}
          employeeEmail={selectedApp.employee_email}
          onClose={() => setShowQuery(false)}
          onSuccess={() => setShowQuery(false)}
        />
      )}
    </div>
  );
}
```

### Minimal Queries Tab (20 lines)

```tsx
import QueryList from '../components/query/QueryList';

// Add to your dashboard:
<div className="mt-8">
  <h2 className="text-2xl font-bold mb-4">Queries</h2>
  <QueryList showFilters={true} />
</div>
```

---

## Summary

**3 Simple Steps to Integrate:**

1. **Import Components**
   ```tsx
   import QueryComposer from '../components/query/QueryComposer';
   import QueryList from '../components/query/QueryList';
   ```

2. **Add State**
   ```tsx
   const [showQuery, setShowQuery] = useState(false);
   const [selectedApp, setSelectedApp] = useState(null);
   ```

3. **Add UI Elements**
   - Button to trigger QueryComposer
   - QueryComposer modal
   - QueryList in a tab/section

**That's it!** 🎉

The components handle all the complexity internally. You just need to:
- Pass the right props
- Handle open/close state
- Optionally refresh data on success

---

## Need Help?

Check these files for reference:
- `QUERY_SYSTEM_COMPLETE.md` - Full documentation
- `QUERY_SYSTEM_QUICKSTART.md` - Setup guide
- Component source files - They have JSDoc comments

Happy integrating! 🚀
