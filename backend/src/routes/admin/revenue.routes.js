const express = require("express");
const supabase = require("../../config/supabase");
const { getCostSummary } = require("../../services/costTracker");

const router = express.Router();

function daysAgoIso(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// Successful payments are stored in mixed currencies (NGN via Paystack, USD
// via PayPal). We normalize everything to USD for the revenue dashboard.
const NGN_PER_USD = Number(process.env.NGN_PER_USD || 1600);
function toUSD(payment) {
  return payment.currency === "NGN" ? payment.amount / NGN_PER_USD : payment.amount;
}

router.get("/", async (req, res, next) => {
  try {
    const { data: payments, error } = await supabase
      .from("payments")
      .select("amount, currency, created_at")
      .eq("status", "success");
    if (error) throw error;

    const todayIso = daysAgoIso(0).slice(0, 10);
    const weekIso = daysAgoIso(7);
    const monthIso = daysAgoIso(30);

    let total = 0, today = 0, week = 0, month = 0;
    for (const p of payments || []) {
      const usd = toUSD(p);
      total += usd;
      if (p.created_at.slice(0, 10) === todayIso) today += usd;
      if (p.created_at >= weekIso) week += usd;
      if (p.created_at >= monthIso) month += usd;
    }

    const { data: expenses } = await supabase.from("expenses").select("amount_usd, occurred_at");
    const totalExpensesMonth = (expenses || [])
      .filter((e) => e.occurred_at >= monthIso)
      .reduce((s, e) => s + Number(e.amount_usd), 0);

    const apiCostMonth = await getCostSummary({ since: monthIso });

    res.json({
      totalRevenueUSD: Number(total.toFixed(2)),
      todayUSD: Number(today.toFixed(2)),
      weekUSD: Number(week.toFixed(2)),
      monthUSD: Number(month.toFixed(2)),
      totalWithdrawalsUSD: Number((totalExpensesMonth + apiCostMonth.total).toFixed(2)),
      netProfitMonthUSD: Number((month - totalExpensesMonth - apiCostMonth.total).toFixed(2)),
    });
  } catch (err) {
    next(err);
  }
});

/** 30-day daily revenue series for the Chart.js line/bar chart. */
router.get("/chart", async (req, res, next) => {
  try {
    const since = daysAgoIso(30);
    const { data, error } = await supabase
      .from("payments")
      .select("amount, currency, created_at")
      .eq("status", "success")
      .gte("created_at", since);
    if (error) throw error;

    const byDay = {};
    for (const p of data || []) {
      const day = p.created_at.slice(0, 10);
      byDay[day] = (byDay[day] || 0) + toUSD(p);
    }
    const labels = Object.keys(byDay).sort();
    res.json({ labels, values: labels.map((d) => Number(byDay[d].toFixed(2))) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
