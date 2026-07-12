import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";
import { TopBar, PrimaryButton } from "../components/ui";
import { C, font } from "../theme";
import { useApp } from "../context/AppContext";

const FAQS = [
  { q: "How do I generate my first video?", a: "Tap Create New Video on the Home screen, enter a script or idea, choose a visual style and voice, then generate." },
  { q: "Can I change my subscription plan?", a: "Yes. Go to Profile > Subscription Plans and choose a new plan anytime. Changes apply on your next billing date." },
  { q: "What happens when I run out of video hours?", a: "Video generation pauses until your plan renews or you upgrade — your images, voice, and chat quotas are tracked separately." },
  { q: "How do I cancel my subscription?", a: "Go to Settings > Account Details > Manage Subscription and select Cancel Plan." },
];

export default function HelpSupport() {
  const navigate = useNavigate();
  const { toast } = useApp();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);

  const shown = FAQS.filter((f) => !query || f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar onBack={() => navigate("/profile")} title="Help & Support" />
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
        <Search size={16} color={C.gray} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help articles..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.white, fontSize: 12.5, ...font }} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 12, ...font }}>Frequently Asked Questions</div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {shown.map((f) => (
          <div key={f.q} style={{ borderBottom: `1px solid ${C.border}`, padding: "12px 2px", cursor: "pointer" }} onClick={() => setOpen(open === f.q ? null : f.q)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, color: C.white, fontWeight: 500, paddingRight: 10, ...font }}>{f.q}</div>
              <ChevronRight size={14} color={C.grayDim} style={{ transform: open === f.q ? "rotate(90deg)" : "none", flexShrink: 0 }} />
            </div>
            {open === f.q && <div style={{ fontSize: 12, color: C.gray, marginTop: 8, lineHeight: 1.6, ...font }}>{f.a}</div>}
          </div>
        ))}
      </div>
      <PrimaryButton onClick={() => toast("Email hello@animai.app for direct support")} style={{ marginTop: 16 }}>Contact Support</PrimaryButton>
    </div>
  );
}
