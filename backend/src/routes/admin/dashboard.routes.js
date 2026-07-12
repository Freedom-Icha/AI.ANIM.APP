const express = require("express");
const supabase = require("../../config/supabase");
const { getCostSummary } = require("../../services/costTracker");

const router = express.Router();

function startOfToday() {
  return new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
}
function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

/** GET /api/admin/dashboard — the top-line stat cards on the admin home page. */
router.get("/", async (req, res, next) => {
  try {
    const todayIso = startOfToday();
    const weekIso = startOfWeek();

    const [
      totalUsers,
      activeToday,
      newThisWeek,
      imagesGenerated,
      videosCreated,
      chatsUsed,
      voiceGenerations,
      storageUsage,
      cost,
    ] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("login_history").select("user_id", { count: "exact", head: true }).gte("created_at", todayIso),
      supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", weekIso),
      supabase.from("usage_logs").select("amount").eq("type", "ai_image").gte("created_at", todayIso),
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "completed").gte("created_at", todayIso),
      supabase.from("usage_logs").select("amount").eq("type", "ai_chat").gte("created_at", todayIso),
      supabase.from("usage_logs").select("amount").eq("type", "voice_seconds").gte("created_at", todayIso),
      supabase.from("media_files").select("file_size_bytes"),
      getCostSummary({ since: todayIso }),
    ]);

    const sumAmount = (result) => (result.data || []).reduce((s, r) => s + Number(r.amount), 0);
    const totalStorageBytes = (storageUsage.data || []).reduce((s, r) => s + Number(r.file_size_bytes || 0), 0);

    res.json({
      totalUsers: totalUsers.count || 0,
      activeUsersToday: activeToday.count || 0,
      newUsersThisWeek: newThisWeek.count || 0,
      imagesGeneratedToday: sumAmount(imagesGenerated),
      videosCreatedToday: videosCreated.count || 0,
      aiChatsUsedToday: sumAmount(chatsUsed),
      voiceGenerationSecondsToday: sumAmount(voiceGenerations),
      storageUsedGB: Number((totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2)),
      apiRequestsToday: cost.eventCount,
      apiCostToday: Number(cost.total.toFixed(2)),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
