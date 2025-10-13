# JNU Medical Reimbursement System

A comprehensive web application for managing medical reimbursement applications at Jawaharlal Nehru University (JNU). Built with modern technology stack and government website design standards.

## 🏗️ System Architecture

### Frontend

-   **React 18** with TypeScript
-   **Vite** for fast development and builds
-   **Tailwind CSS** with custom government design system
-   **Lucide Icons** for consistent iconography
-   **Responsive Design** with mobile-first approach

### Backend

-   **Node.js** with Express.js and TypeScript
-   **Modular Database Architecture** with pluggable providers
-   **Mock Database** for development (no setup required)
-   **Supabase** support for production (PostgreSQL-based)
-   **JWT Authentication** with role-based access control
-   **File Upload** with multer and validation
-   **API Documentation** with Swagger/OpenAPI
-   **Comprehensive logging** with Winston
-   **Rate limiting** and security middleware

## 🚀 Quick Start

### Prerequisites

-   Node.js 18+ and npm
-   Git
-   A code editor (VS Code recommended)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd MedicalReimburse

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Environment Configuration

#### Backend (.env)

```env
NODE_ENV=development
PORT=3001
DATABASE_TYPE=mock

# For production with Supabase
# DATABASE_TYPE=supabase
# SUPABASE_URL=your_supabase_url_here
# SUPABASE_ANON_KEY=your_anon_key_here
# SUPABASE_SERVICE_KEY=your_service_key_here

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

#### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=JNU Medical Reimbursement System
```

### 3. Start Development Servers

#### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

Backend runs on: http://localhost:3001

#### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on: http://localhost:5173

### 4. Access the Application

-   **Main Application**: http://localhost:5173
-   **API Health Check**: http://localhost:3001/health
-   **API Documentation**: http://localhost:3001/api/docs (Swagger UI)
-   **Manual Testing Guide**: See `MANUAL_TESTING_GUIDE.md` for comprehensive testing instructions

### 5. Verify Installation

```bash
# Test backend health
curl http://localhost:3001/health

# Run backend tests
cd backend && npm test

# Check frontend build
cd frontend && npm run build
```

## 📋 Features Implemented

### ✅ Multi-Step Form System

-   **Step 1**: Employee Details (name, department, CGHS card info)
-   **Step 2**: Patient Details (patient info, relationship)
-   **Step 3**: Treatment Details (hospital, treatment type)
-   **Step 4**: Expense Breakdown (bills, amounts)
-   **Step 5**: Document Upload (receipts, certificates)
-   **Step 6**: Declaration & Submission

### ✅ Government Design Standards

-   Professional government website styling
-   Hindi bilingual support (हिंदी भाषा समर्थन)
-   WCAG 2.1 accessibility compliance
-   Mobile responsive design
-   Government color palette

### ✅ Backend API System

-   RESTful API with proper error handling
-   Modular database architecture (easy to swap databases)
-   Mock database for development (no setup required)
-   Auto-save functionality with localStorage
-   Real-time form validation

### ✅ User Experience

-   Progress tracking with visual indicators
-   Auto-save with loading states
-   Server health monitoring
-   Form data persistence
-   Success/error handling
-   Print confirmation feature

## 🗂️ Project Structure

