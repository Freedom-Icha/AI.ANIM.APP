import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const { user } = await api.get("/auth/me");
      setProfile(user);
    } catch (err) {
      // First-ever login: no public.users row yet — bootstrap one, then retry.
      if (err.status === 401) {
        try {
          await api.post("/auth/bootstrap-profile", {});
          const { user } = await api.get("/auth/me");
          setProfile(user);
        } catch (bootstrapErr) {
          // eslint-disable-next-line no-console
          console.error("[auth] profile bootstrap failed:", bootstrapErr.message);
        }
      }
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfile().finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) loadProfile();
      else setProfile(null);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value = {
    session,
    profile,
    loading,
    isAuthenticated: Boolean(session),
    refreshProfile: loadProfile,
    signOut: async () => {
      try {
        await api.post("/auth/logout-log", {});
      } catch (_) {
        /* best-effort */
      }
      await supabase.auth.signOut();
      setProfile(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
