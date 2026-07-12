const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { checkQuota, recordUsage } = require("../middleware/quota");
const { writeStoryScript } = require("../services/geminiService");

const router = express.Router();
router.use(requireAuth);

/** Generates a starter script from a genre + optional idea. Counts as 1 AI chat. */
router.post("/write", checkQuota("ai_chat", 1), async (req, res, next) => {
  try {
    const { genre, idea, projectId } = req.body;
    const script = await writeStoryScript({ genre, idea, userId: req.user.id });
    await recordUsage(req.user.id, "ai_chat", 1, projectId, { genre });
    res.json({ script });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
