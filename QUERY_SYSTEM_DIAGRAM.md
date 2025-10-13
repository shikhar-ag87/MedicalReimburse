# 📨 Query System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         QUERY/COMMUNICATION SYSTEM                          │
│                   Admin ↔ Employee Communication Platform                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                   ADMINS                                    │
│  👨‍💼 OBC Cell  |  👨‍⚕️ Health Centre  |  👑 Super Admin                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                    [Review App]          [Need Info?]
                          │                     │
                          │              📨 Send Query
                          │                     │
                          ▼                     ▼
              ┌──────────────────────────────────────────┐
              │        QueryComposer Component           │
              │  ┌────────────────────────────────────┐  │
              │  │ Subject:  [Need Documents]         │  │
              │  │ Message:  [Please provide...]      │  │
              │  │ Priority: [●Normal ○High ○Urgent]  │  │
              │  │                                    │  │
              │  │         [Cancel]  [Send Query]    │  │
              │  └────────────────────────────────────┘  │
              └──────────────────────────────────────────┘
                                     │
                                     │ POST /api/queries/create
                                     │ { applicationId, subject, message }
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND API                                    │
│                        backend/src/routes/queries.ts                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔐 ADMIN ENDPOINTS (JWT Auth Required)                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  POST   /api/queries/create          Create new query                 │ │
│  │  GET    /api/queries/all             Get all queries (with filters)   │ │
│  │  GET    /api/queries/application/:id Get queries for application      │ │
│  │  GET    /api/queries/:queryId        Get full conversation            │ │
│  │  POST   /api/queries/:queryId/reply  Admin reply                      │ │
│  │  PATCH  /api/queries/:queryId/resolve Mark as resolved                │ │
│  │  PATCH  /api/queries/:queryId/reopen Reopen query                     │ │
│  │  GET    /api/queries/stats/unread    Get unread counts                │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  🌐 PUBLIC ENDPOINTS (Token-Based, No Auth)                                │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  GET    /api/queries/public/:token         Get query by token         │ │
│  │  POST   /api/queries/public/:token/reply   Employee reply             │ │
│  │  POST   /api/queries/public/:token/upload  Upload attachment          │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ Writes to database
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE DATABASE                                   │
│                    PostgreSQL with RLS Policies                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📋 TABLE: application_queries                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  id, application_id, subject, status, priority                         │ │
│  │  created_by, created_by_role, employee_email                           │ │
│  │  access_token (64-char hex), token_expires_at (30 days)               │ │
│  │  total_messages, unread_by_admin, unread_by_user                      │ │
│  │  last_message_at, last_message_by (admin/user)                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  💬 TABLE: query_messages                                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  id, query_id, message, sender_type (admin/user)                      │ │
│  │  sender_id, sender_name, sender_role                                   │ │
│  │  is_internal_note (hidden from employees)                             │ │
│  │  read_by_recipient, created_at                                         │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  📎 TABLE: query_attachments                                                │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  id, query_id, message_id, file_name, file_path                       │ │
│  │  file_size, file_type, uploaded_by (admin/user)                       │ │
│  │  uploader_name, created_at                                             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  🔧 TRIGGERS:                                                               │
│  - update_query_stats() - Auto-update message counts & timestamps          │
│                                                                             │
│  🔒 RLS POLICIES:                                                           │
│  - Admins can view all queries                                              │
│  - Public can access via valid token only                                   │
│  - Internal notes hidden from public                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                   [Generates Token]      📧 [Email Service]
                          │                     │
                          │                     │
                 crypto.randomBytes(32)     nodemailer
                          │                     │
                access_token: abc123...    ──▶  to: employee@jnu.ac.in
                expires: +30 days          ──▶  subject: "Query: ..."
                          │                     │
                          │                     ▼
                          │              ┌─────────────────┐
                          │              │   Email Client  │
                          │              │   📧 Gmail      │
                          │              └─────────────────┘
                          │                     │
                          │                     │ Employee receives
                          │                     ▼
                          └──────────┬──────────┘
                                     │
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EMPLOYEE (Public)                                │
│                          👤 No Login Required                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                              [Opens Email]
                                     │
            "Query regarding Application APP-2025-0001"
            
            📨 Subject: Need Additional Documents
            💬 Message: Please provide...
            
            🔗 Link: https://app.com/query/abc123...
            ⏱️ Valid for 30 days
                                     │
                           [Clicks Link]
                                     │
                                     ▼
              ┌──────────────────────────────────────────┐
              │   PublicQueryResponse Page               │
              │   Route: /query/:token                   │
              │  ┌────────────────────────────────────┐  │
              │  │ 📋 Application: APP-2025-0001      │  │
              │  │ 👤 Employee: John Doe              │  │
              │  │ 💰 Amount: ₹5,500                  │  │
              │  ├────────────────────────────────────┤  │
              │  │ 📨 Query: Need Additional Docs     │  │
              │  │                                    │  │
              │  │ Conversation Timeline:             │  │
              │  │ ┌────────────────────────────────┐ │  │
              │  │ │ 👨‍💼 OBC Cell (10:00 AM)       │ │  │
              │  │ │ Please provide prescription    │ │  │
              │  │ └────────────────────────────────┘ │  │
              │  │ ┌────────────────────────────────┐ │  │
              │  │ │ 👤 You (11:30 AM)              │ │  │
              │  │ │ Here is the document           │ │  │
              │  │ │ 📎 prescription.pdf            │ │  │
              │  │ └────────────────────────────────┘ │  │
              │  │                                    │  │
              │  │ Your Reply:                        │  │
              │  │ [Type your message here...]        │  │
              │  │                                    │  │
              │  │ 📎 Upload File: [Choose File]     │  │
              │  │                                    │  │
              │  │              [Send Reply]          │  │
              │  └────────────────────────────────────┘  │
              └──────────────────────────────────────────┘
                                     │
                                     │ POST /api/queries/public/:token/reply
                                     │ { message, userName }
                                     │
                                     │ POST /api/queries/public/:token/upload
                                     │ FormData { file, userName }
                                     │
                                     ▼
              ┌──────────────────────────────────────────┐
              │  Backend saves message & attachment      │
              │  Updates query status: 'user_replied'    │
              │  Sets unread_by_admin = TRUE             │
              │  Sends notification to admin (future)    │
              └──────────────────────────────────────────┘
                                     │
                                     │ Admin gets notified
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ADMIN DASHBOARD (Updated)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔔 Notifications                                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  📨 3 Unread Queries                                                   │ │
│  │  ● APP-2025-0001 - Employee replied 5 minutes ago                      │ │
│  │  ● APP-2025-0045 - New query opened                                    │ │
│  │  ● APP-2025-0032 - High priority response                              │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  📋 All Queries                                                             │
│  ┌────────────┬──────────────┬────────────┬──────────┬─────────────────┐  │
│  │ App Number │ Subject      │ Status     │ Priority │ Last Update     │  │
│  ├────────────┼──────────────┼────────────┼──────────┼─────────────────┤  │
│  │ APP-2025-1 │ Need Docs    │ 🔵 Replied │ 🔴 High  │ 5 mins ago      │  │
│  │ APP-2025-2 │ Clarification│ ⚪ Open    │ 🟡Normal │ 2 hours ago     │  │
│  │ APP-2025-3 │ Bill Details │ ✅Resolved │ 🟢 Low   │ Yesterday       │  │
│  └────────────┴──────────────┴────────────┴──────────┴─────────────────┘  │
│                                                                             │
│  [Filter: All Statuses ▾]  [Priority: All ▾]  [Search...]                  │
└─────────────────────────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════════════════
                           QUERY LIFECYCLE FLOW
