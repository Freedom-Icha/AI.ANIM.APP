// Canonical plan definitions. These mirror database/seed.sql — the DB copy
// (public.plans) is the editable source of truth for pricing shown to admins;
// this file is a fast, no-DB-round-trip fallback used by the quota middleware
// and anywhere the DB row hasn't been fetched yet.

const PLANS = {
  free_trial: {
    id: "free_trial",
    name: "Free Trial (4 Days)",
    priceMonthlyUSD: 0,
    priceYearlyUSD: 0,
    trialDays: 4,
    resetCycle: "daily", // free trial quotas reset every 24h, not monthly
    videoHoursPerPeriod: 24 / 60 * 30 / 60, // ~1 video/day up to 30 min -> tracked in seconds below
    videoSecondsPerPeriod: 30 * 60, // 30 minutes/day
    aiChatsPerPeriod: 20,
    aiImagesPerPeriod: 5,
    voiceMinutesPerPeriod: 10,
    voiceSecondsPerPeriod: 10 * 60,
    maxExportResolution: "720p",
    storageGB: 1,
    watermarked: true,
    prioritySupport: false,
  },
  basic: {
    id: "basic",
    name: "Basic",
    priceMonthlyUSD: 9.99,
    priceYearlyUSD: 99.99,
    resetCycle: "monthly",
    videoSecondsPerPeriod: 5 * 3600,
    aiChatsPerPeriod: 500,
    aiImagesPerPeriod: 300,
    voiceMinutesPerPeriod: 1200,
    voiceSecondsPerPeriod: 1200 * 60,
    maxExportResolution: "720p",
    storageGB: 20,
    watermarked: false,
    prioritySupport: false,
  },
  standard: {
    id: "standard",
    name: "Standard",
    priceMonthlyUSD: 19.99,
    priceYearlyUSD: 199.99,
    resetCycle: "monthly",
    videoSecondsPerPeriod: 15 * 3600,
    aiChatsPerPeriod: 2000,
    aiImagesPerPeriod: 1000,
    voiceMinutesPerPeriod: 4000,
    voiceSecondsPerPeriod: 4000 * 60,
    maxExportResolution: "1080p",
    storageGB: 100,
    watermarked: false,
    prioritySupport: true,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthlyUSD: 39.99,
    priceYearlyUSD: 399.99,
    resetCycle: "monthly",
    videoSecondsPerPeriod: 30 * 3600,
    aiChatsPerPeriod: 10000,
    aiImagesPerPeriod: 3000,
    voiceMinutesPerPeriod: 8000,
    voiceSecondsPerPeriod: 8000 * 60,
    maxExportResolution: "4K",
    storageGB: 500,
    watermarked: false,
    prioritySupport: true,
  },
};

function getPlan(planId) {
  return PLANS[planId] || PLANS.free_trial;
}

module.exports = { PLANS, getPlan };
