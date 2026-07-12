import React, { useEffect, useState } from "react";
import adminApi from "../lib/api";

const TABS = [
  { key: "logins", label: "Login History" },
  { key: "payments", label: "Payment History" },
  { key: "generations", label: "AI Generation Logs" },
  { key: "errors", label: "Error Logs" },
  { key: "admin-activity", label: "Admin Activity" },
];

export default function Logs() {
  const [tab, setTab] = useState("logins");
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    adminApi.get(`/logs/${tab}`).then((d) => setLogs(d.logs || []));
  }, [tab]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-white mb-1">Logs</h1>
      <p className="text-sm text-gray-500 mb-6">Audit trail across the platform.</p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key} onClick={() => setTab(t.key)}
            className={`text-xs px-3 py-1.5 rounded-full border ${tab === t.key ? "bg-brand-red border-brand-red text-white" : "border-brand-border text-gray-400"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-brand-border last:border-0">
                <td className="px-4 py-3 text-gray-300 align-top w-40">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-300 align-top">
                  <LogRow tab={tab} log={log} />
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td className="px-4 py-6 text-gray-600 text-xs">No records yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LogRow({ tab, log }) {
  if (tab === "logins") {
    return <span>{log.users?.email || log.user_id} — <span className="text-gray-500">{log.provider}</span> from {log.ip_address || "unknown IP"}</span>;
  }
  if (tab === "payments") {
    return <span>{log.users?.email} — {log.provider} · {log.currency} {log.amount} · <span className="capitalize">{log.status}</span></span>;
  }
  if (tab === "generations") {
    return <span>{log.users?.email} — {log.type} · amount {log.amount}</span>;
  }
  if (tab === "errors") {
    return <span className="text-red-400">[{log.source}] {log.message}</span>;
  }
  return <span>{log.admin?.email} — {log.action}</span>;
}
