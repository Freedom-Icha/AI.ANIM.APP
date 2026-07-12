import React, { useEffect, useState } from "react";
import { Users, UserCheck, UserPlus, Image, Film, MessageSquare, Mic, HardDrive, Activity } from "lucide-react";
import StatCard from "../components/StatCard";
import LiveCostTracker from "../components/LiveCostTracker";
import adminApi from "../lib/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminApi.get("/dashboard").then(setStats).catch(() => {});
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-white mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">Key stats at a glance.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? "—"} />
        <StatCard icon={UserCheck} label="Active Today" value={stats?.activeUsersToday ?? "—"} />
        <StatCard icon={UserPlus} label="New This Week" value={stats?.newUsersThisWeek ?? "—"} />
        <StatCard icon={HardDrive} label="Storage Used" value={stats ? `${stats.storageUsedGB} GB` : "—"} />
        <StatCard icon={Image} label="Images Generated Today" value={stats?.imagesGeneratedToday ?? "—"} />
        <StatCard icon={Film} label="Videos Created Today" value={stats?.videosCreatedToday ?? "—"} />
        <StatCard icon={MessageSquare} label="AI Chats Used Today" value={stats?.aiChatsUsedToday ?? "—"} />
        <StatCard icon={Mic} label="Voice Generation (s) Today" value={stats?.voiceGenerationSecondsToday ?? "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <StatCard icon={Activity} label="API Requests Today" value={stats?.apiRequestsToday ?? "—"} sub={stats ? `≈ $${stats.apiCostToday} spent today` : ""} />
        </div>
        <LiveCostTracker />
      </div>
    </div>
  );
}
