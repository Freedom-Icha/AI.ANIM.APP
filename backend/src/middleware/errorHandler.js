const supabase = require("../config/supabase");

/**
 * Express error-handling middleware (4-arg signature required).
 * Logs unexpected errors to public.error_logs for the admin "Logs" tab,
 * and returns a safe, generic message to the client.
 */
// eslint-disable-next-line no-unused-vars
async function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  // eslint-disable-next-line no-console
  console.error("[error]", err);

  try {
    await supabase.from("error_logs").insert({
      source: err.source || "server",
      user_id: req.user?.id || null,
      message: err.message || String(err),
      stack: err.stack || null,
    });
  } catch (logErr) {
    // eslint-disable-next-line no-console
    console.error("[error] failed to write to error_logs:", logErr.message);
  }

  res.status(status).json({
    error: err.publicCode || "SERVER_ERROR",
    message:
      status >= 500
        ? "Something went wrong on our end. Please try again shortly."
        : err.message,
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` });
}

module.exports = { errorHandler, notFoundHandler };
