const express = require("express");
const supabase = require("../../config/supabase");

const router = express.Router();

function paginate(query, page = 1, pageSize = 50) {
  const from = (Number(page) - 1) * Number(pageSize);
  const to = from + Number(pageSize) - 1;
  return query.range(from, to);
}

router.get("/logins", async (req, res, next) => {
  try {
    let query = supabase
      .from("login_history")
      .select("*, users(email, full_name)")
      .order("created_at", { ascending: false });
    query = paginate(query, req.query.page, req.query.pageSize);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ logs: data });
  } catch (err) {
    next(err);
  }
});

router.get("/payments", async (req, res, next) => {
  try {
    let query = supabase
      .from("payments")
      .select("*, users(email, full_name)")
      .order("created_at", { ascending: false });
    query = paginate(query, req.query.page, req.query.pageSize);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ logs: data });
  } catch (err) {
    next(err);
  }
});

router.get("/generations", async (req, res, next) => {
  try {
    let query = supabase
      .from("usage_logs")
      .select("*, users(email, full_name)")
      .order("created_at", { ascending: false });
    query = paginate(query, req.query.page, req.query.pageSize);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ logs: data });
  } catch (err) {
    next(err);
  }
});

router.get("/errors", async (req, res, next) => {
  try {
    let query = supabase.from("error_logs").select("*").order("created_at", { ascending: false });
    query = paginate(query, req.query.page, req.query.pageSize);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ logs: data });
  } catch (err) {
    next(err);
  }
});

router.get("/admin-activity", async (req, res, next) => {
  try {
    let query = supabase
      .from("admin_logs")
      .select("*, admin:admin_id(email, full_name)")
      .order("created_at", { ascending: false });
    query = paginate(query, req.query.page, req.query.pageSize);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ logs: data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