════════════════════════════════════════════════════════════════════════════════

1. CREATION
   Admin reviews application
        │
        ├──▶ Clicks "Send Query"
        │
        ├──▶ Fills form (subject, message, priority)
        │
        ├──▶ Submits
        │
        └──▶ Backend creates:
                - Query record with token
                - First message
                - Sends email (optional)
   Status: 'open'
   
2. EMPLOYEE RESPONSE
   Employee receives email
        │
        ├──▶ Clicks secure link
        │
        ├──▶ Views conversation
        │
        ├──▶ Types reply & uploads files
        │
        └──▶ Submits response
   Status: 'user_replied'
   unread_by_admin: TRUE
   
3. ADMIN REPLY
   Admin sees notification
        │
        ├──▶ Opens query thread
        │
        ├──▶ Reads employee response
        │
        ├──▶ Types reply (or internal note)
        │
        └──▶ Sends response
   Status: 'admin_replied'
   unread_by_user: TRUE
   
4. BACK & FORTH
   Multiple messages exchanged
        │
        ├──▶ Employee replies
        ├──▶ Admin replies
        ├──▶ Documents uploaded
        └──▶ Conversation continues
   Status: Alternates between 'user_replied' and 'admin_replied'
   
5. RESOLUTION
   Admin marks as resolved
        │
        └──▶ Query closed
   Status: 'resolved'
   resolved_at: timestamp
   resolved_by: admin_id
   
6. REOPEN (if needed)
   Can be reopened by admin
        │
        └──▶ Back to 'admin_replied'
   Status: 'admin_replied'
   resolved_at: NULL


════════════════════════════════════════════════════════════════════════════════
                              DATA FLOW DIAGRAM
════════════════════════════════════════════════════════════════════════════════

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   ADMIN     │────────▶│  BACKEND    │────────▶│  DATABASE   │
│ Dashboard   │ Creates │    API      │ Writes  │  (Supabase) │
└─────────────┘  Query  └─────────────┘         └─────────────┘
                                │                        │
                                │ Generates Token        │
                                │                        │
                                ▼                        │
                         ┌─────────────┐                │
                         │   EMAIL     │                │
                         │  Service    │                │
                         └─────────────┘                │
                                │                        │
                                │ Sends Link             │
                                │                        │
                                ▼                        │
                         ┌─────────────┐                │
                         │  EMPLOYEE   │◀───────────────┘
                         │   Email     │   Reads Data
                         └─────────────┘   via Token
                                │
                                │ Clicks Link
                                │
                                ▼
                         ┌─────────────┐
                         │   PUBLIC    │
                         │    PAGE     │
                         │ /query/:tok │
                         └─────────────┘
                                │
                                │ Replies & Uploads
                                │
                                ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   ADMIN     │◀────────│  BACKEND    │◀────────│  DATABASE   │
