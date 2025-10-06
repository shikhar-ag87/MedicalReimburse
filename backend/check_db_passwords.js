require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPasswords() {
    console.log('Checking password hashes in database...\n');
    
    const { data, error } = await supabase
        .from('admin_users')
        .select('email, role, password_hash, is_active')
        .order('role');
    
    if (error) {
        console.error('❌ Error querying database:', error);
        return;
    }
    
    if (!data || data.length === 0) {
        console.log('❌ No admin users found in database!');
        return;
    }
    
    console.log(`Found ${data.length} admin users:\n`);
    
    const expectedHashes = {
        'obc@jnu.ac.in': '$2b$10$bk4cnWFANw70/LsLiSQ2meq6g3BkFZICkHHcgzJjM9P4xpjcyzXnK',
        'health@jnu.ac.in': '$2b$10$m03Lib9H.V3UPtZNXhtIieEXbpz.BhdKmhb3lELgLtY2LtpL7WWOa',
        'admin@jnu.ac.in': '$2b$10$7JHR1PlxDj0QHAP1imD69ONp4O5NL7n1YmamkEg8tAwZfRt.O2Rja'
    };
    
    for (const user of data) {
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Active: ${user.is_active}`);
        console.log(`Password Hash: ${user.password_hash ? user.password_hash.substring(0, 30) + '...' : 'NULL'}`);
        
        const expected = expectedHashes[user.email];
        if (expected) {
            const matches = user.password_hash === expected;
            console.log(`Status: ${matches ? '✅ CORRECT' : '❌ WRONG - needs update!'}`);
            
            if (!matches) {
                console.log(`Expected: ${expected.substring(0, 30)}...`);
                console.log(`Actual:   ${user.password_hash ? user.password_hash.substring(0, 30) + '...' : 'NULL'}`);
            }
        }
        console.log('---');
    }
    
    console.log('\n📝 If any passwords are WRONG, run update_admin_passwords.sql in Supabase SQL Editor!');
}

checkPasswords().catch(console.error);
