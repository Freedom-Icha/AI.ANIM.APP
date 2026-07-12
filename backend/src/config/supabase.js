const { createClient } = require("@supabase/supabase-js");
const env = require("./env");

// The backend always uses the SERVICE ROLE key. This bypasses Row Level
// Security, which is correct here because every route re-implements its own
// authorization checks (see middleware/auth.js and middleware/adminAuth.js)
// before touching the database. Never expose this key to the frontend.
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

module.exports = supabase;
