# JNU Medical Reimbursement System - Complete Manual Testing Guide

## 🚀 Quick Setup & Start

### Prerequisites

-   Node.js (v18 or higher)
-   npm or yarn
-   Web browser (Chrome/Firefox recommended for DevTools)

### Starting the Application

1. **Start the Backend Server:**

    ```bash
    cd backend
    npm run dev
    ```

    ✅ **Server Status:** Running on http://localhost:3001
    ✅ **Health Check:** http://localhost:3001/health  
    ✅ **API Documentation:** http://localhost:3001/api/docs

2. **Start the Frontend Server:**
    ```bash
    cd frontend
    npm run dev
    ```
    ✅ **Frontend:** Running on http://localhost:5173

## 🌐 Application URLs & Status

| Service               | URL                            | Status    | Description       |
| --------------------- | ------------------------------ | --------- | ----------------- |
| **Frontend App**      | http://localhost:5173          | 🟢 Active | React application |
| **Backend API**       | http://localhost:3001          | 🟢 Active | Express.js server |
| **API Documentation** | http://localhost:3001/api/docs | 🟢 Active | Swagger UI        |
| **Health Check**      | http://localhost:3001/health   | 🟢 Active | Server monitoring |

## 📋 Complete API Endpoints Reference

### 🔐 Authentication Routes (`/api/auth`)

-   `POST /api/auth/register` - Register new user
-   `POST /api/auth/login` - User login
-   `GET /api/auth/profile` - Get current user profile
-   `POST /api/auth/logout` - User logout
-   `POST /api/auth/change-password` - Change user password

### � Applications Routes (`/api/applications`)

-   `POST /api/applications` - Submit new application
-   `GET /api/applications` - Get user's applications (with pagination)
-   `GET /api/applications/:id` - Get specific application details
-   `PATCH /api/applications/:id/status` - Update application status (admin only)
-   `DELETE /api/applications/:id` - Delete application
-   `GET /api/applications/stats` - Get application statistics (admin only)

### 📁 Files Routes (`/api/files`)

-   `POST /api/files/upload` - Upload application documents
-   `GET /api/files/:id` - Download/view uploaded file
-   `DELETE /api/files/:id` - Delete uploaded file

### 👥 Users Routes (`/api/users`)

-   `GET /api/users/profile` - Get current user profile
-   `PATCH /api/users/profile` - Update user profile
-   `GET /api/users/:id` - Get specific user (admin only)

### 🔧 Admin Routes (`/api/admin`)

-   `GET /api/admin/dashboard` - Admin dashboard statistics
-   `GET /api/admin/applications` - Get all applications (admin view)
-   `PATCH /api/admin/applications/:id/status` - Update application status
-   `GET /api/admin/users` - Get all users
-   `GET /api/admin/audit-logs` - Get system audit logs
-   `GET /api/admin/export/applications` - Export applications data
-   `GET /api/admin/system-info` - Get system information

## 🧪 Step-by-Step Manual Testing

### 1. Authentication Testing

#### A. Register New User

**Step 1:** Open http://localhost:3001/api/docs  
**Step 2:** Find "POST /api/auth/register" endpoint  
**Step 3:** Click "Try it out"  
**Step 4:** Use this exact test data:

```json
{
    "email": "testuser@jnu.ac.in",
    "password": "Password123!",
    "name": "Test User",
    "employeeId": "EMP001",
    "department": "Computer Science",
    "designation": "Assistant Professor",
    "role": "employee"
}
```

**Expected Response:**

```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": "uuid-here",
            "email": "testuser@jnu.ac.in",
            "name": "Test User",
            "role": "employee",
            "employeeId": "EMP001",
            "department": "Computer Science",
            "designation": "Assistant Professor"
        }
    }
}
```

#### B. User Login

**Step 1:** Use "POST /api/auth/login" endpoint  
**Step 2:** Test with registered user:

```json
{
    "email": "testuser@jnu.ac.in",
    "password": "Password123!"
}
```

**Expected Response:**

```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": "uuid-here",
            "email": "testuser@jnu.ac.in",
            "name": "Test User",
            "role": "employee"
        }
    }
}
```

**🔑 IMPORTANT:** Copy the JWT token from login response!

#### C. Get User Profile

**Step 1:** Use "GET /api/auth/profile" endpoint  
**Step 2:** Click the 🔓 lock icon next to endpoint  
**Step 3:** Enter: `Bearer YOUR_JWT_TOKEN_HERE`  
**Step 4:** Execute request

**Expected Response:**

