import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Users, TrendingUp } from "lucide-react";
import StatCard from "../components/StatCard";
import adminApi from "../lib/api";
import { chartBaseOptions } from "../lib/chartSetup";

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi.get("/analytics").then(setData);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-white mb-1">Analytics</h1>
      <p className="text-sm text-gray-500 mb-6">Engagement and growth over the last 30 days.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard icon={Users} label="Daily Active Users" value={data?.dailyActiveUsers ?? "—"} />
        <StatCard icon={TrendingUp} label="Monthly Active Users" value={data?.monthlyActiveUsers ?? "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-brand-card border border-brand-border rounded-xl p-5 h-72">
          <div className="text-sm text-white font-medium mb-3">User Growth</div>
          {data?.userGrowth && (
            <div className="h-52">
              <Bar
                data={{ labels: data.userGrowth.labels, datasets: [{ label: "New Users", data: data.userGrowth.values, backgroundColor: "#FF1A1A" }] }}
                options={chartBaseOptions}
              />
            </div>
          )}
        </div>

        <div className="bg-brand-card border border-brand-border rounded-xl p-5">
          <div className="text-sm text-white font-medium mb-3">Country Stats</div>
          {Object.entries(data?.countryStats || {}).map(([country, count]) => (
            <div key={country} className="flex justify-between text-xs py-1.5 border-b border-brand-border last:border-0">
              <span className="text-gray-300">{country}</span>
              <span className="text-white">{count}</span>
            </div>
          ))}
          <div className="text-[10px] text-gray-600 mt-3">
            Device type & session duration require the frontend to call POST /api/analytics/event on app open/close.
          </div>
        </div>
      </div>
    </div>
  );
}
