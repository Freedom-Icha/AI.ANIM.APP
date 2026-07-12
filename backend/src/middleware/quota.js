const supabase = require("../config/supabase");
const { getPlan } = require("../plans");

/**
 * Core quota logic. Sums usage_logs for the user's CURRENT billing period
 * (or current day, for free-trial users) and compares against their plan's
 * allowance. This is what makes "video generation stops working once you
 * exhaust your hours until next subscription" actually true.
 *
 * type: 'video_seconds' | 'ai_chat' | 'ai_image' | 'voice_seconds'
 */
async function getUsageSummary(user) {
  const plan = getPlan(user.plan_id);
  const periodStart =
    plan.resetCycle === "daily"
      ? new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
      : user.current_period_start;

  const { data, error } = await supabase
    .from("usage_logs")
    .select("type, amount")
    .eq("user_id", user.id)
    .gte("created_at", periodStart);

  if (error) throw error;

  const totals = { video_seconds: 0, ai_chat: 0, ai_image: 0, voice_seconds: 0 };
  for (const row of data || []) {
    totals[row.type] = (totals[row.type] || 0) + Number(row.amount);
  }

  return {
    plan,
    periodStart,
    used: totals,
    limits: {
      video_seconds: plan.videoSecondsPerPeriod,
      ai_chat: plan.aiChatsPerPeriod,
      ai_image: plan.aiImagesPerPeriod,
      voice_seconds: plan.voiceSecondsPerPeriod,
    },
    remaining: {
      video_seconds: Math.max(0, plan.videoSecondsPerPeriod - totals.video_seconds),
      ai_chat: Math.max(0, plan.aiChatsPerPeriod - totals.ai_chat),
      ai_image: Math.max(0, plan.aiImagesPerPeriod - totals.ai_image),
      voice_seconds: Math.max(0, plan.voiceSecondsPerPeriod - totals.voice_seconds),
    },
  };
}

/**
 * Express middleware factory. Use as:
 *   router.post('/generate', requireAuth, checkQuota('video_seconds', 60), handler)
 * where `estimatedAmount` is how much of that resource the request is about
 * to consume (e.g. requested video length in seconds). Blocks with 402 if the
 * user doesn't have enough remaining allowance.
 */
function checkQuota(type, estimatedAmountFn) {
  return async function (req, res, next) {
    try {
      // A subscription that has lapsed (past_due/expired/canceled and trial over)
      // blocks ALL generation regardless of remaining counters.
      const now = new Date();
      const periodEnd = new Date(req.user.current_period_end);
      const stillEntitled =
        req.user.subscription_status === "active" ||
        (req.user.subscription_status === "trialing" && now < periodEnd);

      if (!stillEntitled) {
        return res.status(402).json({
          error: "SUBSCRIPTION_EXPIRED",
          message: "Your plan has expired. Renew your subscription to keep generating.",
        });
      }

      const estimatedAmount =
        typeof estimatedAmountFn === "function" ? estimatedAmountFn(req) : estimatedAmountFn;

      const summary = await getUsageSummary(req.user);
      const remaining = summary.remaining[type];

      if (remaining <= 0 || estimatedAmount > remaining) {
        return res.status(402).json({
          error: "QUOTA_EXCEEDED",
          message: `You've used all your ${humanLabel(type)} for this ${
            summary.plan.resetCycle === "daily" ? "day" : "billing period"
          }. Upgrade your plan or wait for your next reset to continue.`,
          quota: summary,
        });
      }

      req.quota = summary;
      next();
    } catch (err) {
      next(err);
    }
  };
}

function humanLabel(type) {
  return (
    {
      video_seconds: "video generation time",
      ai_chat: "AI chats",
      ai_image: "AI images",
      voice_seconds: "voice generation minutes",
    }[type] || type
  );
}

/** Records actual consumption after a generation succeeds. */
async function recordUsage(userId, type, amount, projectId = null, metadata = {}) {
  const { error } = await supabase
    .from("usage_logs")
    .insert({ user_id: userId, type, amount, project_id: projectId, metadata });
  if (error) throw error;
}

module.exports = { checkQuota, getUsageSummary, recordUsage };
