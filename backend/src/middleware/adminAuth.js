const { requireAuth } = require("./auth");

/**
 * Chains onto requireAuth: first verifies the caller is logged in, then
 * checks their profile role. Used on every /api/admin/* route so the admin
 * dashboard and the regular app share one auth system, but admin data stays
 * locked to admin/superadmin accounts only.
 */
async function requireAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (!req.user || !["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  });
}

function requireSuperAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (!req.user || req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Super admin access required" });
    }
    next();
  });
}

module.exports = { requireAdmin, requireSuperAdmin };
