const fs = require("fs");
const os = require("os");
const path = require("path");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const { v4: uuidv4 } = require("uuid");
const supabase = require("../config/supabase");
const { logCostEvent } = require("./costTracker");

ffmpeg.setFfmpegPath(ffmpegPath);

/** Downloads a remote file (Supabase public URL) to a local temp path. */
async function downloadToTemp(url, ext) {
  const response = await axios.get(url, { responseType: "arraybuffer", timeout: 60_000 });
  const tmpPath = path.join(os.tmpdir(), `animai-${uuidv4()}${ext}`);
  fs.writeFileSync(tmpPath, Buffer.from(response.data));
  return tmpPath;
}

/** Reads exact media duration in seconds using ffprobe. */
function getMediaDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      resolve(data.format.duration || 0);
    });
  });
}

/** Writes an .srt subtitle file, splitting narration text into ~6s captions. */
function buildSrt(scriptText, totalDurationSec) {
  const sentences = (scriptText || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  if (!sentences.length) return null;

  const perCaption = totalDurationSec / sentences.length;
  let srt = "";
  sentences.forEach((sentence, i) => {
    const start = i * perCaption;
    const end = Math.min(totalDurationSec, (i + 1) * perCaption);
    srt += `${i + 1}\n${toSrtTime(start)} --> ${toSrtTime(end)}\n${sentence.trim()}\n\n`;
  });

  const tmpPath = path.join(os.tmpdir(), `animai-${uuidv4()}.srt`);
  fs.writeFileSync(tmpPath, srt, "utf8");
  return tmpPath;
}

function toSrtTime(seconds) {
  const ms = Math.floor((seconds % 1) * 1000);
  const s = Math.floor(seconds) % 60;
  const m = Math.floor(seconds / 60) % 60;
  const h = Math.floor(seconds / 3600);
  const pad = (n, len = 2) => String(n).padStart(len, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

/**
 * Assembles the final video:
 *  - each scene image is shown for an equal slice of the narration's duration,
 *    with a slow zoom ("Ken Burns") pan for a less static feel
 *  - the narration track plays throughout
 *  - optional background music is mixed in underneath at low volume
 *  - burned-in subtitles are generated from the script text
 *  - free-trial exports get a corner watermark (per plan.watermarked)
 *
 * imagePaths: local temp file paths (already downloaded)
 * audioPath: local temp path of the narration mp3
 * resolution: '720p' | '1080p' | '4K'
 */
async function assembleVideo({
  imagePaths,
  audioPath,
  scriptText,
  resolution = "1080p",
  watermark = false,
  musicPath = null,
}) {
  const dims = { "720p": "1280x720", "1080p": "1920x1080", "4K": "3840x2160" }[resolution] || "1920x1080";
  const audioDuration = await getMediaDuration(audioPath);
  const perImage = Math.max(2, audioDuration / imagePaths.length);
  const srtPath = buildSrt(scriptText, audioDuration);
  const outputPath = path.join(os.tmpdir(), `animai-${uuidv4()}.mp4`);

  return new Promise((resolve, reject) => {
    const command = ffmpeg();

    imagePaths.forEach((imgPath) => {
      command.input(imgPath).loop(perImage);
    });
    command.input(audioPath);
    if (musicPath) command.input(musicPath);

    const [w, h] = dims.split("x");
    const filters = [];
    const sceneLabels = [];

    imagePaths.forEach((_, i) => {
      const zoomFrames = Math.round(perImage * 25);
      filters.push(
        `[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},` +
          `zoompan=z='min(zoom+0.0007,1.15)':d=${zoomFrames}:s=${w}x${h},fps=25,setsar=1[v${i}]`
      );
      sceneLabels.push(`[v${i}]`);
    });

    filters.push(`${sceneLabels.join("")}concat=n=${imagePaths.length}:v=1:a=0[vraw]`);

    let videoOut = "vraw";
    if (srtPath) {
      filters.push(
        `[vraw]subtitles='${srtPath.replace(/\\/g, "/").replace(/:/g, "\\:")}':` +
          `force_style='FontName=Poppins,FontSize=20,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=3,Outline=1,Shadow=0,MarginV=60'[vsub]`
      );
      videoOut = "vsub";
    }

    if (watermark) {
      filters.push(
        `[${videoOut}]drawtext=text='AnimAI':fontcolor=white@0.55:fontsize=28:` +
          `x=w-tw-24:y=h-th-24[vwm]`
      );
      videoOut = "vwm";
    }

    const audioInputIndex = imagePaths.length;
    let audioFilter = `[${audioInputIndex}:a]volume=1.0[anarr]`;
    let audioOut = "anarr";
    filters.push(audioFilter);

    if (musicPath) {
      const musicIndex = audioInputIndex + 1;
      filters.push(`[${musicIndex}:a]volume=0.12[amus]`);
      filters.push(`[anarr][amus]amix=inputs=2:duration=first:dropout_transition=2[amixed]`);
      audioOut = "amixed";
    }

    command
      .complexFilter(filters)
      .outputOptions([
        "-map",
        `[${videoOut}]`,
        "-map",
        `[${audioOut}]`,
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-shortest",
        "-movflags",
        "+faststart",
      ])
      .output(outputPath)
      .on("end", () => resolve({ outputPath, durationSec: audioDuration }))
      .on("error", (err) => reject(err))
      .run();
  });
}

/**
 * Full pipeline: downloads generated images + narration from Supabase Storage
 * URLs, renders the final MP4 with FFmpeg, uploads the result to the
 * `videos` bucket, updates the project row, records cost + usage, and
 * cleans up temp files.
 */
async function renderProjectVideo({ project, imageUrls, audioUrl, resolution, watermark }) {
  const tempFiles = [];
  try {
    const imagePaths = [];
    for (const url of imageUrls) {
      const p = await downloadToTemp(url, ".png");
      tempFiles.push(p);
      imagePaths.push(p);
    }
    const audioPath = await downloadToTemp(audioUrl, ".mp3");
    tempFiles.push(audioPath);

    const { outputPath, durationSec } = await assembleVideo({
      imagePaths,
      audioPath,
      scriptText: project.script,
      resolution,
      watermark,
    });
    tempFiles.push(outputPath);

    const videoBuffer = fs.readFileSync(outputPath);
    const storagePath = `${project.user_id}/${project.id}/${uuidv4()}.mp4`;

    const { error: uploadErr } = await supabase.storage
      .from("videos")
      .upload(storagePath, videoBuffer, { contentType: "video/mp4", upsert: false });
    if (uploadErr) {
      const e = new Error(`Failed to upload rendered video: ${uploadErr.message}`);
      e.source = "ffmpeg";
      throw e;
    }

    const { data: publicUrlData } = supabase.storage.from("videos").getPublicUrl(storagePath);

    await supabase.from("media_files").insert({
      user_id: project.user_id,
      project_id: project.id,
      bucket: "videos",
      storage_path: storagePath,
      file_size_bytes: videoBuffer.length,
      mime_type: "video/mp4",
    });

    // Rendering compute cost is charged to "hosting" — FFmpeg itself is free/open-source,
    // but the CPU time it consumes on Railway is not.
    await logCostEvent({ provider: "hosting", userId: project.user_id, units: durationSec / 3600 });

    return { videoUrl: publicUrlData.publicUrl, durationSec };
  } finally {
    tempFiles.forEach((f) => {
      try {
        fs.unlinkSync(f);
      } catch (_) {
        /* ignore cleanup errors */
      }
    });
  }
}

module.exports = { assembleVideo, renderProjectVideo, getMediaDuration, downloadToTemp };
