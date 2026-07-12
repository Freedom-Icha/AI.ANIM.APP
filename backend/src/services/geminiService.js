const axios = require("axios");
const { logCostEvent } = require("./costTracker");

// Powers the "AI chats" quota (script co-writing / story ideas assistant).
// Referenced in the admin Expenses tab as "Gemini API costs". Get a key from
// https://aistudio.google.com/apikey and set GEMINI_API_KEY in .env.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Sends one prompt to Gemini and returns the generated text. Used both for
 * "write my script for me" (structured story prompt) and general in-app
 * chat assistance.
 * Docs: https://ai.google.dev/gemini-api/docs/text-generation
 */
async function generateText({ prompt, systemInstruction, userId }) {
  if (!GEMINI_API_KEY) {
    const e = new Error("GEMINI_API_KEY is not configured");
    e.source = "gemini";
    throw e;
  }

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.9, maxOutputTokens: 800 },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const { data } = await axios.post(
    `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    body,
    { headers: { "Content-Type": "application/json" }, timeout: 45_000 }
  );

  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";

  // Gemini flash-tier pricing is cheap and usage-based; we log 1 "chat unit"
  // per call here for simplicity — swap in token-based costing if you need
  // finer-grained accuracy (data.usageMetadata has exact token counts).
  await logCostEvent({ provider: "gemini", userId, units: 1 });

  return text;
}

async function writeStoryScript({ genre, idea, userId }) {
  const systemInstruction =
    "You are a concise, vivid short-story writer for narrated AI videos. " +
    "Write 3-5 short paragraphs, simple sentences, vivid imagery, suitable for narration aloud. No headings.";
  const prompt = idea
    ? `Genre: ${genre || "Story"}. Idea: ${idea}`
    : `Write an original short ${genre || "story"} suitable for a 2-minute narrated video.`;
  return generateText({ prompt, systemInstruction, userId });
}

module.exports = { generateText, writeStoryScript };
