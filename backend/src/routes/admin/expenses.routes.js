const express = require("express");
const supabase = require("../../config/supabase");
const { getCostSummary } = require("../../services/costTracker");

const router = express.Router();

function daysAgoIso(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Combines auto-tracked API costs (Gemini, Stability AI, Fish Audio, hosting
 * compute, storage) with manually logged expenses into one breakdown. */
router.get("/", async (req, res, next) => {
  try {
    const monthIso = daysAgoIso(30);
    const apiCosts = await getCostSummary({ since: monthIso });

    const { data: manual, error } = await supabase
      .from("expenses")
      .select("*")
      .gte("occurred_at", monthIso)
      .order("occurred_at", { ascending: false });
    if (error) throw error;

    const manualByCategory = {};
    let manualTotal = 0;
    for (const e of manual || []) {
      manualByCategory[e.category] = (manualByCategory[e.category] || 0) + Number(e.amount_usd);
      manualTotal += Number(e.amount_usd);
    }

    res.json({
      apiCosts: apiCosts.byProvider, // { gemini, stability_ai, fish_audio, hosting, supabase_storage }
      apiCostsTotal: Number(apiCosts.total.toFixed(2)),
      manualExpenses: manual,
      manualByCategory,
      manualTotal: Number(manualTotal.toFixed(2)),
      grandTotalUSD: Number((apiCosts.total + manualTotal).toFixed(2)),
    });
  } catch (err) {
    next(err);
  }
});

/** Manually log a one-off expense (e.g. a hosting invoice, a design contractor). */
router.post("/", async (req, res, next) => {
  try {
    const { category, description, amountUSD, occurredAt } = req.body;
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        category,
        description,
        amount_usd: amountUSD,
        occurred_at: occurredAt || new Date().toISOString(),
        created_by: req.user.id,
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ expense: data });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { error } = await supabase.from("expenses").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
