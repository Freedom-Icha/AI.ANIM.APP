import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar, Stepper, GradCard, PrimaryButton } from "../components/ui";
import { C, font } from "../theme";
import { useDraft } from "../context/DraftContext";
import { useApp } from "../context/AppContext";
import api from "../lib/api";

const STYLES = [
  { id: "3d", name: "3D Animation", grad: ["#2b3a67", "#0f1424"] },
  { id: "cartoon", name: "Cartoon", grad: ["#7a3b3b", "#2a1414"] },
  { id: "realistic", name: "Realistic", grad: ["#3b3b3b", "#141414"] },
  { id: "anime", name: "Anime", grad: ["#6b2b57", "#22101c"] },
  { id: "cinematic", name: "Cinematic", grad: ["#333", "#111"] },
  { id: "watercolor", name: "Watercolor", grad: ["#2b5b5b", "#0e1f1f"] },
];

export default function ImageGeneration() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useDraft();
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);

  async function handleNext() {
    setBusy(true);
    try {
      let projectId = draft.projectId;
      if (!projectId) {
        const { project } = await api.post("/projects", {
          title: draft.title, script: draft.script, genre: draft.genre, style: draft.style,
        });
        projectId = project.id;
        updateDraft({ projectId });
      } else {
        await api.patch(`/projects/${projectId}`, { style: draft.style });
      }

      const { images } = await api.post("/image/generate-scenes", {
        script: draft.script, style: draft.style, projectId,
      });
      updateDraft({ imageUrls: images.map((i) => i.url) });
      navigate("/create/voice");
    } catch (err) {
      toast(err.message || "Image generation failed — check your Stability AI key");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar onBack={() => navigate("/create/script")} title="Choose Video Style" />
      <Stepper steps={["Script", "Style", "Voice", "Preview"]} active={1} />
      <div style={{ fontSize: 13, color: C.gray, marginBottom: 12, ...font }}>Select a visual style</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {STYLES.map((s) => (
          <div key={s.id} onClick={() => updateDraft({ style: s.id })} style={{ cursor: "pointer" }}>
            <GradCard grad={s.grad} style={{ height: 76, border: draft.style === s.id ? `2px solid ${C.red}` : `1px solid ${C.border}` }} />
            <div style={{ fontSize: 11, color: C.gray, textAlign: "center", marginTop: 6, ...font }}>{s.name}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto" }}>
        <PrimaryButton disabled={!draft.style || busy} onClick={handleNext}>
          {busy ? "Generating scene images…" : "Next"}
        </PrimaryButton>
      </div>
    </div>
  );
}
