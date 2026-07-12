import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabaseClient] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. " +
      "Auth and direct-storage calls will fail until frontend/.env is configured."
  );
}

export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder");

/** Google sign-in — requires the Google provider enabled in Supabase Auth
 * dashboard (Authentication > Providers > Google) with your
 * GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET from Google Cloud Console. */
export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

/** Facebook sign-in — requires the Facebook provider enabled in Supabase Auth
 * dashboard with your FACEBOOK_APP_ID / FACEBOOK_APP_SECRET from
 * Facebook for Developers. */
export function signInWithFacebook() {
  return supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

export function signUpWithEmail(email, password, fullName) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
}

export function signInWithEmail(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function signOut() {
  return supabase.auth.signOut();
}

export function resetPassword(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}