```json
{
    "success": true,
    "data": {
        "id": "uuid-here",
        "email": "testuser@jnu.ac.in",
        "name": "Test User",
        "role": "employee",
        "employeeId": "EMP001",
        "department": "Computer Science",
        "designation": "Assistant Professor",
        "isActive": true,
        "createdAt": "2025-09-20T12:34:56.789Z",
        "updatedAt": "2025-09-20T12:34:56.789Z"
    }
}
```

### 2. Application Testing

#### A. Submit Medical Application

**Step 1:** Use "POST /api/applications" endpoint  
**Step 2:** Authorize with Bearer token  
**Step 3:** Submit with this complete data:

```json
{
    "employeeName": "Test User",
    "employeeId": "EMP001",
    "designation": "Assistant Professor",
    "department": "Computer Science",
    "cghsCardNumber": "1234567890",
    "cghsDispensary": "JNU CGHS Dispensary",
    "cardValidity": "2025-12-31",
    "wardEntitlement": "General",
    "patientName": "Test User",
    "patientCghsCard": "1234567890",
    "relationshipWithEmployee": "self",
    "hospitalName": "AIIMS New Delhi",
    "hospitalAddress": "Ansari Nagar, New Delhi - 110029",
    "treatmentType": "opd",
    "clothesProvided": false,
    "priorPermission": false,
    "emergencyTreatment": false,
    "healthInsurance": false,
    "totalAmountClaimed": 2500.0,
    "totalAmountPassed": 2500.0,
    "bankName": "State Bank of India",
    "branchAddress": "JNU Branch, New Delhi",
    "accountNumber": "123456789012",
    "ifscCode": "SBIN0001234",
    "enclosuresCount": 3,
    "photocopyCGHSCard": true,
    "photocopiesOriginalPrescriptions": true,
    "originalBills": true,
    "signature": "Test User",
    "declarationPlace": "New Delhi",
    "declarationDate": "2025-09-20",
    "facultyEmployeeId": "EMP001",
    "mobileNumber": "+91-9999999999",
    "email": "testuser@jnu.ac.in",
    "expenses": [
        {
            "description": "Doctor Consultation",
            "amount": 1000.0,
            "category": "consultation",
            "receiptNumber": "REC001"
        },
        {
            "description": "Medicine",
            "amount": 1500.0,
            "category": "medicine",
            "receiptNumber": "REC002"
        }
    ]
}
```

**Expected Response:**

```json
{
    "success": true,
    "message": "Application submitted successfully",
    "data": {
        "applicationId": "uuid-here",
        "status": "pending",
        "submittedAt": "2025-09-20T12:34:56.789Z"
    }
}
```

#### B. Get User Applications

**Step 1:** Use "GET /api/applications" endpoint  
**Step 2:** Authorize with Bearer token  
**Step 3:** Optional query parameters:

-   `status`: pending, under_review, approved, rejected, completed
-   `page`: 1, 2, 3... (default: 1)
-   `limit`: 5, 10, 20... (default: 10)

**Example:** `/api/applications?status=pending&page=1&limit=5`

**Expected Response:**

```json
{
    "success": true,
    "data": {
        "applications": [
            {
                "id": "uuid-here",
                "status": "pending",
                "employeeName": "Test User",
                "patientName": "Test User",
                "totalAmountClaimed": 2500.0,
                "submittedAt": "2025-09-20T12:34:56.789Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 5,
            "total": 1,
            "totalPages": 1
        }
    }
}
```

### 3. File Upload Testing

#### A. Upload Application Documents

**Step 1:** Use "POST /api/files/upload" endpoint  
**Step 2:** Authorize with Bearer token  
**Step 3:** Set up form data:

-   `applicationId`: Use the application ID from previous step
-   `documentType`: prescription, receipt, report, discharge_summary, other
-   `files`: Select actual files from your computer

**Expected Response:**

```json
{
    "success": true,
    "message": "Files uploaded successfully",
    "data": {
        "uploadedFiles": [
            {
                "id": "file-uuid",
                "filename": "prescription.pdf",
                "mimetype": "application/pdf",
                "size": 1024000,
                "uploadedAt": "2025-09-20T12:34:56.789Z"
            }
        ]
    }
}
```

## 🔍 Error Testing Scenarios

### Authentication Errors

1. **Invalid email format:** Use `testuser@invalid`
2. **Missing password:** Leave password field empty
3. **Invalid credentials:** Wrong email/password combination
4. **Expired token:** Use old JWT token
5. **Missing authorization:** Don't include Bearer token

### Application Errors

1. **Missing required fields:** Submit without employeeName
2. **Invalid amounts:** Use negative numbers or strings
3. **Invalid dates:** Use past dates for future fields
4. **Invalid status:** Try to set invalid status

