const fetch = require('node-fetch');

const API_URL = 'http://localhost:3005/api';

const credentials = [
    { email: 'obc@jnu.ac.in', password: 'obc123', label: 'OBC Admin' },
    { email: 'health@jnu.ac.in', password: 'health123', label: 'Health Centre' },
    { email: 'admin@jnu.ac.in', password: 'super123', label: 'Super Admin' }
];

async function testLogin(email, password, label) {
    console.log(`\nTesting ${label} (${email})...`);
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log(`✅ SUCCESS - ${label} login worked!`);
            console.log(`   Role: ${data.data?.user?.role}`);
            console.log(`   Token: ${data.data?.token?.substring(0, 20)}...`);
        } else {
            console.log(`❌ FAILED - ${label} login failed`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Message: ${data.message}`);
        }
    } catch (error) {
        console.log(`❌ ERROR - ${label}`);
        console.log(`   ${error.message}`);
    }
}

async function runTests() {
    console.log('Testing Admin Login Credentials...');
    console.log('=====================================');
    
    for (const cred of credentials) {
        await testLogin(cred.email, cred.password, cred.label);
    }
    
    console.log('\n=====================================');
    console.log('Tests completed');
}

runTests().catch(console.error);
