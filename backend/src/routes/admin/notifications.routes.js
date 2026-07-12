const express = require("express");
const supabase = require("../../config/supabase");
const env = require("../../config/env");
const axios = require("axios");

const router = express.Router();

/** Sends an in-app broadcast (user_id = null means "visible to everyone" —
 * see notifications RLS policy in database/policies.sql). */
router.post("/broadcast", async (req, res, next) => {
  try {
    const { title, body, type = "info" } = req.body;
    const { data, error } = await supabase
      .from("notifications")
      .insert({ user_id: null, title, body, type })
      .select()
      .single();
    if (error) throw error;

    await supabase.from("admin_logs").insert({
      admin_id: req.user.id,
      action: "broadcast_notification",
      details: { title },
    });

    res.status(201).json({ notification: data });
  } catch (err) {
    next(err);
  }
});

/**
 * Sends a real push notification via Firebase Cloud Messaging to all
 * registered device tokens. Requires FCM_SERVER_KEY in .env and a
 * `device_tokens` table (userId, token, platform) populated by the frontend
 * on login (see frontend/src/lib/push.js for the registration snippet).
 * Docs: https://firebase.google.com/docs/cloud-messaging/send-message
 */
router.post("/push", async (req, res, next) => {
  try {
    if (!env.FCM_SERVER_KEY) {
      return res.status(400).json({ error: "FCM_SERVER_KEY is not configured" });
    }
    const { title, body } = req.body;

    const { data: tokens } = await supabase.from("device_tokens").select("token");
    const tokenList = (tokens || []).map((t) => t.token);
    if (!tokenList.length) {
      return res.json({ sent: 0, message: "No registered device tokens yet" });
    }

    await axios.post(
      "https://fcm.googleapis.com/fcm/send",
      { registration_ids: tokenList, notification: { title, body } },
      { headers: { Authorization: `key=${env.FCM_SERVER_KEY}`, "Content-Type": "application/json" } }
    );

    res.json({ sent: tokenList.length });
  } catch (err) {
    err.source = "fcm";
    next(err);
  }
});

router.get("/history", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .is("user_id", null)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json({ broadcasts: data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
