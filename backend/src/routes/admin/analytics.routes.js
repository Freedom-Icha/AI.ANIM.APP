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
    const todayIso = daysAgoIso(0).slice(0, 10);
    const monthIso = daysAgoIso(30);

    const [dauRes, mauRes, growthRes, countryRes] = await Promise.all([
      supabase.from("login_history").select("user_id").gte("created_at", daysAgoIso(0)),
      supabase.from("login_history").select("user_id").gte("created_at", monthIso),
      supabase.from("users").select("created_at").gte("created_at", monthIso),
      supabase.from("users").select("country"),
    ]);

    const dau = new Set((dauRes.data || []).map((r) => r.user_id)).size;
    const mau = new Set((mauRes.data || []).map((r) => r.user_id)).size;

    const growthByDay = {};
    (growthRes.data || []).forEach((u) => {
      const day = u.created_at.slice(0, 10);
      growthByDay[day] = (growthByDay[day] || 0) + 1;
    });
    const growthLabels = Object.keys(growthByDay).sort();

    const countryCounts = {};
    (countryRes.data || []).forEach((u) => {
      const c = u.country || "Unknown";
      countryCounts[c] = (countryCounts[c] || 0) + 1;
    });

    res.json({
      dailyActiveUsers: dau,
      monthlyActiveUsers: mau,
      userGrowth: { labels: growthLabels, values: growthLabels.map((d) => growthByDay[d]) },
      countryStats: countryCounts,
      // Device type + session duration require client-side analytics events
      // (see frontend/src/lib/analytics.js) which POST to /api/analytics/event.
      note: todayIso ? undefined : undefined,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
