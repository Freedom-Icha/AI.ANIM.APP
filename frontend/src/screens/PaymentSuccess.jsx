import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { PrimaryButton } from "../components/ui";
import { C, font } from "../theme";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [sub, setSub] = useState(null);

  useEffect(() => {
    refreshProfile();
    api.get("/subscription/me").then(setSub).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
        <Check size={34} color="#fff" />
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: C.white, ...font }}>Payment Successful!</div>
      <div style={{ fontSize: 12.5, color: C.gray, margin: "8px 0 24px", ...font }}>Thank you! Your subscription is now active.</div>
      {sub && (
        <div style={{ width: "100%", background: C.card, borderRadius: 14, padding: 16, textAlign: "left", marginBottom: 24 }}>
          {[
            ["Plan", sub.planId],
            ["Billing Cycle", sub.billingCycle],
            ["Next Billing", new Date(sub.currentPeriodEnd).toDateString()],
          ].map((row) => (
            <div key={row[0]} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 12.5, ...font }}>
              <div style={{ color: C.gray }}>{row[0]}</div>
              <div style={{ color: C.white, fontWeight: 500, textTransform: "capitalize" }}>{row[1]}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ width: "100%" }}>
        <PrimaryButton onClick={() => navigate("/home")}>Go to Dashboard</PrimaryButton>
      </div>
    </div>
  );
}
