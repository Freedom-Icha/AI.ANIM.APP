const express = require("express");
const supabase = require("../../config/supabase");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const [free, premium, expired, { data: recentPayments }] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }).eq("plan_id", "free_trial"),
      supabase.from("users").select("id", { count: "exact", head: true }).in("plan_id", ["basic", "standard", "pro"]).eq("subscription_status", "active"),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("subscription_status", "expired"),
      supabase.from("payments").select("*").eq("status", "success").order("created_at", { ascending: false }).limit(20),
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: renewals } = await supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "success")
      .gte("created_at", thirtyDaysAgo.toISOString());

    res.json({
      freeUsers: free.count || 0,
      premiumUsers: premium.count || 0,
      expiredSubscriptions: expired.count || 0,
      renewalsLast30Days: renewals || 0,
      recentPayments,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/by-plan", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("users").select("plan_id");
    if (error) throw error;
    const counts = {};
    (data || []).forEach((u) => {
      counts[u.plan_id] = (counts[u.plan_id] || 0) + 1;
    });
    res.json({ counts });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
