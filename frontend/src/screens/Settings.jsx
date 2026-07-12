import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Globe, Moon, Shield, ChevronRight } from "lucide-react";
import { TopBar } from "../components/ui";
import { C, font } from "../theme";
import { useApp } from "../context/AppContext";

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useApp();
  const [toggles, setToggles] = useState({ push: true, email: false });

  const links = [
    { icon: User, label: "Account Details" },
    { icon: Globe, label: "Language", val: "English" },
    { icon: Moon, label: "Appearance", val: "Dark" },
    { icon: Shield, label: "Privacy & Security" },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar onBack={() => navigate("/profile")} title="Settings" />
      <div style={{ fontSize: 12, color: C.gray, margin: "4px 0 10px", ...font }}>Preferences</div>
      {[
        { key: "push", label: "Push Notifications" },
        { key: "email", label: "Email Updates" },
      ].map((r) => (
        <div key={r.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px" }}>
          <div style={{ fontSize: 13.5, color: C.white, ...font }}>{r.label}</div>
          <ToggleSwitch
            on={toggles[r.key]}
            onClick={() => { setToggles((t) => ({ ...t, [r.key]: !t[r.key] })); toast("Preference saved"); }}
          />
        </div>
      ))}
      <div style={{ fontSize: 12, color: C.gray, margin: "18px 0 10px", ...font }}>General</div>
      {links.map((l) => (
        <div key={l.label} onClick={() => toast(`${l.label} isn't available in this build yet`)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 4px", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
          <l.icon size={16} color={C.red} />
          <div style={{ flex: 1, fontSize: 13.5, color: C.white, ...font }}>{l.label}</div>
          {l.val && <div style={{ fontSize: 12, color: C.gray, ...font }}>{l.val}</div>}
          <ChevronRight size={15} color={C.grayDim} />
        </div>
      ))}
    </div>
  );
}

function ToggleSwitch({ on, onClick }) {
  return (
    <div onClick={onClick} style={{ width: 42, height: 24, borderRadius: 12, background: on ? C.red : C.border, position: "relative", cursor: "pointer" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: on ? 21 : 3, transition: "0.2s" }} />
    </div>
  );
}
