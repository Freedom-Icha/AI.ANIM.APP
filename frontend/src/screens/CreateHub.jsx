import React from "react";
import { useNavigate } from "react-router-dom";
import { Wand2, LayoutTemplate, FileText, ChevronRight } from "lucide-react";
import { TopBar } from "../components/ui";
import { C, font } from "../theme";
import { useDraft } from "../context/DraftContext";

export default function CreateHub() {
  const navigate = useNavigate();
  const { resetDraft } = useDraft();

  const opts = [
    { icon: Wand2, title: "Start from Script", body: "Write or paste your story idea", to: "/create/script" },
    { icon: LayoutTemplate, title: "Use a Template", body: "Pick a ready-made story format", to: "/templates" },
    { icon: FileText, title: "Start Blank", body: "Build your project step by step", to: "/create/script" },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar onBack={() => navigate("/home")} title="Create New Video" />
      <div style={{ fontSize: 12.5, color: C.gray, marginBottom: 18, ...font }}>Choose how you'd like to begin your project.</div>
      {opts.map((o, i) => (
        <div
          key={i}
          onClick={() => { resetDraft(); navigate(o.to); }}
          style={{ display: "flex", gap: 14, alignItems: "center", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 12, cursor: "pointer" }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#2a0d0d", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <o.icon size={19} color={C.red} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.white, ...font }}>{o.title}</div>
            <div style={{ fontSize: 11.5, color: C.gray, marginTop: 2, ...font }}>{o.body}</div>
          </div>
          <ChevronRight size={16} color={C.grayDim} />
        </div>
      ))}
    </div>
  );
}
