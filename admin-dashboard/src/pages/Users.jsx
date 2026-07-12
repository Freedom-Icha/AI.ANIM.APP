import React, { useEffect, useState } from "react";
import { Search, Ban, Trash2, KeyRound, ChevronRight } from "lucide-react";
import adminApi from "../lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  function load() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    adminApi.get(`/users?${params}`).then((d) => {
      setUsers(d.users || []);
      setTotal(d.total || 0);
    });
  }

  useEffect(load, [search]);

  async function openUser(u) {
    const detail = await adminApi.get(`/users/${u.id}`);
    setSelected(detail);
  }

  async function setStatus(id, status) {
    await adminApi.patch(`/users/${id}/status`, { status });
    load();
    if (selected?.user.id === id) openUser({ id });
  }
  async function resetPassword(id) {
    await adminApi.post(`/users/${id}/reset-password`, {});
    alert("Password reset email sent.");
  }
  async function deleteAccount(id) {
    if (!confirm("Permanently delete this account? This cannot be undone.")) return;
    await adminApi.delete(`/users/${id}`);
    setSelected(null);
    load();
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-white mb-1">User Management</h1>
      <p className="text-sm text-gray-500 mb-6">{total} total users</p>

      <div className="flex items-center gap-2 bg-brand-card border border-brand-border rounded-lg px-3 py-2 mb-4 max-w-sm">
        <Search size={15} className="text-gray-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" className="bg-transparent outline-none text-sm text-white flex-1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs border-b border-brand-border">
                <th className="px-4 py-3 font-normal">User</th>
                <th className="px-4 py-3 font-normal">Plan</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} onClick={() => openUser(u)} className="border-b border-brand-border last:border-0 hover:bg-brand-panel cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="text-white">{u.full_name}</div>
                    <div className="text-gray-500 text-xs">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 capitalize">{u.plan_id?.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${u.status === "active" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600"><ChevronRight size={14} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-xl p-5">
          {!selected ? (
            <div className="text-sm text-gray-500">Select a user to view activity and manage their account.</div>
          ) : (
            <>
              <div className="text-white font-medium">{selected.user.full_name}</div>
              <div className="text-xs text-gray-500 mb-4">{selected.user.email}</div>

              <div className="flex gap-2 mb-5">
                <button onClick={() => setStatus(selected.user.id, selected.user.status === "banned" ? "active" : "banned")} className="flex-1 flex items-center justify-center gap-1 text-xs bg-brand-panel border border-brand-border rounded-lg py-2 text-gray-300 hover:text-white">
                  <Ban size={13} /> {selected.user.status === "banned" ? "Unban" : "Ban"}
                </button>
                <button onClick={() => resetPassword(selected.user.id)} className="flex-1 flex items-center justify-center gap-1 text-xs bg-brand-panel border border-brand-border rounded-lg py-2 text-gray-300 hover:text-white">
                  <KeyRound size={13} /> Reset PW
                </button>
                <button onClick={() => deleteAccount(selected.user.id)} className="flex-1 flex items-center justify-center gap-1 text-xs bg-red-950 border border-red-900 rounded-lg py-2 text-red-400 hover:text-red-300">
                  <Trash2 size={13} /> Delete
                </button>
              </div>

              <div className="text-xs text-gray-500 mb-2">Recent Projects</div>
              {(selected.recentProjects || []).map((p) => (
                <div key={p.id} className="text-xs text-gray-300 flex justify-between py-1">
                  <span>{p.title}</span><span className="text-gray-600 capitalize">{p.status}</span>
                </div>
              ))}

              <div className="text-xs text-gray-500 mt-4 mb-2">Recent Payments</div>
              {(selected.recentPayments || []).map((p) => (
                <div key={p.id} className="text-xs text-gray-300 flex justify-between py-1">
                  <span>{p.provider}</span><span>{p.currency} {p.amount}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
