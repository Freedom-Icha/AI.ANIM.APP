import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Film, Volume2, Sparkles } from "lucide-react";
import { TopBar, EmptyState } from "../components/ui";
import { C, font } from "../theme";
import api from "../lib/api";

function iconFor(title = "") {
  const t = title.toLowerCase();
  if (t.includes("payment")) return CreditCard;
  if (t.includes("video")) return Film;
  if (t.includes("voice")) return Volume2;
  return Sparkles;
}
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get("/notifications").then((d) => setNotifications(d.notifications || []));
  }, []);

  async function markRead(n) {
    setNotifications((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    if (!n.read) api.patch(`/notifications/${n.id}/read`, {}).catch(() => {});
  }
  async function markAllRead() {
    setNotifications((list) => list.map((x) => ({ ...x, read: true })));
    api.patch("/notifications/mark-all-read", {}).catch(() => {});
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar
        onBack={() => navigate("/home")} title="Notifications"
        right={notifications.some((n) => !n.read) ? <div onClick={markAllRead} style={{ fontSize: 10, color: C.red, cursor: "pointer", ...font }}>Mark all</div> : null}
      />
      {notifications.length === 0 && <EmptyState text="No notifications yet." />}
      {notifications.map((n) => {
        const Icon = iconFor(n.title);
        return (
          <div key={n.id} onClick={() => markRead(n)} style={{ display: "flex", gap: 12, padding: "12px 4px", borderBottom: `1px solid ${C.border}`, background: n.read ? "transparent" : "#160a0a", borderRadius: 10, cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={16} color={C.red} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.white, ...font }}>{n.title}</div>
              <div style={{ fontSize: 11.5, color: C.gray, marginTop: 2, ...font }}>{n.body}</div>
              <div style={{ fontSize: 10, color: C.grayDim, marginTop: 4, ...font }}>{timeAgo(n.created_at)}</div>
            </div>
            {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.red, marginTop: 4, flexShrink: 0 }} />}
          </div>
        );
      })}
    </div>
  );
}
