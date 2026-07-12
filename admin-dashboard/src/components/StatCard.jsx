import React from "react";

export default function StatCard({ icon: Icon, label, value, sub, accent = "text-brand-red" }) {
  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-gray-500">{label}</div>
        {Icon && <Icon size={16} className={accent} />}
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      {sub && <div className="text-[11px] text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}
