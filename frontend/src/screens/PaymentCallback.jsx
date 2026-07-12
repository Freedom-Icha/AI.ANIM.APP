import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { C, font } from "../theme";
import api from "../lib/api";

/**
 * Paystack redirects to {callback_url}?reference=xxx&trxref=xxx
 * PayPal redirects to {return_url}?token=ORDER_ID&PayerID=xxx
 * This screen figures out which one just happened, confirms status with the
 * backend (which re-verifies with the provider directly), and forwards on.
 * NOTE: the webhook (server-side) is what actually activates the
 * subscription — this screen is purely a fast UX confirmation.
 */
export default function PaymentCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const reference = params.get("reference") || params.get("trxref");
    const token = params.get("token");

    async function run() {
      try {
        if (reference) {
          const { status: s } = await api.get(`/payments/paystack/verify/${reference}`);
          setStatus(s === "success" ? "success" : "failed");
        } else if (token) {
          const { status: s } = await api.post(`/payments/paypal/capture/${token}`, {});
          setStatus(s === "COMPLETED" ? "success" : "failed");
        } else {
          setStatus("failed");
        }
      } catch (_) {
        setStatus("failed");
      }
    }
    run();
  }, [params]);

  useEffect(() => {
    if (status === "success") {
      const t = setTimeout(() => navigate("/payment/success"), 900);
      return () => clearTimeout(t);
    }
    if (status === "failed") {
      const t = setTimeout(() => navigate("/subscription"), 1500);
      return () => clearTimeout(t);
    }
  }, [status, navigate]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <Loader2 size={26} color={C.red} className="animai-spin" />
      <div style={{ fontSize: 13, color: C.white, marginTop: 16, ...font }}>
        {status === "checking" && "Confirming your payment…"}
        {status === "success" && "Payment confirmed!"}
        {status === "failed" && "We couldn't confirm this payment."}
      </div>
    </div>
  );
}
