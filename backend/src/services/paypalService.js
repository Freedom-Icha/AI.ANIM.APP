const axios = require("axios");
const env = require("../config/env");

const PAYPAL_BASE =
  env.PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

/** Obtains a short-lived OAuth2 access token using client credentials.
 * Docs: https://developer.paypal.com/api/rest/authentication/ */
async function getAccessToken() {
  const auth = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const { data } = await axios.post(
    `${PAYPAL_BASE}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 20_000,
    }
  );
  return data.access_token;
}

/** Creates a PayPal order for one plan purchase.
 * Docs: https://developer.paypal.com/docs/api/orders/v2/#orders_create */
async function createOrder({ amountUSD, planId, billingCycle, userId }) {
  const token = await getAccessToken();
  const { data } = await axios.post(
    `${PAYPAL_BASE}/v2/checkout/orders`,
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: `${planId}_${billingCycle}_${userId}`,
          description: `AnimAI ${planId} plan (${billingCycle})`,
          amount: { currency_code: "USD", value: amountUSD.toFixed(2) },
        },
      ],
      application_context: {
        brand_name: "AnimAI",
        return_url: `${env.FRONTEND_URL}/payment/callback`,
        cancel_url: `${env.FRONTEND_URL}/subscription`,
        user_action: "PAY_NOW",
      },
    },
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, timeout: 20_000 }
  );
  return data; // { id, status, links: [{ rel: 'approve', href }] }
}

/** Captures payment for an approved order.
 * Docs: https://developer.paypal.com/docs/api/orders/v2/#orders_capture */
async function captureOrder(orderId) {
  const token = await getAccessToken();
  const { data } = await axios.post(
    `${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`,
    {},
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, timeout: 20_000 }
  );
  return data; // { status: 'COMPLETED', purchase_units: [...] }
}

/** Verifies an incoming webhook against PayPal's verification endpoint.
 * Docs: https://developer.paypal.com/api/rest/webhooks/rest/#verify-webhook-signature
 * Requires PAYPAL_WEBHOOK_ID to be set once you register the webhook in the
 * PayPal developer dashboard (Applications > your app > Webhooks). */
async function verifyWebhookSignature(headers, body, webhookId) {
  const token = await getAccessToken();
  const { data } = await axios.post(
    `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
    {
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: webhookId,
      webhook_event: body,
    },
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, timeout: 20_000 }
  );
  return data.verification_status === "SUCCESS";
}

module.exports = { getAccessToken, createOrder, captureOrder, verifyWebhookSignature };
