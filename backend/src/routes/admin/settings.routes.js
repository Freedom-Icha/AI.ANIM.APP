const express = require("express");
const supabase = require("../../config/supabase");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const [settings, plans] = await Promise.all([
      supabase.from("app_settings").select("*").eq("id", 1).single(),
      supabase.from("plans").select("*").order("sort_order"),
    ]);
    res.json({ settings: settings.data, plans: plans.data });
  } catch (err) {
    next(err);
  }
});

router.patch("/", async (req, res, next) => {
  try {
    const { maintenanceMode, maintenanceMessage, features } = req.body;
    const patch = { updated_at: new Date().toISOString() };
    if (maintenanceMode !== undefined) patch.maintenance_mode = maintenanceMode;
    if (maintenanceMessage !== undefined) patch.maintenance_message = maintenanceMessage;
    if (features !== undefined) patch.features = features;

    const { data, error } = await supabase.from("app_settings").update(patch).eq("id", 1).select().single();
    if (error) throw error;

    await supabase.from("admin_logs").insert({ admin_id: req.user.id, action: "update_app_settings", details: patch });
    res.json({ settings: data });
  } catch (err) {
    next(err);
  }
});

/** Edits a plan's price / quota — e.g. changing Standard from $19.99 to
 * $24.99/month without a redeploy. */
router.patch("/plans/:id", async (req, res, next) => {
  try {
    const allowed = [
      "name", "price_monthly_usd", "price_yearly_usd", "video_hours_per_period",
      "ai_chats_per_period", "ai_images_per_period", "voice_minutes_per_period",
      "max_export_resolution", "storage_gb", "watermarked", "priority_support", "is_active",
    ];
    const patch = {};
    for (const key of allowed) if (key in req.body) patch[key] = req.body[key];

    const { data, error } = await supabase.from("plans").update(patch).eq("id", req.params.id).select().single();
    if (error) throw error;

    await supabase.from("admin_logs").insert({
      admin_id: req.user.id,
      action: "update_plan_price",
      target_id: null,
      details: { planId: req.params.id, patch },
    });

    res.json({ plan: data });
  } catch (err) {
    next(err);
  }
});

/** API keys are managed via environment variables (Railway dashboard), not
 * the database, so they're never stored in plaintext in Postgres. This route
 * simply reports which keys are present/missing so the admin UI can show a
 * "connected / not connected" status per provider. */
router.get("/api-keys/status", async (req, res, next) => {
  try {
    const keys = [
      "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "PAYSTACK_SECRET_KEY", "PAYPAL_CLIENT_ID",
      "STABILITY_AI_API_KEY", "FISH_AUDIO_API_KEY", "GEMINI_API_KEY", "FCM_SERVER_KEY",
    ];
    const status = {};
    keys.forEach((k) => {
      status[k] = Boolean(process.env[k]);
    });
    res.json({ status });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
