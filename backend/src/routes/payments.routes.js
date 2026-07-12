const express = require("express");
const { v4: uuidv4 } = require("uuid");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");
const { getPlan } = require("../plans");
const paystack = require("../services/paystackService");
const paypal = require("../services/paypalService");

const router = express.Router();
router.use(requireAuth);

/**
 * Nigerian users pay via Paystack in NGN. Since the pricing sheet lists USD,
 * we convert using a fixed NGN_PER_USD rate here — replace with a live FX
 * rate lookup if you need real-time accuracy.
 */
const NGN_PER_USD = Number(process.env.NGN_PER_USD || 1600);

router.post("/paystack/initialize", async (req, res, next) => {
  try {
    const { planId, billingCycle } = req.body;
    const plan = getPlan(planId);
    const amountUSD = billingCycle === "yearly" ? plan.priceYearlyUSD : plan.priceMonthlyUSD;
    const amountNGN = Math.round(amountUSD * NGN_PER_USD);
    const reference = `animai_${uuidv4()}`;

    const { error } = await supabase.from("payments").insert({
      user_id: req.user.id,
      provider: "paystack",
      provider_reference: reference,
      plan_id: plan.id,
      billing_cycle: billingCycle,
      amount: amountNGN,
      currency: "NGN",
      status: "pending",
    });
    if (error) throw error;

    const result = await paystack.initializeTransaction({
      email: req.user.email,
      amountNGN,
      reference,
      metadata: { userId: req.user.id, planId: plan.id, billingCycle },
    });

    res.json({ authorizationUrl: result.authorization_url, reference });
  } catch (err) {
    err.source = "paystack";
    next(err);
  }
});

/** Frontend calls this right after Paystack redirects back, as a fast UX
 * confirmation — the webhook (routes/webhooks.routes.js) remains the
 * authoritative source that actually activates the subscription. */
router.get("/paystack/verify/:reference", async (req, res, next) => {
  try {
    const result = await paystack.verifyTransaction(req.params.reference);
    res.json({ status: result.status });
  } catch (err) {
    err.source = "paystack";
    next(err);
  }
});

router.post("/paypal/create-order", async (req, res, next) => {
  try {
    const { planId, billingCycle } = req.body;
    const plan = getPlan(planId);
    const amountUSD = billingCycle === "yearly" ? plan.priceYearlyUSD : plan.priceMonthlyUSD;

    const order = await paypal.createOrder({
      amountUSD,
      planId: plan.id,
      billingCycle,
      userId: req.user.id,
    });

    await supabase.from("payments").insert({
      user_id: req.user.id,
      provider: "paypal",
      provider_reference: order.id,
      plan_id: plan.id,
      billing_cycle: billingCycle,
      amount: amountUSD,
      currency: "USD",
      status: "pending",
      raw_payload: order,
    });

    const approveLink = order.links?.find((l) => l.rel === "approve")?.href;
    res.json({ orderId: order.id, approveUrl: approveLink });
  } catch (err) {
    err.source = "paypal";
    next(err);
  }
});

/** Frontend calls this after the user approves on PayPal's checkout page. */
router.post("/paypal/capture/:orderId", async (req, res, next) => {
  try {
    const result = await paypal.captureOrder(req.params.orderId);
    res.json({ status: result.status });
  } catch (err) {
    err.source = "paypal";
    next(err);
  }
});

router.get("/history", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ payments: data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
