// Centralized environment access. Import this instead of using process.env
// directly so every required key is validated once, at boot, in one place.
require("dotenv").config();

const required = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "JWT_SECRET",
];

function warnMissing() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `[env] Warning: missing required environment variables: ${missing.join(", ")}. ` +
      "The server will still boot so you can explore the code, but auth/DB calls will fail until these are set."
    );
  }
}
warnMissing();

module.exports = {
  PORT: process.env.PORT || 8080,
  NODE_ENV: process.env.NODE_ENV || "development",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  ADMIN_DASHBOARD_URL: process.env.ADMIN_DASHBOARD_URL || "http://localhost:5174",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",

  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,

  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
  PAYSTACK_WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET,

  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
  PAYPAL_MODE: process.env.PAYPAL_MODE || "sandbox",

  STABILITY_AI_API_KEY: process.env.STABILITY_AI_API_KEY,
  STABILITY_AI_ENGINE: process.env.STABILITY_AI_ENGINE || "stable-diffusion-xl-1024-v1-0",

  FISH_AUDIO_API_KEY: process.env.FISH_AUDIO_API_KEY,
  FISH_AUDIO_BASE_URL: process.env.FISH_AUDIO_BASE_URL || "https://api.fish.audio/v1",

  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.0-flash",

  FCM_SERVER_KEY: process.env.FCM_SERVER_KEY,
  FCM_PROJECT_ID: process.env.FCM_PROJECT_ID,
};
