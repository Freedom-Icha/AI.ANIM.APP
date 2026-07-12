const supabase = require("../config/supabase");
const { getPlan } = require("../plans");

/**
 * Activates (or renews) a user's subscription after a successful payment.
 * Called from BOTH the Paystack webhook and the PayPal webhook — this is the
 * single place that actually "unlocks" a paid plan, per the requirement that
 * a payment "activates the account of the sender of the money through the
 * backend" rather than the frontend just assuming success.
 */
async function activateSubscription({ userId, planId, billingCycle }) {
  const plan = getPlan(planId);
  const now = new Date();
  const periodEnd = new Date(now);
  if (billingCycle === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  else periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { error } = await supabase
    .from("users")
    .update({
      plan_id: plan.id,
      billing_cycle: billingCycle,
      subscription_status: "active",
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;

  await supabase.from("notifications").insert({
    user_id: userId,
    title: "Payment Successful",
    body: `Your ${plan.name} plan is now active until ${periodEnd.toDateString()}.`,
    type: "payment",
  });

  return { plan, periodEnd };
}

/**
 * Cron-friendly sweep (see server.js node-cron job) that flips any user whose
 * current_period_end has passed into 'expired' if they haven't renewed. Once
 * expired, middleware/quota.js's checkQuota() blocks all generation, exactly
 * matching "video generation will not work again until next subscription."
 */
async function expireLapsedSubscriptions() {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("users")
    .update({ subscription_status: "expired" })
    .lt("current_period_end", nowIso)
    .in("subscription_status", ["active", "trialing"])
    .select("id");

  if (error) throw error;
  return data?.length || 0;
}

module.exports = { activateSubscription, expireLapsedSubscriptions };
