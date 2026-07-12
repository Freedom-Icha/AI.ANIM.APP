const supabase = require("../config/supabase");

/**
 * Verifies the Supabase access token sent by the frontend as:
 *   Authorization: Bearer <supabase_access_token>
 *
 * The frontend obtains this token via supabase.auth signInWithPassword /
 * signInWithOAuth (Google, Facebook) — see frontend/src/lib/supabaseClient.js.
 * We ask Supabase to validate it (rather than decoding it ourselves) so token
 * revocation / expiry is always authoritative.
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Missing Authorization bearer token" });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    const { data: profile, error: profileErr } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileErr || !profile) {
      return res.status(401).json({ error: "User profile not found" });
    }

    if (profile.status === "banned") {
      return res.status(403).json({ error: "This account has been banned" });
    }
    if (profile.status === "suspended") {
      return res.status(403).json({ error: "This account is suspended" });
    }

    req.user = profile;
    req.authUserId = data.user.id;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth };
