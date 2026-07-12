import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar, Stepper, PrimaryButton } from "../components/ui";
import { C, font } from "../theme";
import { useDraft } from "../context/DraftContext";
import { useApp } from "../context/AppContext";
import api from "../lib/api";

const GENRES = ["Story", "Motivational", "Educational", "Others"];

export default function ScriptInput() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useDraft();
  const { toast } = useApp();
  const [writing, setWriting] = useState(false);

  async function handleAIWrite(genre) {
    updateDraft({ genre });
    if (draft.script && draft.script.trim()) return; // don't clobber existing text
    setWriting(true);
    try {
      const { script } = await api.post("/script/write", { genre });
      updateDraft({ script, genre });
      toast(`AI wrote a ${genre.toLowerCase()} starter for you`);
    } catch (err) {
      toast(err.message || "Couldn't reach the AI writer — check your Gemini API key");
    } finally {
      setWriting(false);
    }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar onBack={() => navigate("/create")} title="Create New Video" />
      <Stepper steps={["Script", "Style", "Voice", "Preview"]} active={0} />

      <div style={{ fontSize: 13, color: C.gray, marginBottom: 10, ...font }}>Project title</div>
      <input
        value={draft.title}
        onChange={(e) => updateDraft({ title: e.target.value.slice(0, 60) })}
        placeholder="e.g. The Brave Little Fish"
        style={{ width: "100%", boxSizing: "border-box", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", color: C.white, fontSize: 13.5, outline: "none", marginBottom: 18, ...font }}
      />

      <div style={{ fontSize: 13, color: C.gray, marginBottom: 10, ...font }}>Enter your script or idea</div>
      <textarea
        value={draft.script}
        onChange={(e) => updateDraft({ script: e.target.value.slice(0, 5000) })}
        placeholder="Once upon a time, in a small village, surrounded by hills, there lived a young girl who dreamed of adventures beyond the horizon…"
        style={{ width: "100%", boxSizing: "border-box", minHeight: 150, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, color: C.white, fontSize: 13.5, resize: "none", outline: "none", lineHeight: 1.6, ...font }}
      />
      <div style={{ textAlign: "right", fontSize: 10.5, color: C.grayDim, margin: "6px 0 20px", ...font }}>{draft.script.length}/5000</div>

      <div style={{ fontSize: 12.5, color: C.gray, marginBottom: 10, ...font }}>Or choose AI to write for you</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
        {GENRES.map((c) => (
          <div
            key={c} onClick={() => handleAIWrite(c)}
            style={{
              padding: "9px 16px", borderRadius: 20, fontSize: 12.5, cursor: "pointer", ...font,
              background: draft.genre === c ? C.red : C.card, color: C.white, border: `1px solid ${draft.genre === c ? C.red : C.border}`,
            }}
          >
            {writing && draft.genre === c ? "Writing…" : c}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "auto" }}>
        <PrimaryButton disabled={!draft.script} onClick={() => navigate("/create/style")}>Next</PrimaryButton>
      </div>
    </div>
  );
}
