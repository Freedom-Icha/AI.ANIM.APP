const express = require("express");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");
const { checkQuota, recordUsage } = require("../middleware/quota");
const { renderProjectVideo } = require("../services/ffmpegService");
const { getPlan } = require("../plans");

const router = express.Router();
router.use(requireAuth);

const RESOLUTION_RANK = { "720p": 1, "1080p": 2, "4K": 3 };

/**
 * Final render step. By this point the project already has generated scene
 * images (from POST /api/image/generate-scenes) and a narration track (from
 * POST /api/voice/generate) — the frontend passes those URLs plus the
 * approximate narration length (estimatedSeconds) here so quota can be
 * checked BEFORE we spend CPU time rendering.
 */
router.post(
  "/render/:projectId",
  checkQuota("video_seconds", (req) => Number(req.body.estimatedSeconds) || 60),
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const { imageUrls, audioUrl, resolution } = req.body;
      const plan = getPlan(req.user.plan_id);

      const requestedRank = RESOLUTION_RANK[resolution] || RESOLUTION_RANK["1080p"];
      const maxRank = RESOLUTION_RANK[plan.maxExportResolution] || RESOLUTION_RANK["1080p"];
      const finalResolution = requestedRank > maxRank ? plan.maxExportResolution : resolution;

      const { data: project, error: projErr } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("user_id", req.user.id)
        .single();
      if (projErr || !project) return res.status(404).json({ error: "Project not found" });

      await supabase.from("projects").update({ status: "rendering" }).eq("id", projectId);

      const { videoUrl, durationSec } = await renderProjectVideo({
        project,
        imageUrls,
        audioUrl,
        resolution: finalResolution,
        watermark: plan.watermarked,
      });

      await supabase
        .from("projects")
        .update({
          status: "completed",
          video_url: videoUrl,
          audio_url: audioUrl,
          resolution: finalResolution,
          duration_seconds: Math.round(durationSec),
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      await recordUsage(req.user.id, "video_seconds", durationSec, projectId, { resolution: finalResolution });

      await supabase.from("notifications").insert({
        user_id: req.user.id,
        title: "Video Ready",
        body: `"${project.title}" has finished rendering.`,
        type: "success",
      });

      res.json({
        videoUrl,
        durationSec,
        resolution: finalResolution,
        watermarked: plan.watermarked,
        downgradedResolution: finalResolution !== resolution,
      });
    } catch (err) {
      try {
        await supabase
          .from("projects")
          .update({ status: "failed", render_error: err.message })
          .eq("id", req.params.projectId);
      } catch (_) {
        /* best-effort */
      }
      err.source = err.source || "ffmpeg";
      next(err);
    }
  }
);

module.exports = router;
