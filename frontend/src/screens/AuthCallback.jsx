import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { C, font } from "../theme";
import { useAuth } from "../context/AuthContext";

/** Supabase redirects here after a Google/Facebook OAuth flow completes.
 * AuthContext's onAuthStateChange listener picks up the new session
 * automatically and bootstraps the profile; we just wait briefly then
 * forward the user into the app. */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => navigate(isAuthenticated ? "/home" : "/signin"), 600);
      return () => clearTimeout(t);
    }
  }, [loading, isAuthenticated, navigate]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={26} color={C.red} className="animai-spin" />
      <div style={{ fontSize: 12, color: C.grayDim, marginTop: 14, ...font }}>Finishing sign-in…</div>
    </div>
  );
}
