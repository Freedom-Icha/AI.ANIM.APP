import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn("[supabaseClient] Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in admin-dashboard/.env");
}

export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder");

export function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}
export function signOut() {
  return supabase.auth.signOut();
}
