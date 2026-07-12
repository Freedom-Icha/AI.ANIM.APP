import React, { useEffect, useState } from "react";
import { Image, Film, Mic, MessageSquare, Star, Clock } from "lucide-react";
import StatCard from "../components/StatCard";
import adminApi from "../lib/api";

export default function AIUsage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi.get("/ai-usage").then(setData);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-white mb-1">AI Usage</h1>
      <p className="text-sm text-gray-500 mb-6">Last 30 days across all users.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Image} label="Images Generated" value={data?.imagesGenerated ?? "—"} />
        <StatCard icon={Film} label="Videos Created" value={data?.videosCreated ?? "—"} />
        <StatCard icon={Mic} label="Voice Generation (seconds)" value={data?.voiceGenerationsSeconds ?? "—"} />
        <StatCard icon={MessageSquare} label="AI Chats Used" value={data?.aiChatsUsed ?? "—"} />
        <StatCard icon={Star} label="Most Popular Feature" value={data?.mostPopularFeature ?? "—"} />
        <StatCard icon={Clock} label="Avg. Generation Time" value={data?.averageGenerationTimeSeconds != null ? `${data.averageGenerationTimeSeconds}s` : "—"} />
      </div>
    </div>
  );
}