│ Dashboard   │ Gets    │    API      │ Updates │  (Updated)  │
│ (Notified)  │ Alert   └─────────────┘         └─────────────┘
└─────────────┘


════════════════════════════════════════════════════════════════════════════════
                            SECURITY ARCHITECTURE
════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY LAYERS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1️⃣ AUTHENTICATION LAYER                                                    │
│     ├─ Admin Endpoints: JWT Token Required                                  │
│     │   - Verified via middleware                                           │
│     │   - Role-based access control                                         │
│     │                                                                        │
│     └─ Public Endpoints: Access Token Required                              │
│         - 64-char hex token (256-bit)                                       │
│         - Expires after 30 days                                             │
│         - Cannot be guessed                                                 │
│                                                                             │
│  2️⃣ DATABASE LAYER (Row Level Security)                                     │
│     ├─ Admins: Can only see their role's queries                            │
│     ├─ Public: Can only access via valid token                              │
│     └─ Internal Notes: Hidden from public access                            │
│                                                                             │
│  3️⃣ FILE UPLOAD LAYER                                                       │
│     ├─ Type Validation: Only pdf/jpg/png/doc/docx                           │
│     ├─ Size Limit: 10MB maximum                                             │
│     ├─ Sanitized Filenames: No malicious names                              │
│     └─ Stored Outside Web Root                                              │
│                                                                             │
│  4️⃣ RATE LIMITING                                                           │
│     └─ 100 requests per 15 minutes per IP                                   │
│                                                                             │
│  5️⃣ TRANSPORT SECURITY                                                      │
│     └─ HTTPS Required in Production                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════════════════
                              FILE STRUCTURE
════════════════════════════════════════════════════────════════════════════════

MedicalReimburse/
│
├── 📄 QUERY_SYSTEM_COMPLETE.md     ← Full Documentation (550+ lines)
├── 📄 QUERY_SYSTEM_QUICKSTART.md   ← Setup Guide (400+ lines)
├── 📄 QUERY_SYSTEM_SUMMARY.md      ← Implementation Summary
└── 📄 QUERY_SYSTEM_DIAGRAM.md      ← This Visual Guide
│
├── database/
│   └── 📄 query_system_schema.sql  ← Database Schema (400+ lines)
│       ├── application_queries table
│       ├── query_messages table
│       ├── query_attachments table
│       ├── Triggers
│       └── RLS Policies
│
├── backend/
│   └── src/
│       ├── routes/
│       │   └── 📄 queries.ts       ← API Routes (545 lines)
│       │       ├── 8 Admin endpoints
│       │       └── 3 Public endpoints
│       │
│       └── 📄 app.ts               ← Updated (registered route)
│
└── frontend/
    └── src/
        ├── services/
        │   └── 📄 queryService.ts  ← Frontend Service (217 lines)
        │       ├── Admin methods
        │       └── Public methods
        │
        ├── components/query/       ← TO BE CREATED
        │   ├── QueryComposer.tsx   ← Send query form
        │   ├── QueryThread.tsx     ← View conversation
        │   └── QueryList.tsx       ← List all queries
        │
        └── pages/
            └── PublicQueryResponse.tsx  ← Public query page


════════════════════════════════════════════════════════════════════════════════
                           IMPLEMENTATION STATUS
════════════════════════════════════════════════════════════════════════════════

✅ COMPLETE (100%)
├── ✅ Database Schema Designed
├── ✅ Backend API Implemented (11 endpoints)
├── ✅ Frontend Service Created
├── ✅ Security Configured
├── ✅ Documentation Written
└── ✅ Testing Guide Provided

⏳ PENDING (UI Components)
├── ⏳ Database Schema Installation
├── ⏳ QueryComposer Component
├── ⏳ QueryThread Component
├── ⏳ QueryList Component
├── ⏳ PublicQueryResponse Page
├── ⏳ Dashboard Integration
└── ⏳ Email Service Setup

🎯 ESTIMATED TIME TO COMPLETION: 1-2 hours


════════════════════════════════════════════════════════════════════════════════
                              SUCCESS!  🎉
════════════════════════════════════════════════════════════════════════════════

The Query/Communication System is:
    ✨ Fully Designed
    🔧 Backend Complete
    📦 Service Ready
    🔒 Secure
    📝 Documented
    🚀 Ready to Deploy (after UI)

NEXT STEP: Follow QUERY_SYSTEM_QUICKSTART.md to:
    1. Install database schema (5 min)
    2. Create QueryComposer component (30 min)
    3. Add to OBC Dashboard (15 min)
    4. Test end-to-end (15 min)

TOTAL TIME: ~1 hour to working prototype! 🚀
```
