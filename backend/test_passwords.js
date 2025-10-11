const bcrypt = require('bcrypt');

// Test passwords from the credentials document
const testCases = [
    { password: 'obc123', email: 'obc@jnu.ac.in' },
    { password: 'health123', email: 'health@jnu.ac.in' },
    { password: 'super123', email: 'admin@jnu.ac.in' }
];

console.log('🔐 Password Hash Generator\n');
console.log('Copy these hashes and run the SQL update script in Supabase:\n');

async function generateHashes() {
    for (const test of testCases) {
        const hash = await bcrypt.hash(test.password, 10);
        console.log(`-- ${test.email}`);
        console.log(`UPDATE users SET password = '${hash}' WHERE email = '${test.email}';\n`);
    }
    
    console.log('\n\n📋 Verification SQL:\n');
    console.log('SELECT email, name, role, is_active, LEFT(password, 20) as password_prefix FROM users WHERE email IN (\'obc@jnu.ac.in\', \'health@jnu.ac.in\', \'admin@jnu.ac.in\');\n');
}

generateHashes().catch(console.error);
