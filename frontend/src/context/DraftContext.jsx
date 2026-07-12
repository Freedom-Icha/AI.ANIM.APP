import React, { createContext, useContext, useState } from "react";

const DraftContext = createContext(null);

const EMPTY_DRAFT = {
  projectId: null,
  title: "",
  script: "",
  genre: null,
  style: null,
  voiceId: null,
  duration: "2 min",
  resolution: "1080p",
  format: "MP4",
  imageUrls: [],
  audioUrl: null,
  estimatedSeconds: 0,
};

export function DraftProvider({ children }) {
  const [draft, setDraft] = useState(() => {
    try {
      const saved = sessionStorage.getItem("animai_draft");
      return saved ? JSON.parse(saved) : { ...EMPTY_DRAFT };
    } catch (_) {
      return { ...EMPTY_DRAFT };
    }
  });

  function updateDraft(patch) {
    setDraft((d) => {
      const next = typeof patch === "function" ? patch(d) : { ...d, ...patch };
      try {
        sessionStorage.setItem("animai_draft", JSON.stringify(next));
      } catch (_) {
        /* ignore quota errors */
      }
      return next;
    });
  }

  function resetDraft() {
    updateDraft({ ...EMPTY_DRAFT });
  }

  return <DraftContext.Provider value={{ draft, updateDraft, resetDraft }}>{children}</DraftContext.Provider>;
}

export function useDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft must be used within DraftProvider");
  return ctx;
}
