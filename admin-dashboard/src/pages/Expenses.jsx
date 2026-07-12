import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Plus } from "lucide-react";
import adminApi from "../lib/api";

const CATEGORY_COLORS = {
  gemini: "#FF1A1A",
  stability_ai: "#f97316",
  fish_audio: "#eab308",
  hosting: "#22c55e",
  supabase_storage: "#3b82f6",
  other: "#8b5cf6",
};

export default function Expenses() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ category: "other", description: "", amountUSD: "" });

  function load() {
    adminApi.get("/expenses").then(setData);
  }
  useEffect(load, []);

  async function addExpense(e) {
    e.preventDefault();
    await adminApi.post("/expenses", { ...form, amountUSD: Number(form.amountUSD) });
    setForm({ category: "other", description: "", amountUSD: "" });
    load();
  }

  const allCategories = { ...(data?.apiCosts || {}), ...(data?.manualByCategory || {}) };
  const labels = Object.keys(allCategories);
  const values = Object.values(allCategories);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-white mb-1">Expenses</h1>
      <p className="text-sm text-gray-500 mb-6">Last 30 days · Grand total ${data?.grandTotalUSD ?? "—"}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-xl p-5 h-72 flex items-center justify-center">
          {labels.length ? (
            <Doughnut
              data={{ labels, datasets: [{ data: values, backgroundColor: labels.map((l) => CATEGORY_COLORS[l] || "#666") }] }}
              options={{ plugins: { legend: { position: "right", labels: { color: "#8F8F8F" } } } }}
            />
          ) : (
            <div className="text-sm text-gray-500">No expenses logged yet.</div>
          )}
        </div>

        <form onSubmit={addExpense} className="bg-brand-card border border-brand-border rounded-xl p-5">
          <div className="text-sm text-white font-medium mb-3 flex items-center gap-2"><Plus size={14} /> Log an expense</div>
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full bg-brand-panel border border-brand-border rounded-lg px-3 py-2 text-sm text-white mb-3">
            {["gemini", "stability_ai", "fish_audio", "hosting", "supabase_storage", "other"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" className="w-full bg-brand-panel border border-brand-border rounded-lg px-3 py-2 text-sm text-white mb-3" />
          <input value={form.amountUSD} onChange={(e) => setForm((f) => ({ ...f, amountUSD: e.target.value }))} placeholder="Amount USD" type="number" step="0.01" className="w-full bg-brand-panel border border-brand-border rounded-lg px-3 py-2 text-sm text-white mb-3" />
          <button type="submit" className="w-full bg-brand-red hover:bg-brand-reddark text-white text-sm font-medium rounded-lg py-2">Add Expense</button>
        </form>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs border-b border-brand-border">
              <th className="px-4 py-3 font-normal">Category</th>
              <th className="px-4 py-3 font-normal">Description</th>
              <th className="px-4 py-3 font-normal">Amount</th>
              <th className="px-4 py-3 font-normal">Date</th>
            </tr>
          </thead>
          <tbody>
            {(data?.manualExpenses || []).map((e) => (
              <tr key={e.id} className="border-b border-brand-border last:border-0">
                <td className="px-4 py-3 text-gray-300 capitalize">{e.category}</td>
                <td className="px-4 py-3 text-gray-300">{e.description}</td>
                <td className="px-4 py-3 text-white">${Number(e.amount_usd).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(e.occurred_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
