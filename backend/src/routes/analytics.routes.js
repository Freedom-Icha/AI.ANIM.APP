const express = require("express");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * Lightweight client-side event logging (device type, session length,
 * country) that the frontend calls on app open / app close — see
 * frontend/src/lib/analytics.js. Kept separate from usage_logs (which is
 * billable AI usage) since these are pure engagement analytics, and feeds
 * the admin dashboard's Analytics page (device types, session duration).
 */
router.post("/event", requireAuth, async (req, res, next) => {
  try {
    const { deviceType, sessionSeconds, country } = req.body;
    await supabase.from("admin_logs").insert({
      admin_id: null,
      action: "client_analytics_event",
      target_id: req.user.id,
      details: { deviceType, sessionSeconds, country },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
