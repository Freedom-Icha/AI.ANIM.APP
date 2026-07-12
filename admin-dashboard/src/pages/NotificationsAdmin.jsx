import React, { useEffect, useState } from "react";
import { Send, Radio } from "lucide-react";
import adminApi from "../lib/api";

export default function NotificationsAdmin() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("info");
  const [history, setHistory] = useState([]);
  const [pushStatus, setPushStatus] = useState(null);

  function loadHistory() {
    adminApi.get("/notifications/history").then((d) => setHistory(d.broadcasts || []));
  }
  useEffect(loadHistory, []);

  async function sendBroadcast(e) {
    e.preventDefault();
    await adminApi.post("/notifications/broadcast", { title, body, type });
    setTitle("");
    setBody("");
    loadHistory();
  }

  async function sendPush() {
    setPushStatus("sending");
    try {
      const result = await adminApi.post("/notifications/push", { title, body });
      setPushStatus(`Sent to ${result.sent} device(s)`);
    } catch (err) {
      setPushStatus(err.message);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-white mb-1">Notifications</h1>
      <p className="text-sm text-gray-500 mb-6">Send announcements to all users — in-app and via push (Firebase Cloud Messaging).</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form onSubmit={sendBroadcast} className="bg-brand-card border border-brand-border rounded-xl p-5">
          <div className="text-sm text-white font-medium mb-3 flex items-center gap-2"><Radio size={14} /> New Broadcast</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required className="w-full bg-brand-panel border border-brand-border rounded-lg px-3 py-2 text-sm text-white mb-3" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message body" required rows={4} className="w-full bg-brand-panel border border-brand-border rounded-lg px-3 py-2 text-sm text-white mb-3 resize-none" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-brand-panel border border-brand-border rounded-lg px-3 py-2 text-sm text-white mb-4">
            {["info", "success", "warning", "system"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-brand-red hover:bg-brand-reddark text-white text-sm font-medium rounded-lg py-2.5 flex items-center justify-center gap-2">
              <Send size={14} /> Send In-App
            </button>
            <button type="button" onClick={sendPush} className="flex-1 bg-brand-panel border border-brand-border text-white text-sm font-medium rounded-lg py-2.5">
              Also Push (FCM)
            </button>
          </div>
          {pushStatus && <div className="text-xs text-gray-400 mt-2">{pushStatus}</div>}
        </form>

        <div className="bg-brand-card border border-brand-border rounded-xl p-5">
          <div className="text-sm text-white font-medium mb-3">Recent Broadcasts</div>
          <div className="max-h-96 overflow-y-auto">
            {history.map((h) => (
              <div key={h.id} className="border-b border-brand-border last:border-0 py-2.5">
                <div className="text-sm text-white">{h.title}</div>
                <div className="text-xs text-gray-500">{h.body}</div>
                <div className="text-[10px] text-gray-600 mt-1">{new Date(h.created_at).toLocaleString()}</div>
              </div>
            ))}
            {history.length === 0 && <div className="text-xs text-gray-600">No broadcasts sent yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
