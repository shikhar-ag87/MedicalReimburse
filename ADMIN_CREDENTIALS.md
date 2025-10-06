# Admin Portal Credentials

This document contains the login credentials for accessing the different admin portals in the Medical Reimbursement System.

## Admin Portals

### 1. OBC/SC/ST Cell Dashboard
- **URL**: `/admin/obc`
- **Email**: `obc@jnu.ac.in`
- **Password**: `obc123`
- **Role**: Initial review and verification of applications

### 2. Health Centre Dashboard
- **URL**: `/admin/health-centre`
- **Email**: `health@jnu.ac.in`
- **Password**: `health123`
- **Role**: Medical review and expense validation

### 3. Super Admin Dashboard
- **URL**: `/admin/super`
- **Email**: `admin@jnu.ac.in`
- **Password**: `super123`
- **Role**: System-wide oversight, reports, and user management

## ⚠️ IMPORTANT: Database Setup Required

Before logging in, you **MUST** run the password update script in Supabase:

1. Open Supabase SQL Editor
2. Copy and paste the contents of `update_admin_passwords.sql`
3. Execute the SQL script
4. Verify the passwords are updated

The script sets the correct bcrypt password hashes for all admin users.

## Login Process

1. Navigate to `/admin/login`
2. Enter the email (username) and password
3. You will be automatically redirected to your role-specific dashboard

## Features by Role

### OBC Cell
- View all pending applications
- Review application details
- Forward applications to Health Centre
- Update application status

### Health Centre
- View applications forwarded by OBC Cell
- Review medical expenses
- Approve/modify expense amounts
- Add medical review comments
- Forward to final approval

### Super Admin
- View system-wide statistics
- Access all applications
- Manage users
- Generate reports
- View audit logs
- System configuration

## Security Notes

- All passwords should be changed in production
- Authentication uses JWT tokens stored in localStorage
- Tokens expire after the configured time period
- Role-based access control prevents unauthorized access
- All API endpoints require valid authentication

## Database Users

The admin users are created in the database using the `fix_admin_passwords.sql` script:

```sql
-- OBC Admin
INSERT INTO users (email, password, name, role, is_active) 
VALUES ('obc@jnu.ac.in', '$2b$10$...', 'OBC Administrator', 'admin', true);

-- Health Centre Admin  
INSERT INTO users (email, password, name, role, is_active)
VALUES ('health@jnu.ac.in', '$2b$10$...', 'Health Centre Officer', 'medical_officer', true);

-- Super Admin
INSERT INTO users (email, password, name, role, is_active)
VALUES ('superadmin@jnu.ac.in', '$2b$10$...', 'Super Administrator', 'super_admin', true);
```

## Troubleshooting

### Cannot Login
1. Check that the backend server is running
2. Verify database connection
3. Ensure admin users exist in the database
4. Check browser console for error messages
5. Clear localStorage and try again

### Wrong Dashboard After Login
- The system automatically redirects based on user role
- If redirected incorrectly, the role mapping may need adjustment in `AuthContext.tsx`

### Session Expires
- Login again to refresh the authentication token
- Token expiration time can be configured in backend environment variables

## Development Notes

- Role mapping is handled in `frontend/src/contexts/AuthContext.tsx`
- Backend roles: `admin`, `medical_officer`, `super_admin`
- Frontend roles: `obc`, `health-centre`, `super-admin`
- The mapping ensures compatibility between backend and frontend systems
