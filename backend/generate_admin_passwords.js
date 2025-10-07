// Script to generate bcrypt password hashes for admin users
// Run this with: node generate_admin_passwords.js

const bcrypt = require("bcrypt");

const passwords = {
    "obc@jnu.ac.in": "obc123",
    "health@jnu.ac.in": "health123",
    "admin@jnu.ac.in": "super123",
};

async function generateHashes() {
    console.log("Generating password hashes...\n");

    for (const [email, password] of Object.entries(passwords)) {
        const hash = await bcrypt.hash(password, 10);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Hash: ${hash}`);
        console.log("---");
    }

    console.log("\nSQL Update Statements:");
    console.log("-- Copy and paste these into Supabase SQL Editor\n");

    for (const [email, password] of Object.entries(passwords)) {
        const hash = await bcrypt.hash(password, 10);
        console.log(
            `UPDATE admin_users SET password = '${hash}' WHERE email = '${email}';`
        );
    }
}

generateHashes().catch(console.error);