```
MedicalReimburse/
├── frontend/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── form/           # Form step components
│   │   │   ├── Header.tsx      # Application header
│   │   │   └── SuccessModal.tsx # Success confirmation modal
│   │   ├── pages/              # Main application pages
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── EmployeeForm.tsx
│   │   │   ├── HealthCentreDashboard.tsx
│   │   │   ├── OBCDashboard.tsx
│   │   │   ├── StatusTracker.tsx
│   │   │   └── SuperAdminDashboard.tsx
│   │   ├── contexts/           # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── services/           # API integration services
│   │   ├── hooks/              # Custom React hooks
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils/              # Utility functions and validation
│   ├── public/                 # Static assets
│   └── dist/                   # Build output
│
├── backend/                    # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── routes/             # API route handlers
│   │   │   ├── auth.ts         # Authentication routes
│   │   │   ├── applications.ts # Medical application routes
│   │   │   ├── files.ts        # File upload/download routes
│   │   │   ├── admin.ts        # Admin management routes
│   │   │   └── users.ts        # User management routes
│   │   ├── database/           # Database abstraction layer
│   │   │   ├── connection.ts   # Database connection factory
│   │   │   ├── providers/      # Database provider implementations
│   │   │   ├── repositories/   # Data access repositories
│   │   │   └── schema/         # Database schema definitions
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.ts         # Authentication middleware
│   │   │   └── errorHandler.ts # Error handling middleware
│   │   ├── config/             # Configuration files
│   │   │   └── swagger.ts      # API documentation config
│   │   ├── utils/              # Utility functions and helpers
│   │   │   └── logger.ts       # Winston logging configuration
│   │   ├── types/              # TypeScript type definitions
│   │   ├── app.ts              # Express app configuration
│   │   └── server.ts           # Server entry point
│   ├── tests/                  # Test files and fixtures
│   ├── dist/                   # Compiled JavaScript output
│   └── logs/                   # Application logs
│
├── MANUAL_TESTING_GUIDE.md     # Comprehensive testing guide
└── README.md                   # Project documentation
```

## 🔧 Development Features

### Auto-Save System

-   Automatically saves form data every 2 seconds
-   Restores form data on page refresh
-   Clear indication of save status

### Server Health Monitoring

-   Real-time server status indicator
-   Automatic health checks every 30 seconds
-   Fallback handling for offline mode

### Form Validation

-   Step-by-step validation before proceeding
-   Real-time field validation
-   Clear error messaging with scroll-to-error

## 📊 API Endpoints

### 🔐 Authentication (`/api/auth`)

-   `POST /api/auth/register` - Register new user
-   `POST /api/auth/login` - User login
-   `GET /api/auth/profile` - Get current user profile
-   `POST /api/auth/logout` - User logout
-   `POST /api/auth/change-password` - Change user password

### 📝 Applications (`/api/applications`)

-   `POST /api/applications` - Submit new medical application
-   `GET /api/applications` - Get user's applications (paginated)
-   `GET /api/applications/:id` - Get specific application details
-   `PATCH /api/applications/:id/status` - Update application status (admin)
-   `DELETE /api/applications/:id` - Delete application
-   `GET /api/applications/stats` - Get application statistics (admin)

### 📁 File Management (`/api/files`)

-   `POST /api/files/upload` - Upload application documents
-   `GET /api/files/:id` - Download/view uploaded file
-   `DELETE /api/files/:id` - Delete uploaded file

### 👥 User Management (`/api/users`)

-   `GET /api/users/profile` - Get current user profile
-   `PATCH /api/users/profile` - Update user profile
-   `GET /api/users/:id` - Get specific user details (admin)

### 🔧 Admin (`/api/admin`)

-   `GET /api/admin/dashboard` - Admin dashboard statistics
-   `GET /api/admin/applications` - Get all applications (admin view)
-   `PATCH /api/admin/applications/:id/status` - Update application status
-   `GET /api/admin/users` - Get all users
-   `GET /api/admin/audit-logs` - Get system audit logs
-   `GET /api/admin/system-info` - Get system information
-   `GET /api/admin/export/applications` - Export applications data

### 🏥 System (`/`)

-   `GET /health` - System health check
-   `GET /api/docs` - API documentation (Swagger UI)

## 🔄 Database Support

The system uses a **modular database architecture** that allows easy switching between providers:

### Currently Supported

-   ✅ **Mock Database** (in-memory, default for development)
-   ✅ **Supabase** (PostgreSQL-based, for production)
-   🔜 **PostgreSQL** (direct connection - planned)
-   🔜 **MySQL** (planned)

### Development vs Production

-   **Development**: Uses mock database by default (no setup required)
-   **Production**: Switch to Supabase or other providers via environment variables

### Switching Databases

1. Update `DATABASE_TYPE` in `.env` file:

    ```env
    # For development (default)
    DATABASE_TYPE=mock

    # For production with Supabase
    DATABASE_TYPE=supabase
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_ANON_KEY=your_anon_key
    SUPABASE_SERVICE_KEY=your_service_role_key
    ```

2. Restart the backend server
3. Database connection is automatically established

