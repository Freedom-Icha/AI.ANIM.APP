import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Play } from "lucide-react";
import { GradCard, EmptyState } from "../components/ui";
import { C, font } from "../theme";
import api from "../lib/api";

const FILTERS = ["All", "Draft", "Completed", "Favorites"];

export default function MyProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const status = filter === "Favorites" ? "Favorites" : filter === "All" ? undefined : filter;
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (query) params.set("search", query);
    api
      .get(`/projects${params.toString() ? `?${params}` : ""}`)
      .then((d) => setProjects(d.projects || []))
      .finally(() => setLoading(false));
  }, [filter, query]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: C.white, marginBottom: 16, ...font }}>My Projects</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px", marginBottom: 14 }}>
        <Search size={15} color={C.grayDim} />
        <input
          value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your projects"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.white, fontSize: 12.5, ...font }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
        {FILTERS.map((f) => (
          <div
            key={f} onClick={() => setFilter(f)}
            style={{ padding: "8px 14px", borderRadius: 18, fontSize: 12, whiteSpace: "nowrap", cursor: "pointer", ...font, background: filter === f ? C.red : C.card, color: C.white, border: `1px solid ${filter === f ? C.red : C.border}` }}
          >
            {f}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {!loading && projects.length === 0 && (
          <EmptyState text="No projects match this view." actionLabel="Create New Video" onAction={() => navigate("/create")} />
        )}
        {projects.map((p) => (
          <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 4px", cursor: "pointer", borderBottom: `1px solid ${C.border}` }}>
            <GradCard grad={["#333", "#0a0a0a"]} style={{ width: 58, height: 58, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Play size={16} color="rgba(255,255,255,0.8)" />
            </GradCard>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: C.white, ...font }}>{p.title}</div>
              <div style={{ fontSize: 11, color: C.gray, marginTop: 3, ...font }}>
                {Math.round(p.duration_seconds / 60)} min · {p.resolution} · {new Date(p.created_at).toLocaleDateString()}
              </div>
            </div>
            <div style={{ fontSize: 10, padding: "4px 9px", borderRadius: 8, textTransform: "capitalize", ...font, background: p.status === "completed" ? "#0f2a17" : "#2a230f", color: p.status === "completed" ? "#4ade80" : "#fbbf24" }}>
              {p.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
