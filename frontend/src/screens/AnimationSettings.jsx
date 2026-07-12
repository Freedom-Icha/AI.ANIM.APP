import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Sparkles, ChevronRight } from "lucide-react";
import { TopBar, Stepper, GradCard, PrimaryButton } from "../components/ui";
import { C, font } from "../theme";
import { useDraft } from "../context/DraftContext";

const DURATIONS = ["1 min", "2 min", "5 min"];
const RESOLUTIONS = ["720p", "1080p", "4K"];
const FORMATS = ["MP4", "MOV"];

export default function AnimationSettings() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useDraft();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar onBack={() => navigate("/create/voice")} title="Preview & Generate" />
      <Stepper steps={["Script", "Style", "Voice", "Preview"]} active={3} />
      <GradCard grad={["#333", "#0a0a0a"]} style={{ height: 170, marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Play size={20} color="#fff" />
        </div>
      </GradCard>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.white, marginBottom: 14, ...font }}>Video Settings</div>
      <SettingRow label="Duration" value={draft.duration} options={DURATIONS} onSelect={(v) => updateDraft({ duration: v })} />
      <SettingRow label="Resolution" value={draft.resolution} options={RESOLUTIONS} onSelect={(v) => updateDraft({ resolution: v })} />
      <SettingRow label="Format" value={draft.format} options={FORMATS} onSelect={(v) => updateDraft({ format: v })} />
      <div style={{ fontSize: 11, color: C.grayDim, margin: "12px 0 20px", ...font }}>
        Your plan's export cap may automatically reduce resolution — see Subscription Plans.
      </div>
      <PrimaryButton onClick={() => navigate("/create/video-progress")}>
        <Sparkles size={16} style={{ marginRight: 6 }} /> Generate Video
      </PrimaryButton>
    </div>
  );
}

function SettingRow({ label, value, options, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}
      >
        <div style={{ fontSize: 12.5, color: C.gray, ...font }}>{label}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: C.white, ...font }}>
          {value}
          <ChevronRight size={13} style={{ transform: open ? "rotate(90deg)" : "none" }} />
        </div>
      </div>
      {open && (
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {options.map((o) => (
            <div
              key={o} onClick={() => { onSelect(o); setOpen(false); }}
              style={{ padding: "7px 12px", borderRadius: 8, fontSize: 11.5, cursor: "pointer", ...font, background: value === o ? C.red : C.card2, color: C.white }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
