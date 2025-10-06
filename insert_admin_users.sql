-- Insert missing admin users
-- Run this in Supabase SQL Editor

-- Check if users exist first
DO $$
BEGIN
    -- Insert OBC admin if not exists
    IF NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'obc@jnu.ac.in') THEN
        INSERT INTO admin_users (
            email,
            password_hash,
            name,
            role,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            'obc@jnu.ac.in',
            '$2b$10$bk4cnWFANw70/LsLiSQ2meq6g3BkFZICkHHcgzJjM9P4xpjcyzXnK',
            'OBC Cell Admin',
            'admin',
            true,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Created OBC admin user';
    ELSE
        UPDATE admin_users 
        SET password_hash = '$2b$10$bk4cnWFANw70/LsLiSQ2meq6g3BkFZICkHHcgzJjM9P4xpjcyzXnK',
            updated_at = NOW()
        WHERE email = 'obc@jnu.ac.in';
        RAISE NOTICE 'Updated OBC admin password';
    END IF;

    -- Insert Health Centre admin if not exists
    IF NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'health@jnu.ac.in') THEN
        INSERT INTO admin_users (
            email,
            password_hash,
            name,
            role,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            'health@jnu.ac.in',
            '$2b$10$m03Lib9H.V3UPtZNXhtIieEXbpz.BhdKmhb3lELgLtY2LtpL7WWOa',
            'Health Centre Admin',
            'medical_officer',
            true,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Created Health Centre admin user';
    ELSE
        UPDATE admin_users 
        SET password_hash = '$2b$10$m03Lib9H.V3UPtZNXhtIieEXbpz.BhdKmhb3lELgLtY2LtpL7WWOa',
            updated_at = NOW()
        WHERE email = 'health@jnu.ac.in';
        RAISE NOTICE 'Updated Health Centre admin password';
    END IF;

    -- Update Super Admin password if exists
    IF EXISTS (SELECT 1 FROM admin_users WHERE email = 'admin@jnu.ac.in') THEN
        UPDATE admin_users 
        SET password_hash = '$2b$10$7JHR1PlxDj0QHAP1imD69ONp4O5NL7n1YmamkEg8tAwZfRt.O2Rja',
            updated_at = NOW()
        WHERE email = 'admin@jnu.ac.in';
        RAISE NOTICE 'Updated Super Admin password';
    END IF;
END $$;

-- Verify the results
SELECT 
    email,
    name,
    role,
    is_active,
    CASE 
        WHEN email = 'obc@jnu.ac.in' AND password_hash = '$2b$10$bk4cnWFANw70/LsLiSQ2meq6g3BkFZICkHHcgzJjM9P4xpjcyzXnK' THEN '✅ obc123'
        WHEN email = 'health@jnu.ac.in' AND password_hash = '$2b$10$m03Lib9H.V3UPtZNXhtIieEXbpz.BhdKmhb3lELgLtY2LtpL7WWOa' THEN '✅ health123'
        WHEN email = 'admin@jnu.ac.in' AND password_hash = '$2b$10$7JHR1PlxDj0QHAP1imD69ONp4O5NL7n1YmamkEg8tAwZfRt.O2Rja' THEN '✅ super123'
        ELSE '❓ Unknown or wrong password'
    END as password_status
FROM admin_users
WHERE email IN ('obc@jnu.ac.in', 'health@jnu.ac.in', 'admin@jnu.ac.in')
ORDER BY role;
