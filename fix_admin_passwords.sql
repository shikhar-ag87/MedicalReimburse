-- Fix admin user passwords with proper bcrypt hashes
-- Run this in Supabase SQL Editor

-- Update admin users with properly hashed passwords (password123)
UPDATE admin_users 
SET password = '$2b$10$8K1p/a0dqbeCH9cqj3Q8.OJd3.GqA4dKJ6AzGQ.WPOhN3mRFKmYnq'
WHERE email = 'admin@jnu.ac.in';

UPDATE admin_users 
SET password = '$2b$10$8K1p/a0dqbeCH9cqj3Q8.OJd3.GqA4dKJ6AzGQ.WPOhN3mRFKmYnq' 
WHERE email = 'health@jnu.ac.in';

UPDATE admin_users 
SET password = '$2b$10$8K1p/a0dqbeCH9cqj3Q8.OJd3.GqA4dKJ6AzGQ.WPOhN3mRFKmYnq'
WHERE email = 'obc@jnu.ac.in';

-- Verify the updates
SELECT email, name, role, 
       CASE WHEN password IS NOT NULL THEN 'Password Set' ELSE 'No Password' END as password_status
FROM admin_users;

-- Success message
SELECT 'Admin passwords updated successfully! All passwords are: password123' as status;