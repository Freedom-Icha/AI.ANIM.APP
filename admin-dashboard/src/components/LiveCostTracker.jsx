import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw, Zap } from "lucide-react";
import adminApi from "../lib/api";

const PROVIDER_LABELS = {
  gemini: "Gemini (AI Chat)",
  stability_ai: "Stability AI (Images)",
  fish_audio: "Fish Audio (Voice)",
  hosting: "Hosting Compute",
  supabase_storage: "Supabase Storage",
};

export default function LiveCostTracker() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const result = await adminApi.get("/cost-tracker/live");
      setData(result);
    } catch (_) {
      /* keep last known value on transient failure */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 60_000); // updates every 1 minute
    return () => clearInterval(iv);
  }, [fetchData]);

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-white font-medium">
          <Zap size={15} className="text-brand-red" /> Live Cost Tracker
        </div>
        <button onClick={fetchData} className="text-gray-500 hover:text-white transition-colors" title="Refresh now">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="text-3xl font-bold text-white mb-1">
        ${(data?.total || 0).toFixed(2)}
        <span className="text-xs font-normal text-gray-500 ml-2">spent today</span>
      </div>

      <div className="mt-3 space-y-2">
        {Object.entries(data?.byProvider || {}).map(([provider, amount]) => (
          <div key={provider} className="flex items-center justify-between text-xs">
            <span className="text-gray-400">{PROVIDER_LABELS[provider] || provider}</span>
            <span className="text-white font-medium">${Number(amount).toFixed(3)}</span>
          </div>
        ))}
        {!Object.keys(data?.byProvider || {}).length && (
          <div className="text-xs text-gray-500">No spend recorded yet today.</div>
        )}
      </div>

      <div className="text-[10px] text-gray-600 mt-3">
        Updates automatically every 60 seconds{data?.asOf ? ` · last refreshed ${new Date(data.asOf).toLocaleTimeString()}` : ""}
      </div>
    </div>
  );
}
