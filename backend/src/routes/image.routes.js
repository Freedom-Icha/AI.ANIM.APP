const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { checkQuota, recordUsage } = require("../middleware/quota");
const { generateImageAndStore } = require("../services/stabilityAI");

const router = express.Router();
router.use(requireAuth);

/** Splits a script into rough visual "scenes" (one per ~2 sentences) so each
 * gets its own generated image — a lightweight stand-in for a full scene
 * detector. Swap for an LLM-based scene splitter later if you want smarter
 * shot selection. */
function splitIntoScenes(script, maxScenes = 6) {
  const sentences = (script || "").replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).filter(Boolean);
  if (!sentences.length) return ["A cinematic establishing shot"];
  const perScene = Math.max(1, Math.ceil(sentences.length / maxScenes));
  const scenes = [];
  for (let i = 0; i < sentences.length; i += perScene) {
    scenes.push(sentences.slice(i, i + perScene).join(" "));
  }
  return scenes.slice(0, maxScenes);
}

/** Generates every scene image for a project's script in one call. Quota is
 * checked against the number of scenes about to be generated. */
router.post("/generate-scenes", checkQuota("ai_image", (req) => splitIntoScenes(req.body.script).length), async (req, res, next) => {
  try {
    const { script, style, projectId } = req.body;
    const scenes = splitIntoScenes(script);

    const images = [];
    for (const scenePrompt of scenes) {
      const prompt = `${scenePrompt}. Style: ${style || "cinematic"}, high quality, no text, no watermark.`;
      // eslint-disable-next-line no-await-in-loop
      const image = await generateImageAndStore({ userId: req.user.id, projectId, prompt, style });
      images.push({ ...image, prompt: scenePrompt });
    }

    await recordUsage(req.user.id, "ai_image", images.length, projectId, { sceneCount: images.length });
    res.json({ images });
  } catch (err) {
    next(err);
  }
});

/** Generates a single one-off image (e.g. regenerating just one scene). */
router.post("/generate-one", checkQuota("ai_image", 1), async (req, res, next) => {
  try {
    const { prompt, style, projectId } = req.body;
    const image = await generateImageAndStore({ userId: req.user.id, projectId, prompt, style });
    await recordUsage(req.user.id, "ai_image", 1, projectId);
    res.json({ image });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
