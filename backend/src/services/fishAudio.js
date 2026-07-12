const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const env = require("../config/env");
const supabase = require("../config/supabase");
const { logCostEvent } = require("./costTracker");

/**
 * Fish Audio text-to-speech. Docs: https://docs.fish.audio
 * The API accepts a reference voice id ("reference_id") and returns raw audio
 * bytes (mp3) in the response body.
 *
 * Voice catalogue (VOICE_MAP) maps our app's friendly persona ids to Fish
 * Audio reference voice ids. Replace these placeholder ids with real voice
 * ids from your Fish Audio dashboard/voice library once you've picked which
 * catalogue voices to license — standard vs premium tiers gate which of these
 * a plan can use (see routes/voice.routes.js).
 */
const VOICE_MAP = {
  james: { referenceId: "REPLACE_WITH_FISH_AUDIO_VOICE_ID_JAMES", tier: "standard" },
  sophia: { referenceId: "REPLACE_WITH_FISH_AUDIO_VOICE_ID_SOPHIA", tier: "standard" },
  daniel: { referenceId: "REPLACE_WITH_FISH_AUDIO_VOICE_ID_DANIEL", tier: "premium" },
  chinedu: { referenceId: "REPLACE_WITH_FISH_AUDIO_VOICE_ID_CHINEDU", tier: "premium" },
  amina: { referenceId: "REPLACE_WITH_FISH_AUDIO_VOICE_ID_AMINA", tier: "premium" },
};

async function synthesizeSpeech({ text, voiceId = "sophia" }) {
  if (!env.FISH_AUDIO_API_KEY) {
    const e = new Error("FISH_AUDIO_API_KEY is not configured");
    e.source = "fish_audio";
    throw e;
  }

  const voice = VOICE_MAP[voiceId] || VOICE_MAP.sophia;

  const response = await axios.post(
    `${env.FISH_AUDIO_BASE_URL}/tts`,
    {
      text,
      reference_id: voice.referenceId,
      format: "mp3",
      normalize: true,
    },
    {
      headers: {
        Authorization: `Bearer ${env.FISH_AUDIO_API_KEY}`,
        "Content-Type": "application/json",
      },
      responseType: "arraybuffer",
      timeout: 90_000,
    }
  );

  return { buffer: Buffer.from(response.data), mimeType: "audio/mpeg" };
}

/** Rough duration estimate (words / 150wpm) — used before the real audio file
 * exists, e.g. to pre-flight a quota check. Overwritten by ffprobe's exact
 * duration once the file is generated (see ffmpegService.getAudioDuration). */
function estimateDurationSeconds(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.round((words / 150) * 60));
}

async function synthesizeSpeechAndStore({ userId, projectId, text, voiceId }) {
  const { buffer, mimeType } = await synthesizeSpeech({ text, voiceId });

  const path = `${userId}/${projectId || "scratch"}/${uuidv4()}.mp3`;
  const { error: uploadErr } = await supabase.storage.from("audio").upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (uploadErr) {
    const e = new Error(`Failed to upload generated voice audio: ${uploadErr.message}`);
    e.source = "fish_audio";
    throw e;
  }

  const { data: publicUrlData } = supabase.storage.from("audio").getPublicUrl(path);

  await supabase.from("media_files").insert({
    user_id: userId,
    project_id: projectId,
    bucket: "audio",
    storage_path: path,
    file_size_bytes: buffer.length,
    mime_type: mimeType,
  });

  const estimatedSeconds = estimateDurationSeconds(text);
  await logCostEvent({ provider: "fish_audio", userId, units: estimatedSeconds / 60 });

  return { url: publicUrlData.publicUrl, path, estimatedSeconds };
}

module.exports = { synthesizeSpeech, synthesizeSpeechAndStore, estimateDurationSeconds, VOICE_MAP };
