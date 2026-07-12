const express = require("express");
const supabase = require("../../config/supabase");

const router = express.Router();

async function logAdminAction(adminId, action, targetId, details = {}) {
  await supabase.from("admin_logs").insert({ admin_id: adminId, action, target_id: targetId, details });
}

/** GET /api/admin/users?search=&status=&plan= */
router.get("/", async (req, res, next) => {
  try {
    const { search, status, plan, page = 1, pageSize = 25 } = req.query;
    let query = supabase.from("users").select("*", { count: "exact" });

    if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    if (status) query = query.eq("status", status);
    if (plan) query = query.eq("plan_id", plan);

    const from = (Number(page) - 1) * Number(pageSize);
    const to = from + Number(pageSize) - 1;
    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;
    res.json({ users: data, total: count });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { data: user, error } = await supabase.from("users").select("*").eq("id", req.params.id).single();
    if (error || !user) return res.status(404).json({ error: "User not found" });

    const [projects, payments, usage, logins] = await Promise.all([
      supabase.from("projects").select("id, title, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("usage_logs").select("type, amount, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("login_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);

    res.json({
      user,
      recentProjects: projects.data,
      recentPayments: payments.data,
      recentUsage: usage.data,
      recentLogins: logins.data,
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body; // 'active' | 'suspended' | 'banned'
    const { error } = await supabase.from("users").update({ status }).eq("id", req.params.id);
    if (error) throw error;
    await logAdminAction(req.user.id, `set_status_${status}`, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    // Deletes the auth user too (cascades to public.users via FK on delete cascade)
    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) throw error;
    await logAdminAction(req.user.id, "delete_account", req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/** Sends a password-reset email via Supabase Auth. */
router.post("/:id/reset-password", async (req, res, next) => {
  try {
    const { data: user } = await supabase.from("users").select("email").eq("id", req.params.id).single();
    if (!user) return res.status(404).json({ error: "User not found" });

    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) throw error;
    await logAdminAction(req.user.id, "reset_password", req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/plan", async (req, res, next) => {
  try {
    const { planId } = req.body;
    const { error } = await supabase.from("users").update({ plan_id: planId }).eq("id", req.params.id);
    if (error) throw error;
    await logAdminAction(req.user.id, "manual_plan_change", req.params.id, { planId });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
