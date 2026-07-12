import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import StatCard from "../components/StatCard";
import adminApi from "../lib/api";
import { chartBaseOptions } from "../lib/chartSetup";

export default function Revenue() {
  const [summary, setSummary] = useState(null);
  const [chart, setChart] = useState(null);

  useEffect(() => {
    adminApi.get("/revenue").then(setSummary);
    adminApi.get("/revenue/chart").then(setChart);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-white mb-1">Revenue & Profit</h1>
      <p className="text-sm text-gray-500 mb-6">Normalized to USD across Paystack (NGN) and PayPal (USD).</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Total Revenue" value={`$${summary?.totalRevenueUSD ?? "—"}`} />
        <StatCard icon={TrendingUp} label="Today" value={`$${summary?.todayUSD ?? "—"}`} />
        <StatCard icon={TrendingUp} label="This Week" value={`$${summary?.weekUSD ?? "—"}`} />
        <StatCard icon={TrendingUp} label="This Month" value={`$${summary?.monthUSD ?? "—"}`} />
        <StatCard icon={TrendingDown} label="Total Withdrawals (Costs)" value={`$${summary?.totalWithdrawalsUSD ?? "—"}`} />
        <StatCard icon={PiggyBank} label="Net Profit (Month)" value={`$${summary?.netProfitMonthUSD ?? "—"}`} accent={summary?.netProfitMonthUSD < 0 ? "text-red-500" : "text-green-500"} />
      </div>

      <div className="bg-brand-card border border-brand-border rounded-xl p-5 h-80">
        <div className="text-sm text-white font-medium mb-3">Revenue — last 30 days</div>
        {chart && (
          <div className="h-64">
            <Line
              data={{
                labels: chart.labels,
                datasets: [{ label: "Revenue (USD)", data: chart.values, borderColor: "#FF1A1A", backgroundColor: "rgba(255,26,26,0.15)", fill: true, tension: 0.3 }],
              }}
              options={chartBaseOptions}
            />
          </div>
        )}
      </div>
    </div>
  );
}
