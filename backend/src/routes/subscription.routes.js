const express = require("express");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");
const { getUsageSummary } = require("../middleware/quota");
const { PLANS } = require("../plans");

const router = express.Router();

/** Public — powers the Subscription Plans screen before/after login. */
router.get("/plans", async (req, res, next) => {
  try {
    const { data } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    res.json({ plans: data && data.length ? data : Object.values(PLANS) });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const summary = await getUsageSummary(req.user);
    res.json({
      planId: req.user.plan_id,
      subscriptionStatus: req.user.subscription_status,
      billingCycle: req.user.billing_cycle,
      currentPeriodEnd: req.user.current_period_end,
      usage: summary,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
