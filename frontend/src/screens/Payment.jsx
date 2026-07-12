import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CreditCard, Shield } from "lucide-react";
import { TopBar, PrimaryButton } from "../components/ui";
import { C, font } from "../theme";
import { useApp } from "../context/AppContext";
import api from "../lib/api";

export default function Payment() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useApp();
  const planId = params.get("plan");
  const cycle = params.get("cycle") || "yearly";
  const [method, setMethod] = useState("paystack");
  const [busy, setBusy] = useState(false);

  async function handlePay() {
    setBusy(true);
    try {
      if (method === "paystack") {
        const { authorizationUrl } = await api.post("/payments/paystack/initialize", { planId, billingCycle: cycle });
        window.location.href = authorizationUrl;
      } else {
        const { approveUrl } = await api.post("/payments/paypal/create-order", { planId, billingCycle: cycle });
        window.location.href = approveUrl;
      }
    } catch (err) {
      toast(err.message || "Payment could not be started");
      setBusy(false);
    }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar onBack={() => navigate("/subscription")} title="Payment Method" />
      <div style={{ fontSize: 12.5, color: C.gray, marginBottom: 20, ...font }}>Choose a secure payment option</div>

      {[
        { id: "paystack", name: "Paystack (Nigeria)", body: "Pay with cards, bank transfer, USSD and more" },
        { id: "paypal", name: "PayPal (International)", body: "Pay securely with PayPal" },
      ].map((m) => (
        <div
          key={m.id} onClick={() => setMethod(m.id)}
          style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, marginBottom: 12, cursor: "pointer", background: C.card, border: `1px solid ${method === m.id ? C.red : C.border}` }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 10, background: C.card2, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CreditCard size={18} color={C.red} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, color: C.white, fontWeight: 500, ...font }}>{m.name}</div>
            <div style={{ fontSize: 11, color: C.gray, marginTop: 2, ...font }}>{m.body}</div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: "auto" }}>
        <PrimaryButton disabled={busy} onClick={handlePay}>{busy ? "Redirecting…" : "Continue to Pay"}</PrimaryButton>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 }}>
          <Shield size={12} color={C.grayDim} />
          <div style={{ fontSize: 10.5, color: C.grayDim, ...font }}>Secured by 256-bit SSL encryption</div>
        </div>
      </div>
    </div>
  );
}
