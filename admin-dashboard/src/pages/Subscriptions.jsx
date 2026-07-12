import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Users, Crown, XCircle, RefreshCcw } from "lucide-react";
import StatCard from "../components/StatCard";
import adminApi from "../lib/api";

export default function Subscriptions() {
  const [data, setData] = useState(null);
  const [byPlan, setByPlan] = useState(null);

  useEffect(() => {
    adminApi.get("/subscriptions").then(setData);
    adminApi.get("/subscriptions/by-plan").then((d) => setByPlan(d.counts));
  }, []);

  const labels = byPlan ? Object.keys(byPlan) : [];
  const values = byPlan ? Object.values(byPlan) : [];

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-white mb-1">Subscription Management</h1>
      <p className="text-sm text-gray-500 mb-6">Plan distribution and payment history.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Free Trial Users" value={data?.freeUsers ?? "—"} />
        <StatCard icon={Crown} label="Premium Users" value={data?.premiumUsers ?? "—"} />
        <StatCard icon={XCircle} label="Expired Subscriptions" value={data?.expiredSubscriptions ?? "—"} />
        <StatCard icon={RefreshCcw} label="Renewals (30d)" value={data?.renewalsLast30Days ?? "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-brand-card border border-brand-border rounded-xl p-5 h-72 flex items-center justify-center">
          {labels.length ? (
            <Pie
              data={{ labels, datasets: [{ data: values, backgroundColor: ["#8F8F8F", "#22c55e", "#3b82f6", "#FF1A1A"] }] }}
              options={{ plugins: { legend: { position: "bottom", labels: { color: "#8F8F8F" } } } }}
            />
          ) : (
            <div className="text-sm text-gray-500">No data yet.</div>
          )}
        </div>

        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs border-b border-brand-border">
                <th className="px-4 py-3 font-normal">Provider</th>
                <th className="px-4 py-3 font-normal">Plan</th>
                <th className="px-4 py-3 font-normal">Amount</th>
                <th className="px-4 py-3 font-normal">Date</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentPayments || []).map((p) => (
                <tr key={p.id} className="border-b border-brand-border last:border-0">
                  <td className="px-4 py-3 text-gray-300 capitalize">{p.provider}</td>
                  <td className="px-4 py-3 text-gray-300 capitalize">{p.plan_id}</td>
                  <td className="px-4 py-3 text-white">{p.currency} {p.amount}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
