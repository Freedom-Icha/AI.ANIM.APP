const express = require("express");
const supabase = require("../config/supabase");
const paystack = require("../services/paystackService");
const paypal = require("../services/paypalService");
const { activateSubscription } = require("../services/subscriptionService");

const router = express.Router();

/**
 * Paystack webhook. Mounted with express.raw() (see server.js) because the
 * HMAC signature must be computed over the exact raw request bytes — parsing
 * it as JSON first and re-stringifying would produce a different signature.
 * Docs: https://paystack.com/docs/payments/webhooks/
 */
router.post(
  "/paystack",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.headers["x-paystack-signature"];
      const valid = paystack.verifyWebhookSignature(req.body, signature);
      if (!valid) return res.status(401).send("Invalid signature");

      const event = JSON.parse(req.body.toString("utf8"));

      if (event.event === "charge.success") {
        const { reference, metadata } = event.data;

        // Always re-verify directly with Paystack rather than trusting the
        // webhook payload's status field alone — belt and braces.
        const verified = await paystack.verifyTransaction(reference);
        if (verified.status !== "success") {
          return res.status(200).send("ignored: not successful on verify");
        }

        await supabase
          .from("payments")
          .update({ status: "success", raw_payload: event })
          .eq("provider_reference", reference);

        await activateSubscription({
          userId: metadata.userId,
          planId: metadata.planId,
          billingCycle: metadata.billingCycle,
        });
      }

      res.status(200).send("ok");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[webhook:paystack]", err);
      await supabase.from("error_logs").insert({ source: "paystack", message: err.message, stack: err.stack });
      res.status(500).send("error");
    }
  }
);

/**
 * PayPal webhook. Requires PAYPAL_WEBHOOK_ID (from PayPal Developer Dashboard
 * > your app > Webhooks, after registering this URL: POST /api/webhooks/paypal).
 * Docs: https://developer.paypal.com/api/rest/webhooks/
 */
router.post(
  "/paypal",
  express.json({ type: "application/json" }),
  async (req, res) => {
    try {
      const webhookId = process.env.PAYPAL_WEBHOOK_ID;
      if (webhookId) {
        const valid = await paypal.verifyWebhookSignature(req.headers, req.body, webhookId);
        if (!valid) return res.status(401).send("Invalid signature");
      }

      const event = req.body;

      if (event.event_type === "PAYMENT.CAPTURE.COMPLETED" || event.event_type === "CHECKOUT.ORDER.APPROVED") {
        const referenceId = event.resource?.purchase_units?.[0]?.reference_id || "";
        const [planId, billingCycle, userId] = referenceId.split("_");
        const orderId = event.resource?.supplementary_data?.related_ids?.order_id || event.resource?.id;

        if (userId) {
          await supabase
            .from("payments")
            .update({ status: "success", raw_payload: event })
            .eq("provider_reference", orderId);

          await activateSubscription({ userId, planId, billingCycle });
        }
      }

      res.status(200).send("ok");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[webhook:paypal]", err);
      await supabase.from("error_logs").insert({ source: "paypal", message: err.message, stack: err.stack });
      res.status(500).send("error");
    }
  }
);

module.exports = router;
