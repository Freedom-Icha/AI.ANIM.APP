const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const env = require("../config/env");
const supabase = require("../config/supabase");
const { logCostEvent } = require("./costTracker");

const STABILITY_BASE = "https://api.stability.ai/v1";

/**
 * Generates one image from a text prompt via Stability AI's REST API
 * (v1 "text-to-image" endpoint). Docs: https://platform.stability.ai/docs/api-reference
 *
 * Returns { buffer, mimeType } — caller is responsible for uploading to
 * Supabase Storage (see generateImageAndStore below, which does both).
 */
async function generateImage({ prompt, style = "cinematic", width = 1024, height = 1024 }) {
  if (!env.STABILITY_AI_API_KEY) {
    const e = new Error("STABILITY_AI_API_KEY is not configured");
    e.source = "stability_ai";
    throw e;
  }

  const stylePresetMap = {
    "3d": "3d-model",
    cartoon: "comic-book",
    realistic: "photographic",
    anime: "anime",
    cinematic: "cinematic",
    watercolor: "digital-art",
  };

  const response = await axios.post(
    `${STABILITY_BASE}/generation/${env.STABILITY_AI_ENGINE}/text-to-image`,
    {
      text_prompts: [{ text: prompt, weight: 1 }],
      cfg_scale: 7,
      height,
      width,
      samples: 1,
      steps: 30,
      style_preset: stylePresetMap[style] || "cinematic",
    },
    {
      headers: {
        Authorization: `Bearer ${env.STABILITY_AI_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 60_000,
    }
  );

  const artifact = response.data?.artifacts?.[0];
  if (!artifact?.base64) {
    const e = new Error("Stability AI returned no image data");
    e.source = "stability_ai";
    throw e;
  }

  return { buffer: Buffer.from(artifact.base64, "base64"), mimeType: "image/png" };
}

/**
 * Generates an image and uploads it straight to the `images` bucket in
 * Supabase Storage, logging the cost event for the Live Cost Tracker and
 * returning a public URL + the media_files row.
 */
async function generateImageAndStore({ userId, projectId, prompt, style }) {
  const { buffer, mimeType } = await generateImage({ prompt, style });

  const path = `${userId}/${projectId || "scratch"}/${uuidv4()}.png`;
  const { error: uploadErr } = await supabase.storage.from("images").upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (uploadErr) {
    const e = new Error(`Failed to upload generated image: ${uploadErr.message}`);
    e.source = "stability_ai";
    throw e;
  }

  const { data: publicUrlData } = supabase.storage.from("images").getPublicUrl(path);

  await supabase.from("media_files").insert({
    user_id: userId,
    project_id: projectId,
    bucket: "images",
    storage_path: path,
    file_size_bytes: buffer.length,
    mime_type: mimeType,
  });

  await logCostEvent({ provider: "stability_ai", userId, units: 1 });

  return { url: publicUrlData.publicUrl, path };
}

module.exports = { generateImage, generateImageAndStore };
