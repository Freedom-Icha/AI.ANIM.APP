const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");

const env = require("./src/config/env");
const supabase = require("./src/config/supabase");
const { errorHandler, notFoundHandler } = require("./src/middleware/errorHandler");
const { expireLapsedSubscriptions } = require("./src/services/subscriptionService");

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(
  cors({
    origin: [env.FRONTEND_URL, env.ADMIN_DASHBOARD_URL, "http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

// Webhooks need their raw body BEFORE json parsing (see routes/webhooks.routes.js
// which applies express.raw()/express.json() itself per-route) — mount first.
app.use("/api/webhooks", require("./src/routes/webhooks.routes"));

app.use(express.json({ limit: "2mb" }));

// Generous but real protection against abuse; generation endpoints have
// their own quota middleware on top of this.
app.use(
  "/api/",
  rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false })
);

// Maintenance mode gate — checked on every request except admin routes, so
// admins can still get in to flip it back off.
app.use(async (req, res, next) => {
  if (req.path.startsWith("/api/admin") || req.path === "/api/health") return next();
  try {
    const { data } = await supabase.from("app_settings").select("maintenance_mode, maintenance_message").eq("id", 1).single();
    if (data?.maintenance_mode) {
      return res.status(503).json({ error: "MAINTENANCE_MODE", message: data.maintenance_message });
    }
  } catch (_) {
    // If app_settings can't be reached, fail open rather than lock everyone out.
  }
  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get("/api/health", (req, res) => res.json({ ok: true, service: "animai-backend", time: new Date().toISOString() }));

app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/projects", require("./src/routes/projects.routes"));
app.use("/api/script", require("./src/routes/script.routes"));
app.use("/api/image", require("./src/routes/image.routes"));
app.use("/api/voice", require("./src/routes/voice.routes"));
app.use("/api/video", require("./src/routes/video.routes"));
app.use("/api/payments", require("./src/routes/payments.routes"));
app.use("/api/subscription", require("./src/routes/subscription.routes"));
app.use("/api/notifications", require("./src/routes/notifications.routes"));
app.use("/api/analytics", require("./src/routes/analytics.routes"));
app.use("/api/admin", require("./src/routes/admin/index"));

app.use(notFoundHandler);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Scheduled jobs (require the process to stay running — this is why the
// backend belongs on Railway, not a serverless platform like Vercel)
// ---------------------------------------------------------------------------

// Every hour: flip any user past current_period_end into 'expired', which is
// what actually enforces "video generation stops until you resubscribe."
cron.schedule("0 * * * *", async () => {
  try {
    const count = await expireLapsedSubscriptions();
    if (count) console.log(`[cron] expired ${count} lapsed subscription(s)`);
  } catch (err) {
    console.error("[cron] expireLapsedSubscriptions failed:", err.message);
  }
});

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`AnimAI backend listening on port ${PORT} (${env.NODE_ENV})`);
});

module.exports = app;
