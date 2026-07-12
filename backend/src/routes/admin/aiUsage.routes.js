const express = require("express");
const supabase = require("../../config/supabase");

const router = express.Router();

function daysAgoIso(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

router.get("/", async (req, res, next) => {
  try {
    const since = daysAgoIso(30);
    const { data, error } = await supabase
      .from("usage_logs")
      .select("type, amount, created_at")
      .gte("created_at", since);
    if (error) throw error;

    const totals = { video_seconds: 0, ai_chat: 0, ai_image: 0, voice_seconds: 0 };
    const counts = { video_seconds: 0, ai_chat: 0, ai_image: 0, voice_seconds: 0 };
    for (const row of data || []) {
      totals[row.type] = (totals[row.type] || 0) + Number(row.amount);
      counts[row.type] = (counts[row.type] || 0) + 1;
    }

    const { count: videosCount } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("created_at", since);

    // Best-effort proxy for "average generation time": elapsed time between a
    // project's creation and its completion timestamp. For a precise figure,
    // add render_started_at/render_finished_at columns and stamp them in
    // video.routes.js at the start/end of renderProjectVideo().
    const { data: completedProjects } = await supabase
      .from("projects")
      .select("created_at, updated_at")
      .eq("status", "completed")
      .gte("created_at", since);
    const durations = (completedProjects || [])
      .map((p) => (new Date(p.updated_at) - new Date(p.created_at)) / 1000)
      .filter((s) => s > 0 && s < 3600 * 6);
    const avgGenerationSeconds = durations.length
      ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
      : null;

    const usageEntries = Object.entries(counts);
    const mostPopular = usageEntries.sort((a, b) => b[1] - a[1])[0]?.[0] || "n/a";

    res.json({
      imagesGenerated: totals.ai_image,
      videosCreated: videosCount || 0,
      voiceGenerationsSeconds: totals.voice_seconds,
      aiChatsUsed: totals.ai_chat,
      mostPopularFeature: mostPopular,
      averageGenerationTimeSeconds: avgGenerationSeconds,
      totalEventCount: usageEntries.reduce((s, [, c]) => s + c, 0),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
