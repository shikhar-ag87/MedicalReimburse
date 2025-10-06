-- Update Admin User Passwords
-- Run this in Supabase SQL Editor to set the correct passwords

-- Update OBC admin password (obc123)
UPDATE admin_users
SET password_hash = '$2b$10$bk4cnWFANw70/LsLiSQ2meq6g3BkFZICkHHcgzJjM9P4xpjcyzXnK'
WHERE email = 'obc@jnu.ac.in';

-- Update Health Centre admin password (health123)
UPDATE admin_users
SET password_hash = '$2b$10$m03Lib9H.V3UPtZNXhtIieEXbpz.BhdKmhb3lELgLtY2LtpL7WWOa'
WHERE email = 'health@jnu.ac.in';

-- Update Super Admin password (super123)
UPDATE admin_users
SET password_hash = '$2b$10$7JHR1PlxDj0QHAP1imD69ONp4O5NL7n1YmamkEg8tAwZfRt.O2Rja'
WHERE email = 'admin@jnu.ac.in';

-- Verify the updates
SELECT 
    email, 
    name, 
    role, 
    is_active,
    CASE 
        WHEN email = 'obc@jnu.ac.in' THEN 'obc123'
        WHEN email = 'health@jnu.ac.in' THEN 'health123'
        WHEN email = 'admin@jnu.ac.in' THEN 'super123'
    END as password_plaintext,
    CASE WHEN password_hash IS NOT NULL THEN 'Password Set' ELSE 'No Password' END as password_status
FROM admin_users
ORDER BY role;

-- Success message
SELECT '✅ Admin passwords updated successfully!' as status,
       'Use the credentials from ADMIN_CREDENTIALS.md to login' as instructions;
