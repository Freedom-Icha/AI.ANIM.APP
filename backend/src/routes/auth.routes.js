const express = require("express");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * Google and Facebook sign-in happen client-side via Supabase Auth
 * (supabase.auth.signInWithOAuth) — see frontend/src/lib/supabaseClient.js.
 * Supabase handles the OAuth redirect dance and issues a session directly to
 * the browser. This endpoint is what the frontend calls immediately after
 * ANY successful Supabase Auth session (email, Google, or Facebook) to make
 * sure a matching row exists in public.users, since auth.users alone doesn't
 * carry plan/quota/role fields.
 */
router.post("/sync-profile", requireAuth, async (req, res, next) => {
  try {
    // requireAuth already fetched (or 401'd on) the profile — if we got here,
    // it already exists. This route mainly matters on a user's very first
    // request right after signup, before a profile row has been created; see
    // the Postgres trigger below for the recommended alternative approach.
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
});

/**
 * Fallback profile bootstrap for first-time sign-ins where the DB trigger
 * (recommended: a Postgres trigger on auth.users insert that also inserts
 * into public.users — see database/schema.sql comments) hasn't been wired
 * up yet. Frontend calls this once, right after signUp/OAuth callback if
 * GET /me returns 401 "profile not found".
 */
router.post("/bootstrap-profile", async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing bearer token" });

    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authData?.user) return res.status(401).json({ error: "Invalid session" });

    const authUser = authData.user;
    const provider = authUser.app_metadata?.provider || "email";
    const fullName =
      authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split("@")[0];

    const { data: existing } = await supabase.from("users").select("id").eq("id", authUser.id).maybeSingle();
    if (existing) return res.json({ created: false });

    const now = new Date();
    const trialEnds = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    const { error: insertErr } = await supabase.from("users").insert({
      id: authUser.id,
      email: authUser.email,
      full_name: fullName,
      avatar_url: authUser.user_metadata?.avatar_url || null,
      auth_provider: provider,
      plan_id: "free_trial",
      subscription_status: "trialing",
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEnds.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: trialEnds.toISOString(),
    });
    if (insertErr) throw insertErr;

    await supabase.from("notifications").insert({
      user_id: authUser.id,
      title: "Welcome to AnimAI",
      body: "Your 4-day free trial has started. Create your first AI video now!",
      type: "success",
    });

    await supabase.from("login_history").insert({
      user_id: authUser.id,
      provider,
      device: req.headers["user-agent"] || null,
      ip_address: req.ip,
    });

    res.json({ created: true });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post("/logout-log", requireAuth, async (req, res, next) => {
  try {
    await supabase.from("login_history").insert({
      user_id: req.user.id,
      provider: "logout",
      device: req.headers["user-agent"] || null,
      ip_address: req.ip,
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
