const express = require("express");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let query = supabase
      .from("projects")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (status && status !== "All") {
      if (status === "Favorites") query = query.eq("liked", true);
      else query = query.eq("status", status.toLowerCase());
    }
    if (search) query = query.ilike("title", `%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ projects: data });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .single();
    if (error || !data) return res.status(404).json({ error: "Project not found" });
    res.json({ project: data });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { title, script, genre, style, voiceId, durationSeconds, resolution, format } = req.body;
    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: req.user.id,
        title: title || "Untitled Project",
        script,
        genre,
        style,
        voice_id: voiceId,
        duration_seconds: durationSeconds || 120,
        resolution: resolution || "1080p",
        format: format || "MP4",
        status: "draft",
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ project: data });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const allowed = [
      "title", "script", "genre", "style", "voice_id",
      "duration_seconds", "resolution", "format", "liked", "status",
    ];
    const patch = {};
    for (const key of allowed) if (key in req.body) patch[key] = req.body[key];
    patch.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("projects")
      .update(patch)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ project: data });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
