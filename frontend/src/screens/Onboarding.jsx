import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { GradCard, PrimaryButton } from "../components/ui";
import { C, font } from "../theme";

const STEPS = [
  {
    tag: 1,
    title: "Turn Your Ideas Into Stunning",
    accent: "AI Videos",
    body: "Create cinematic videos from scripts, images and imagination.",
    grad: ["#3a3a3a", "#0a0a0a"],
  },
  {
    tag: 2,
    title: "Powerful AI Tools in",
    accent: "One Place",
    body: "Generate images, voices and animations. All in one studio.",
    grad: ["#2c2c40", "#0a0a12"],
  },
  {
    tag: 3,
    title: "Save, Share &",
    accent: "Inspire the World",
    body: "Export in high quality and share your stories anywhere.",
    grad: ["#402c2c", "#120a0a"],
  },
];

export default function Onboarding() {
  const { step } = useParams();
  const navigate = useNavigate();
  const idx = Math.max(0, Math.min(STEPS.length - 1, Number(step) - 1));
  const data = STEPS[idx];
  const isLast = idx === STEPS.length - 1;

  function next() {
    if (isLast) navigate("/signin");
    else navigate(`/onboarding/${idx + 2}`);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <GradCard grad={data.grad} style={{ flex: 1, minHeight: 260, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 20 }}>
        <Sparkles size={54} color="rgba(255,255,255,0.25)" />
      </GradCard>
      <div style={{ padding: "22px 4px 8px" }}>
        <div style={{ fontSize: 24, fontWeight: 600, color: C.white, lineHeight: 1.25, ...font }}>
          {data.title} <span style={{ color: C.red }}>{data.accent}</span>
        </div>
        <div style={{ fontSize: 13.5, color: C.gray, marginTop: 10, lineHeight: 1.5, ...font }}>{data.body}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "20px 0" }}>
          {STEPS.map((s, i) => (
            <div key={s.tag} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 3, background: i === idx ? C.red : C.border, transition: "0.2s" }} />
          ))}
        </div>
      </div>
      <div style={{ marginTop: "auto" }}>
        <PrimaryButton onClick={next}>{isLast ? "Get Started" : "Next"}</PrimaryButton>
        {!isLast && (
          <div onClick={() => navigate("/signin")} style={{ textAlign: "center", color: C.gray, fontSize: 13, marginTop: 14, cursor: "pointer", ...font }}>
            Skip
          </div>
        )}
      </div>
    </div>
  );
}
