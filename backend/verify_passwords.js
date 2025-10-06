const bcrypt = require('bcryptjs');

// The passwords from ADMIN_CREDENTIALS.md
const credentials = [
    { email: 'obc@jnu.ac.in', password: 'obc123' },
    { email: 'health@jnu.ac.in', password: 'health123' },
    { email: 'admin@jnu.ac.in', password: 'super123' }
];

// The hashes that were generated
const hashes = {
    'obc@jnu.ac.in': '$2b$10$bk4cnWFANw70/LsLiSQ2meq6g3BkFZICkHHcgzJjM9P4xpjcyzXnK',
    'health@jnu.ac.in': '$2b$10$m03Lib9H.V3UPtZNXhtIieEXbpz.BhdKmhb3lELgLtY2LtpL7WWOa',
    'admin@jnu.ac.in': '$2b$10$7JHR1PlxDj0QHAP1imD69ONp4O5NL7n1YmamkEg8tAwZfRt.O2Rja'
};

async function verifyAll() {
    console.log('Verifying password hashes...\n');
    
    for (const cred of credentials) {
        const hash = hashes[cred.email];
        const isValid = await bcrypt.compare(cred.password, hash);
        console.log(`${cred.email} / ${cred.password}`);
        console.log(`Hash: ${hash}`);
        console.log(`Valid: ${isValid ? '✅ YES' : '❌ NO'}`);
        console.log('---');
    }
}

verifyAll().catch(console.error);
