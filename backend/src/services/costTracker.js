const supabase = require("../config/supabase");

// Fallback unit costs (USD) — used if the api_unit_costs table hasn't been
// seeded yet or a row is missing. Keep these roughly in sync with
// database/seed.sql so estimates stay sane even before an admin edits them.
const FALLBACK_UNIT_COSTS = {
  stability_ai: 0.04, // per image
  fish_audio: 0.015, // per voice-minute
  hosting: 0.02, // per compute-hour (rough)
  supabase_storage: 0.021, // per GB-month
};

let unitCostCache = null;
let unitCostCacheExpires = 0;

async function getUnitCosts() {
  if (unitCostCache && Date.now() < unitCostCacheExpires) return unitCostCache;
  const { data } = await supabase.from("api_unit_costs").select("provider, unit_cost_usd");
  const map = { ...FALLBACK_UNIT_COSTS };
  (data || []).forEach((row) => {
    map[row.provider] = Number(row.unit_cost_usd);
  });
  unitCostCache = map;
  unitCostCacheExpires = Date.now() + 60_000; // refresh at most once a minute
  return map;
}

/**
 * Logs one billable event (e.g. "generated 1 image", "rendered 0.05 hours of
 * video compute") into api_cost_events. The admin dashboard's Live Cost
 * Tracker polls a rolled-up view of this table every 60 seconds.
 */
async function logCostEvent({ provider, userId, units }) {
  const costs = await getUnitCosts();
  const unitCost = costs[provider] ?? 0;
  const totalCost = unitCost * units;

  const { error } = await supabase.from("api_cost_events").insert({
    provider,
    user_id: userId || null,
    units,
    unit_cost_usd: unitCost,
    total_cost_usd: totalCost,
  });
  if (error) {
    // eslint-disable-next-line no-console
    console.error("[costTracker] failed to log cost event:", error.message);
  }
  return totalCost;
}

/** Aggregates spend for the admin Live Cost Tracker + Expenses dashboard. */
async function getCostSummary({ since } = {}) {
  const from = since || new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const { data, error } = await supabase
    .from("api_cost_events")
    .select("provider, total_cost_usd, created_at")
    .gte("created_at", from);
  if (error) throw error;

  const byProvider = {};
  let total = 0;
  for (const row of data || []) {
    byProvider[row.provider] = (byProvider[row.provider] || 0) + Number(row.total_cost_usd);
    total += Number(row.total_cost_usd);
  }
  return { since: from, total, byProvider, eventCount: (data || []).length };
}

module.exports = { logCostEvent, getCostSummary, getUnitCosts };
