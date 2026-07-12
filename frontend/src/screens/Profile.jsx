import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Settings as SettingsIcon, Bell, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { C, font } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import api from "../lib/api";

export default function Profile() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { openConfirm, toast } = useApp();
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    api.get("/subscription/me").then(setUsage).catch(() => {});
  }, []);

  const items = [
    { icon: CreditCard, label: "Subscription Plans", to: "/subscription" },
    { icon: SettingsIcon, label: "Settings", to: "/settings" },
    { icon: Bell, label: "Notifications", to: "/notifications" },
    { icon: HelpCircle, label: "Help & Support", to: "/help" },
  ];

  function handleLogout() {
    openConfirm({
      title: "Log out?",
      message: "You can sign back in anytime with the same account.",
      confirmLabel: "Log Out", danger: true,
      onConfirm: async () => {
        await signOut();
        navigate("/signin");
        toast("Signed out");
      },
    });
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: C.white, marginBottom: 20, ...font }}>Profile</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 26 }}>
        <div style={{ width: 74, height: 74, borderRadius: "50%", background: `linear-gradient(135deg, ${C.red}, #5c0d0d)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: "#fff", ...font }}>
          {(profile?.full_name || "?")[0]}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.white, marginTop: 12, ...font }}>{profile?.full_name}</div>
        <div style={{ fontSize: 12, color: C.gray, marginTop: 2, ...font }}>{profile?.email}</div>
        <div onClick={() => navigate("/subscription")} style={{ marginTop: 10, fontSize: 11, color: C.red, background: "#2a0d0d", padding: "4px 12px", borderRadius: 10, cursor: "pointer", textTransform: "capitalize", ...font }}>
          {profile?.plan_id?.replace("_", " ")} Plan
        </div>
      </div>

      {usage && (
        <div style={{ background: C.card, borderRadius: 14, padding: 16, marginBottom: 22 }}>
          <div style={{ fontSize: 11.5, color: C.gray, marginBottom: 10, ...font }}>This billing period</div>
          <UsageRow label="Video" used={usage.usage.used.video_seconds} limit={usage.usage.limits.video_seconds} unit="s" />
          <UsageRow label="AI Chats" used={usage.usage.used.ai_chat} limit={usage.usage.limits.ai_chat} unit="" />
          <UsageRow label="Images" used={usage.usage.used.ai_image} limit={usage.usage.limits.ai_image} unit="" />
          <UsageRow label="Voice" used={usage.usage.used.voice_seconds} limit={usage.usage.limits.voice_seconds} unit="s" />
        </div>
      )}

      {items.map((it) => (
        <div key={it.label} onClick={() => navigate(it.to)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 4px", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
          <it.icon size={17} color={C.red} />
          <div style={{ flex: 1, fontSize: 13.5, color: C.white, ...font }}>{it.label}</div>
          <ChevronRight size={15} color={C.grayDim} />
        </div>
      ))}

      <div onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 4px", cursor: "pointer", marginTop: 10 }}>
        <LogOut size={17} color={C.gray} />
        <div style={{ fontSize: 13.5, color: C.gray, ...font }}>Log Out</div>
      </div>
    </div>
  );
}

function UsageRow({ label, used, limit }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: C.white, marginBottom: 4, ...font }}>
        <span>{label}</span>
        <span style={{ color: C.gray }}>{Math.round(used)} / {Math.round(limit)}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: C.card2 }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: pct > 90 ? "#fbbf24" : C.red }} />
      </div>
    </div>
  );
}
