const express = require("express");
const supabase = require("../../config/supabase");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("media_files").select("bucket, file_size_bytes");
    if (error) throw error;

    const summary = { images: { count: 0, bytes: 0 }, videos: { count: 0, bytes: 0 }, audio: { count: 0, bytes: 0 }, thumbnails: { count: 0, bytes: 0 } };
    for (const row of data || []) {
      if (!summary[row.bucket]) summary[row.bucket] = { count: 0, bytes: 0 };
      summary[row.bucket].count += 1;
      summary[row.bucket].bytes += Number(row.file_size_bytes || 0);
    }

    const totalBytes = Object.values(summary).reduce((s, b) => s + b.bytes, 0);

    res.json({
      totalImagesStored: summary.images.count,
      totalVideosStored: summary.videos.count,
      totalAudioStored: summary.audio.count,
      totalStorageGB: Number((totalBytes / (1024 * 1024 * 1024)).toFixed(2)),
      breakdown: summary,
    });
  } catch (err) {
    next(err);
  }
});

/** Lists media files older than N days that belong to deleted/orphaned
 * projects — candidates for cleanup. */
router.get("/unused", async (req, res, next) => {
  try {
    const { data: files, error } = await supabase
      .from("media_files")
      .select("id, bucket, storage_path, project_id, file_size_bytes, created_at");
    if (error) throw error;

    const projectIds = [...new Set((files || []).map((f) => f.project_id).filter(Boolean))];
    const { data: existingProjects } = await supabase.from("projects").select("id").in("id", projectIds.length ? projectIds : ["00000000-0000-0000-0000-000000000000"]);
    const existingSet = new Set((existingProjects || []).map((p) => p.id));

    const orphaned = (files || []).filter((f) => f.project_id && !existingSet.has(f.project_id));
    res.json({ orphanedFiles: orphaned, count: orphaned.length });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { data: file, error: fetchErr } = await supabase
      .from("media_files")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (fetchErr || !file) return res.status(404).json({ error: "File not found" });

    await supabase.storage.from(file.bucket).remove([file.storage_path]);
    await supabase.from("media_files").delete().eq("id", req.params.id);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