### Expected Error Responses:

```json
{
    "success": false,
    "message": "Specific error message",
    "errors": ["Field validation errors if applicable"]
}
```

## 📊 Pre-seeded Test Data

The mock database includes these test accounts:

### Test Users:

```json
[
    {
        "email": "admin@jnu.ac.in",
        "password": "password",
        "role": "super_admin"
    },
    {
        "email": "employee@jnu.ac.in",
        "password": "password",
        "role": "employee"
    },
    {
        "email": "medical@jnu.ac.in",
        "password": "password",
        "role": "medical_officer"
    }
]
```

### Sample Applications:

-   Multiple applications in different statuses
-   Associated expense items and documents
-   Audit logs and system activity

## 🎯 Testing Checklist

### ✅ Basic Functionality

-   [ ] Server starts without errors
-   [ ] Health check responds with 200 OK
-   [ ] Swagger documentation loads
-   [ ] User registration works
-   [ ] User login returns JWT token
-   [ ] Profile endpoint requires authentication
-   [ ] Applications can be submitted
-   [ ] Applications can be retrieved
-   [ ] File uploads work properly

### ✅ Security Testing

-   [ ] Endpoints require proper authentication
-   [ ] Invalid tokens are rejected
-   [ ] Role-based access control works
-   [ ] Password validation enforced
-   [ ] Input validation prevents injection

### ✅ Error Handling

-   [ ] 400 errors for invalid input
-   [ ] 401 errors for missing authentication
-   [ ] 403 errors for insufficient permissions
-   [ ] 404 errors for nonexistent resources
-   [ ] 500 errors handled gracefully

## 🚀 Frontend Integration Testing

### 1. Start Frontend Application

```bash
cd frontend
npm run dev
```

### 2. Frontend Testing URLs

-   **Main App:** http://localhost:5173
-   **Login Page:** http://localhost:5173/login
-   **Dashboard:** http://localhost:5173/dashboard
-   **Application Form:** http://localhost:5173/application
-   **Status Tracker:** http://localhost:5173/status

### 3. Frontend Test Scenarios

1. **Registration Flow:** Sign up new user via UI
2. **Login Flow:** Login with test credentials
3. **Form Submission:** Submit medical application through UI
4. **File Upload:** Upload documents via drag-and-drop
5. **Status Tracking:** View application status updates
6. **Profile Management:** Update user profile information

---

## 🔧 Troubleshooting Common Issues

### Backend Issues:

-   **Port 3001 in use:** Kill process with `npx kill-port 3001`
-   **Database errors:** Check mock database logs in terminal
-   **JWT errors:** Ensure JWT_SECRET is set in environment

### Frontend Issues:

-   **CORS errors:** Verify backend allows localhost:5173
-   **API connection:** Check network tab in browser DevTools
-   **Token expiration:** Re-login to get fresh JWT token

### API Testing Issues:

-   **Swagger not loading:** Verify backend is running on port 3001
-   **Authorization failed:** Check Bearer token format
-   **Request timeouts:** Check server logs for errors

---

**🎉 Testing Complete!** Your JNU Medical Reimbursement System is fully functional with comprehensive API coverage.
"password": "TestPassword123!",
"name": "Test User",
"role": "employee",
"employeeId": "EMP001",
"department": "Computer Science"
}

````

2. **Login:**

    ```json
    POST /api/auth/login
    {
      "email": "test@jnu.ac.in",
      "password": "TestPassword123!"
    }
    ```

    **Copy the JWT token from response**

3. **Get Profile** (use Authorization: Bearer <token>):
    ```
    GET /api/auth/profile
    Headers: Authorization: Bearer <your-jwt-token>
    ```

### 3. Medical Reimbursement Application Testing

#### Submit New Application

1. **Use the token from login** in Authorization header
2. **Test endpoint:** `POST /api/applications`
3. **Sample payload:**
    ```json
    {
        "employeeName": "John Doe",
        "employeeId": "EMP001",
        "designation": "Assistant Professor",
        "department": "Computer Science",
        "cghsCardNumber": "1234567890",
        "cghsDispensary": "JNU CGHS",
        "cardValidity": "2025-12-31",
        "wardEntitlement": "General",
        "patientName": "John Doe",
        "patientCghsCard": "1234567890",
        "relationshipWithEmployee": "self",
        "hospitalName": "AIIMS Delhi",
        "hospitalAddress": "Ansari Nagar, New Delhi",
        "treatmentType": "opd",
        "clothesProvided": false,
        "priorPermission": false,
        "emergencyTreatment": false,
        "healthInsurance": false,
        "totalAmountClaimed": 5000.0,
        "totalAmountPassed": 5000.0,
        "bankName": "State Bank of India",
        "branchAddress": "JNU Branch",
        "accountNumber": "123456789012",
        "ifscCode": "SBIN0001234",
        "enclosuresCount": 3,
        "photocopyCGHSCard": true,
        "photocopiesOriginalPrescriptions": true,
        "originalBills": true,
        "signature": "John Doe",
        "declarationPlace": "New Delhi",
        "declarationDate": "2025-09-20",
        "facultyEmployeeId": "EMP001",
        "mobileNumber": "+91-9999999999",
        "email": "john.doe@jnu.ac.in"
    }
    ```

