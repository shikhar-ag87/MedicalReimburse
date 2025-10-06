-- Check what passwords are currently in the database
SELECT 
    email,
    role,
    is_active,
    LEFT(password_hash, 20) as hash_preview,
    LENGTH(password_hash) as hash_length,
    CASE 
        WHEN password_hash = '$2b$10$bk4cnWFANw70/LsLiSQ2meq6g3BkFZICkHHcgzJjM9P4xpjcyzXnK' THEN '✅ obc123 hash correct'
        WHEN password_hash = '$2b$10$m03Lib9H.V3UPtZNXhtIieEXbpz.BhdKmhb3lELgLtY2LtpL7WWOa' THEN '✅ health123 hash correct'
        WHEN password_hash = '$2b$10$7JHR1PlxDj0QHAP1imD69ONp4O5NL7n1YmamkEg8tAwZfRt.O2Rja' THEN '✅ super123 hash correct'
        ELSE '❌ Hash does not match expected values'
    END as status
FROM admin_users
ORDER BY role;
