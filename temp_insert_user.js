const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://mcgepadglynbhibcojgb.supabase.co";
const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZ2VwYWRnbHluYmhpYmNvamdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjExNjA1MSwiZXhwIjoyMDUxNjkyMDUxfQ.D5mHdDzCDHEKAZ6n-TdKSf8TVwKkA1d5xR-0dI33m9U";

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertAnonymousUser() {
    try {
        // First check if user exists
        const { data: existingUser, error: checkError } = await supabase
            .from("users")
            .select("id")
            .eq("id", "00000000-0000-0000-0000-000000000000")
            .single();

        if (existingUser) {
            console.log("Anonymous user already exists");
            return;
        }

        if (checkError && checkError.code !== "PGRST116") {
            // PGRST116 is "not found"
            console.error("Error checking existing user:", checkError);
            return;
        }

        // Insert anonymous user
        const { data, error } = await supabase.from("users").insert({
            id: "00000000-0000-0000-0000-000000000000",
            email: "anonymous@system",
            password_hash: "anonymous_hash", // Not used for anonymous
            role: "employee",
            name: "Anonymous User",
            employee_id: "ANONYMOUS",
            is_active: true,
        });

        if (error) {
            console.error("Error inserting anonymous user:", error);
        } else {
            console.log("Anonymous user created successfully");
        }
    } catch (err) {
        console.error("Exception:", err);
    }
}

insertAnonymousUser().then(() => process.exit(0));