### 4. File Upload Testing

1. **Endpoint:** `POST /api/files/upload`
2. **Headers:** Authorization: Bearer <token>
3. **Form Data:**
    - applicationId: <application-id-from-previous-step>
    - documentType: prescription|receipt|report|discharge_summary|other
    - files: Select actual files to upload

### 5. Error Handling Testing

#### Test Invalid Scenarios:

1. **Invalid email format**
2. **Weak passwords**
3. **Missing required fields**
4. **Unauthorized access** (no token)
5. **Invalid tokens**
6. **File size limits**
7. **Unsupported file types**

## 🧪 Database State (Mock Data)

The application uses an in-memory mock database for testing. The data includes:

### Pre-seeded Users:

-   **Admin:** admin@jnu.ac.in / password (super_admin role)
-   **Employee:** employee@jnu.ac.in / password (employee role)
-   **Health Centre:** health@jnu.ac.in / password (medical_officer role)
-   **OBC:** obc@jnu.ac.in / password (admin role)

### Application Status Flow:

1. `pending` - Initial submission
2. `under_review` - Being reviewed by medical officer
3. `approved` - Approved for reimbursement
4. `rejected` - Rejected with comments
5. `completed` - Reimbursement processed

## 🔍 Monitoring & Logs

### Backend Logs

Check the backend terminal for detailed logs:

-   Request/response logs
-   Database operations
-   Authentication events
-   Error messages

### Frontend Console

Open browser DevTools (F12) to see:

-   Network requests
-   API responses
-   JavaScript errors
-   Component state changes

## 🚨 Common Issues & Troubleshooting

### Backend Issues:

1. **Port 3001 already in use:**

    ```bash
    # Kill the process and restart
    npx kill-port 3001
    npm run dev
    ```

2. **Database connection errors:**
    - The app uses mock database in development
    - Check the logs for "Mock database connection established"

### Frontend Issues:

1. **Port 5173 already in use:**

    - Vite will automatically use the next available port
    - Check terminal output for the actual URL

2. **CORS errors:**
    - Backend is configured to accept requests from localhost:5173
    - Ensure both servers are running

### Authentication Issues:

1. **JWT token expired:**

    - Tokens are valid for 7 days
    - Re-login to get a new token

2. **Unauthorized errors:**
    - Ensure you're including the Authorization header
    - Format: `Bearer <your-jwt-token>`

## 📊 Success Metrics

### What Should Work:

✅ User registration and login
✅ JWT token generation and validation
✅ Profile retrieval with proper user data
✅ Application submission with all required fields
✅ File upload functionality
✅ Proper error handling and validation
✅ API documentation accessible
✅ All 17 test cases passing

### Performance Expectations:

-   API responses < 1 second
-   Frontend loads < 3 seconds
-   File uploads < 30 seconds (depending on size)

## 🎯 Test Scenarios Checklist

### Basic Functionality:

-   [ ] Frontend loads without errors
-   [ ] Backend API responds to health check
-   [ ] Swagger documentation accessible
-   [ ] User registration works
-   [ ] User login works
-   [ ] Profile retrieval works
-   [ ] Application submission works
-   [ ] File upload works

### Security Testing:

-   [ ] Password validation enforced
-   [ ] JWT tokens required for protected routes
-   [ ] Invalid tokens rejected
-   [ ] CORS configured correctly

### Error Handling:

-   [ ] Graceful handling of network errors
-   [ ] Proper validation error messages
-   [ ] 404 handling for invalid routes
-   [ ] 500 error handling

## 📞 Need Help?

If you encounter issues:

1. Check the terminal logs for both frontend and backend
2. Open browser DevTools to see network requests
3. Verify the API documentation at http://localhost:3001/api/docs
4. Run the automated tests: `cd backend && npm test`

---

**Happy Testing! 🚀**

_The Medical Reimbursement System is fully functional with comprehensive authentication, application management, and file upload capabilities._
````
