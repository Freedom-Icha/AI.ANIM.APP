import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Plus, FileText, Image as ImageIcon, Mic, Film, Play, ChevronRight } from "lucide-react";
import { GradCard, EmptyState } from "../components/ui";
import { C, font } from "../theme";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

export default function Home() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [projects, setProjects] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get("/projects").then((d) => setProjects(d.projects || [])).catch(() => {});
    api.get("/notifications").then((d) => setUnread((d.notifications || []).filter((n) => !n.read).length)).catch(() => {});
  }, []);

  const quick = [
    { icon: FileText, label: "AI Script", to: "/create/script" },
    { icon: ImageIcon, label: "AI Images", to: "/create/style" },
    { icon: Mic, label: "AI Voice", to: "/create/voice" },
    { icon: Film, label: "AI Animate", to: "/create/settings" },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 2px 20px" }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: C.white, ...font }}>
            Hello, {(profile?.full_name || "there").split(" ")[0]} 👋
          </div>
          <div style={{ fontSize: 12.5, color: C.gray, ...font }}>What will we create today?</div>
        </div>
        <div onClick={() => navigate("/notifications")} style={{ position: "relative", width: 38, height: 38, borderRadius: 12, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Bell size={17} color={C.white} />
          {unread > 0 && <div style={{ position: "absolute", top: 6, right: 7, width: 8, height: 8, borderRadius: "50%", background: C.red, border: `1.5px solid ${C.card}` }} />}
        </div>
      </div>

      <GradCard grad={["#3a1214", "#1a0505"]} onClick={() => navigate("/create")} style={{ padding: 20, marginBottom: 18, cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: C.white, ...font }}>Create New Video</div>
            <div style={{ fontSize: 12, color: "#e0a3a3", marginTop: 4, ...font }}>Start a new project</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: C.red, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Plus size={20} color={C.white} />
          </div>
        </div>
      </GradCard>

      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        {quick.map((q) => (
          <div
            key={q.label} onClick={() => navigate(q.to)}
            style={{ flex: 1, background: C.card, borderRadius: 14, padding: "14px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", border: `1px solid ${C.border}` }}
          >
            <q.icon size={18} color={C.red} />
            <div style={{ fontSize: 10, color: C.gray, textAlign: "center", ...font }}>{q.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: C.white, ...font }}>Recent Projects</div>
        {projects.length > 0 && (
          <div onClick={() => navigate("/projects")} style={{ fontSize: 12, color: C.red, cursor: "pointer", ...font }}>See all</div>
        )}
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {projects.length === 0 ? (
          <EmptyState text='No projects yet. Tap "Create New Video" to make your first one.' />
        ) : (
          projects.slice(0, 3).map((p) => (
            <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 4px", cursor: "pointer" }}>
              <GradCard grad={["#333", "#0a0a0a"]} style={{ width: 56, height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Play size={16} color="rgba(255,255,255,0.8)" />
              </GradCard>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: C.white, ...font }}>{p.title}</div>
                <div style={{ fontSize: 11, color: C.gray, marginTop: 3, ...font }}>
                  {Math.round(p.duration_seconds / 60)} min · {p.resolution} · {new Date(p.created_at).toLocaleDateString()}
                </div>
              </div>
              <ChevronRight size={16} color={C.grayDim} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
