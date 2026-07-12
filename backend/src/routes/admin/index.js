const express = require("express");
const { requireAdmin } = require("../../middleware/adminAuth");
const { getCostSummary } = require("../../services/costTracker");

const router = express.Router();

// Every /api/admin/* route requires an authenticated admin/superadmin account.
router.use(requireAdmin);

router.use("/dashboard", require("./dashboard.routes"));
router.use("/users", require("./users.routes"));
router.use("/revenue", require("./revenue.routes"));
router.use("/expenses", require("./expenses.routes"));
router.use("/ai-usage", require("./aiUsage.routes"));
router.use("/subscriptions", require("./subscriptions.routes"));
router.use("/files", require("./files.routes"));
router.use("/analytics", require("./analytics.routes"));
router.use("/notifications", require("./notifications.routes"));
router.use("/settings", require("./settings.routes"));
router.use("/logs", require("./logs.routes"));

/**
 * Live Cost Tracker — the admin dashboard polls this every 60 seconds
 * (see admin-dashboard/src/components/LiveCostTracker.jsx). Returns spend
 * so far today, broken down by provider, updated in near-real-time as
 * api_cost_events rows are inserted by each generation service.
 */
router.get("/cost-tracker/live", async (req, res, next) => {
  try {
    const todayIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const summary = await getCostSummary({ since: todayIso });
    res.json({ ...summary, asOf: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
