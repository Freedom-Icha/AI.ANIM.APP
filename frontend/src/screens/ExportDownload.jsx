import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Download, Share2, Check } from "lucide-react";
import { TopBar, PrimaryButton } from "../components/ui";
import { C, font } from "../theme";
import api from "../lib/api";

export default function ExportDownload() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    api.get(`/projects/${id}`).then((d) => setProject(d.project));
  }, [id]);

  if (!project) return <div style={{ color: C.gray, textAlign: "center", marginTop: 60, ...font }}>Loading…</div>;

  function handleDownload() {
    if (!project.video_url) return;
    const a = document.createElement("a");
    a.href = project.video_url;
    a.download = `${project.title.replace(/[^a-z0-9]+/gi, "-")}.mp4`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloaded(true);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar onBack={() => navigate(`/projects/${id}`)} title="Export Video" />
      {!downloaded ? (
        <>
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 18, ...font }}>
            Your finished export for "{project.title}" — {project.resolution}, {project.format}.
          </div>
          <div style={{ display: "flex", gap: 10, background: C.card, borderRadius: 12, padding: 14, marginBottom: 20 }}>
            <Share2 size={16} color={C.red} />
            <div style={{ fontSize: 11.5, color: C.gray, ...font }}>
              Share directly to Instagram, TikTok, or YouTube once downloaded.
            </div>
          </div>
          <div style={{ marginTop: "auto" }}>
            <PrimaryButton disabled={!project.video_url} onClick={handleDownload}>
              <Download size={16} style={{ marginRight: 6 }} /> Download Video
            </PrimaryButton>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ width: 76, height: 76, borderRadius: "50%", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Check size={32} color="#fff" />
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: C.white, ...font }}>Download Started</div>
          <div style={{ fontSize: 12.5, color: C.gray, marginTop: 8, ...font }}>{project.title} saved to your device.</div>
          <div style={{ width: "100%", marginTop: 30 }}>
            <PrimaryButton onClick={() => navigate("/home")}>Back to Home</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
