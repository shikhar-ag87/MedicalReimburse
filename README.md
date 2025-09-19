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
-   **Modular Database Architecture** (easily swappable)
-   **Supabase** as default database (with PostgreSQL, MySQL support)
-   **JWT Authentication** system
-   **File Upload** with validation
-   **Email Notifications** system
-   **Comprehensive API** with proper error handling

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
DATABASE_TYPE=supabase

# For production, configure your actual Supabase credentials
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
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
-   **API Documentation**: http://localhost:3001/api

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
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   └── form/           # Form step components
│   │   ├── pages/              # Main pages
│   │   ├── services/           # API integration
│   │   ├── hooks/              # React hooks
│   │   ├── types/              # TypeScript definitions
│   │   └── utils/              # Validation utilities
│   └── public/                 # Static assets
│
├── backend/                    # Node.js backend
│   ├── src/
│   │   ├── routes/             # API routes
│   │   ├── database/           # Database abstraction
│   │   │   ├── providers/      # DB provider implementations
│   │   │   └── schema/         # Database schemas
│   │   ├── middleware/         # Express middleware
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Utilities
│   │   └── types/              # TypeScript definitions
│   └── logs/                   # Application logs
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

### Applications

-   `POST /api/applications` - Submit new application
-   `GET /api/applications` - Get user applications
-   `GET /api/applications/:id` - Get application details
-   `PATCH /api/applications/:id/status` - Update status (admin)

### Authentication

-   `POST /api/auth/login` - User login
-   `POST /api/auth/register` - User registration
-   `GET /api/auth/me` - Get current user
-   `POST /api/auth/logout` - User logout

### File Management

-   `POST /api/files/upload` - Upload documents
-   `GET /api/files/:id` - Download file
-   `DELETE /api/files/:id` - Delete file

### Admin

-   `GET /api/admin/dashboard` - Dashboard statistics
-   `GET /api/admin/applications` - All applications
-   `GET /api/admin/users` - User management

## 🔄 Database Support

The system supports multiple databases through a modular architecture:

### Currently Supported

-   ✅ **Supabase** (PostgreSQL-based, default)
-   ✅ **PostgreSQL** (direct connection)
-   🔜 **MySQL** (planned)
-   🔜 **MongoDB** (planned)

### Switching Databases

1. Update `DATABASE_TYPE` in `.env`
2. Provide connection details
3. Run migrations if needed
4. Restart backend server

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

## 📈 Performance Optimizations

-   Code splitting with React.lazy()
-   Image optimization
-   Gzip compression
-   API response caching
-   Efficient re-rendering
-   Bundle size optimization

## 🧪 Testing & Quality

-   TypeScript for type safety
-   ESLint for code quality
-   Consistent code formatting
-   Error boundary implementation
-   Comprehensive error handling

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

## 📞 Support

For technical support or questions:

-   **Email**: medical@jnu.ac.in
-   **Phone**: 011-26704077
-   **Office Hours**: Mon-Fri, 9:00 AM - 5:00 PM

## 📄 License

This project is developed for Jawaharlal Nehru University Medical Centre for internal use.

---

**Version**: 1.0.0  
**Last Updated**: September 2024  
**Status**: ✅ Production Ready
