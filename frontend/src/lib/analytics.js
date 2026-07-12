import api from "./api";

function detectDeviceType() {
  const ua = navigator.userAgent || "";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

/** Call once near app startup (see AuthContext or App.jsx) — logs a session
 * event when the tab is closed/hidden, with total time spent. Best-effort:
 * failures are swallowed so analytics never breaks the app. */
export function trackSession() {
  const start = Date.now();
  const deviceType = detectDeviceType();

  function send() {
    const sessionSeconds = Math.round((Date.now() - start) / 1000);
    api.post("/analytics/event", { deviceType, sessionSeconds }).catch(() => {});
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") send();
  });
  window.addEventListener("beforeunload", send);
}
