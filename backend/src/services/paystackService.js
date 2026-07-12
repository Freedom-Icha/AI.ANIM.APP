const axios = require("axios");
const crypto = require("crypto");
const env = require("../config/env");

const PAYSTACK_BASE = "https://api.paystack.co";

function client() {
  return axios.create({
    baseURL: PAYSTACK_BASE,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 20_000,
  });
}

/**
 * Starts a Paystack transaction. amountNGN is in whole Naira; Paystack's API
 * expects the amount in kobo (x100). Returns the authorization_url the
 * frontend should redirect the user to.
 * Docs: https://paystack.com/docs/payments/accept-payments/
 */
async function initializeTransaction({ email, amountNGN, reference, metadata }) {
  const { data } = await client().post("/transaction/initialize", {
    email,
    amount: Math.round(amountNGN * 100),
    reference,
    currency: "NGN",
    metadata,
    callback_url: `${env.FRONTEND_URL}/payment/callback`,
  });
  return data.data; // { authorization_url, access_code, reference }
}

/** Confirms a transaction's final status directly with Paystack (used both
 * right after redirect-back, and as a safety double-check inside the webhook
 * handler — never trust client-reported success alone). */
async function verifyTransaction(reference) {
  const { data } = await client().get(`/transaction/verify/${encodeURIComponent(reference)}`);
  return data.data; // { status: 'success' | 'failed' | ..., amount, currency, customer, metadata }
}

/** Validates the `x-paystack-signature` header on incoming webhooks using
 * HMAC-SHA512 of the raw request body with your secret key, per Paystack's
 * webhook security docs. Requires the raw body — see routes/webhooks.routes.js
 * which mounts this route with express.raw() instead of express.json(). */
function verifyWebhookSignature(rawBody, signatureHeader) {
  const hash = crypto
    .createHmac("sha512", env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");
  return hash === signatureHeader;
}

module.exports = { initializeTransaction, verifyTransaction, verifyWebhookSignature };