## 📱 Mobile Support

-   Fully responsive design
-   Touch-friendly interactions
-   Optimized for mobile data usage
-   Progressive Web App features (PWA ready)

## 🔐 Security Features

-   JWT-based authentication
-   Role-based access control
-   File upload validation
-   Rate limiting
-   CORS protection
-   Input sanitization
-   SQL injection prevention

## 🚦 Environment Modes

### Development Mode

-   Mock database (no setup required)
-   Detailed error messages
-   Hot reloading
-   Development logging

### Production Mode

-   Real database connection required
-   Error message sanitization
-   Performance optimizations
-   Production logging

## � Query/Communication System

A complete admin-user communication platform for handling queries about reimbursement applications.

### Features
- **Admin Query Creation** - Send queries directly from review interface
- **Secure Token Access** - Employees access via email link (no login needed)
- **Conversation Threads** - Full chat-like message history
- **File Attachments** - Upload supporting documents
- **Priority Levels** - Mark urgent queries
- **Internal Notes** - Admin-only private notes
- **Status Tracking** - Open, replied, resolved states

### Documentation
- `QUERY_SYSTEM_COMPLETE.md` - Full system documentation (550+ lines)
- `QUERY_SYSTEM_QUICKSTART.md` - Step-by-step setup guide (400+ lines)
- `QUERY_SYSTEM_SUMMARY.md` - Implementation status
- `QUERY_SYSTEM_DIAGRAM.md` - Visual architecture guide
- `database/query_system_schema.sql` - Database schema

### Quick Setup
```bash
# 1. Install database schema in Supabase
psql -f database/query_system_schema.sql

# 2. Backend already configured ✅
# - Route: backend/src/routes/queries.ts
# - 11 endpoints ready

# 3. Frontend service ready ✅
# - Service: frontend/src/services/queryService.ts

# 4. Create UI components (see QUERY_SYSTEM_QUICKSTART.md)
```

## �📈 Performance Optimizations

-   Code splitting with React.lazy()
-   Image optimization
-   Gzip compression
-   API response caching
-   Efficient re-rendering
-   Bundle size optimization

## 🧪 Testing & Quality

### Automated Testing

-   **Backend**: Comprehensive Jest test suite with 17+ test cases
-   **API Testing**: Automated endpoint testing with real requests
-   **Type Safety**: Full TypeScript coverage for both frontend and backend
-   **Code Quality**: ESLint configuration for consistent code standards

### Manual Testing

-   **Testing Guide**: Complete step-by-step manual testing guide available
-   **API Documentation**: Interactive Swagger UI for endpoint testing
-   **Mock Data**: Pre-seeded test data for immediate testing
-   **Error Testing**: Comprehensive error scenario coverage

### Running Tests

```bash
# Backend tests
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report

# Frontend linting
cd frontend
npm run lint               # Check code quality
```

### Quality Assurance

-   TypeScript for compile-time type checking
-   ESLint for code quality enforcement
-   Consistent code formatting standards
-   Error boundary implementation
-   Comprehensive error handling and logging

## 🔧 Troubleshooting

### Common Issues

1. **Backend won't start**

    - Check if port 3001 is available
    - Verify Node.js version (18+)
    - Check environment variables

2. **Frontend can't connect to backend**

    - Verify backend is running on port 3001
    - Check CORS settings
    - Verify API URL in frontend .env

3. **Form submission fails**
    - Check browser console for errors
    - Verify server health indicator
    - Check network connectivity

### Development Tips

-   Use browser dev tools Network tab to monitor API calls
-   Check backend logs for detailed error information
-   Use the health check endpoint to verify backend status
-   Form data is auto-saved - refresh page to restore

## 🚀 Deployment

### Frontend (Netlify/Vercel)

```bash
cd frontend
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Render)

```bash
cd backend
npm run build
npm start
```

### Database Setup

1. Create Supabase project
2. Run SQL schema from `backend/src/database/schema/supabase_schema.sql`
3. Update environment variables
4. Test connection

## 📄 License

This project is developed for Jawaharlal Nehru University Medical Centre for internal use.

---

**Version**: 1.0.0  
**Last Updated**: September 2025
**Status**: ✅ Production Ready
