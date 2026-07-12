const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { checkQuota, recordUsage } = require("../middleware/quota");
const { synthesizeSpeechAndStore, estimateDurationSeconds, VOICE_MAP } = require("../services/fishAudio");
const { getPlan } = require("../plans");

const router = express.Router();
router.use(requireAuth);

/** Public voice catalogue for the Voice Selection screen. Premium voices are
 * flagged as locked for Free Trial / Basic users (per the pricing sheet's
 * "Standard voice library" vs "Premium voice library" distinction). */
router.get("/catalogue", (req, res) => {
  const plan = getPlan(req.user.plan_id);
  const hasPremium = plan.id === "standard" || plan.id === "pro";
  const voices = Object.entries(VOICE_MAP).map(([id, v]) => ({
    id,
    tier: v.tier,
    locked: v.tier === "premium" && !hasPremium,
  }));
  res.json({ voices });
});

router.post(
  "/generate",
  checkQuota("voice_seconds", (req) => estimateDurationSeconds(req.body.text)),
  async (req, res, next) => {
    try {
      const { text, voiceId, projectId } = req.body;
      const plan = getPlan(req.user.plan_id);
      const voice = VOICE_MAP[voiceId];

      if (voice?.tier === "premium" && plan.id !== "standard" && plan.id !== "pro") {
        return res.status(403).json({
          error: "PLAN_RESTRICTED",
          message: "This voice is only available on the Standard and Pro plans.",
        });
      }

      const result = await synthesizeSpeechAndStore({
        userId: req.user.id,
        projectId,
        text,
        voiceId,
      });

      await recordUsage(req.user.id, "voice_seconds", result.estimatedSeconds, projectId, { voiceId });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
