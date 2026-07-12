import React, { useEffect, useState } from "react";
import { Save, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import adminApi from "../lib/api";

export default function AppSettings() {
  const [settings, setSettings] = useState(null);
  const [plans, setPlans] = useState([]);
  const [keyStatus, setKeyStatus] = useState(null);

  function load() {
    adminApi.get("/settings").then((d) => { setSettings(d.settings); setPlans(d.plans || []); });
    adminApi.get("/settings/api-keys/status").then((d) => setKeyStatus(d.status));
  }
  useEffect(load, []);

  async function toggleMaintenance() {
    await adminApi.patch("/settings", { maintenanceMode: !settings.maintenance_mode });
    load();
  }

  async function toggleFeature(key) {
    const features = { ...settings.features, [key]: !settings.features[key] };
    await adminApi.patch("/settings", { features });
    load();
  }

  async function updatePlanPrice(planId, field, value) {
    await adminApi.patch(`/settings/plans/${planId}`, { [field]: Number(value) });
    load();
  }

  if (!settings) return <div className="p-8 text-gray-500 text-sm">Loading…</div>;

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-white mb-1">App Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Pricing, feature flags, maintenance mode, and API key status.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-brand-card border border-brand-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-white font-medium flex items-center gap-2"><AlertTriangle size={14} className="text-yellow-500" /> Maintenance Mode</div>
            <button onClick={toggleMaintenance} className={`w-11 h-6 rounded-full relative transition-colors ${settings.maintenance_mode ? "bg-brand-red" : "bg-brand-border"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${settings.maintenance_mode ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
          <div className="text-xs text-gray-500">{settings.maintenance_message}</div>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-xl p-5">
          <div className="text-sm text-white font-medium mb-3">Feature Flags</div>
          {Object.entries(settings.features || {}).map(([key, on]) => (
            <div key={key} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-300 capitalize">{key.replace(/_/g, " ")}</span>
              <button onClick={() => toggleFeature(key)} className={`w-10 h-5 rounded-full relative transition-colors ${on ? "bg-brand-red" : "bg-brand-border"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-xl p-5 mb-6">
        <div className="text-sm text-white font-medium mb-4">Subscription Pricing</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs border-b border-brand-border">
              <th className="pb-2 font-normal">Plan</th>
              <th className="pb-2 font-normal">Monthly ($)</th>
              <th className="pb-2 font-normal">Yearly ($)</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-b border-brand-border last:border-0">
                <td className="py-2 text-gray-300">{p.name}</td>
                <td className="py-2">
                  <PriceInput value={p.price_monthly_usd} onSave={(v) => updatePlanPrice(p.id, "price_monthly_usd", v)} />
                </td>
                <td className="py-2">
                  <PriceInput value={p.price_yearly_usd} onSave={(v) => updatePlanPrice(p.id, "price_yearly_usd", v)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-xl p-5">
        <div className="text-sm text-white font-medium mb-3">API Key Status</div>
        <div className="text-xs text-gray-500 mb-3">Managed via environment variables on Railway — this only reports presence, never the actual secret values.</div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(keyStatus || {}).map(([key, present]) => (
            <div key={key} className="flex items-center gap-2 text-xs text-gray-300">
              {present ? <CheckCircle2 size={13} className="text-green-500" /> : <XCircle size={13} className="text-red-500" />}
              {key}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PriceInput({ value, onSave }) {
  const [val, setVal] = useState(value);
  return (
    <div className="flex items-center gap-2">
      <input value={val} onChange={(e) => setVal(e.target.value)} type="number" step="0.01" className="w-24 bg-brand-panel border border-brand-border rounded px-2 py-1 text-white text-xs" />
      {Number(val) !== Number(value) && (
        <button onClick={() => onSave(val)} className="text-brand-red"><Save size={13} /></button>
      )}
    </div>
  );
}
