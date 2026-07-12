import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn } from "../lib/supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: signInError } = await signIn(email, password);
    setBusy(false);
    if (signInError) return setError(signInError.message);
    navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-brand-card border border-brand-border rounded-2xl p-8">
        <div className="text-white font-semibold tracking-widest text-xl mb-1">
          ANIM<span className="text-brand-red">AI</span>
        </div>
        <div className="text-xs text-gray-500 mb-6">Admin Dashboard Sign In</div>

        <label className="block text-xs text-gray-400 mb-1">Email</label>
        <input
          value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
          className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white outline-none mb-4"
        />
        <label className="block text-xs text-gray-400 mb-1">Password</label>
        <input
          value={password} onChange={(e) => setPassword(e.target.value)} type="password" required
          className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white outline-none mb-4"
        />

        {error && <div className="text-xs text-brand-red mb-4">{error}</div>}

        <button
          type="submit" disabled={busy}
          className="w-full bg-brand-red hover:bg-brand-reddark disabled:opacity-60 text-white font-medium text-sm rounded-lg py-2.5 transition-colors"
        >
          {busy ? "Signing in…" : "Sign In"}
        </button>

        <div className="text-[10px] text-gray-600 mt-4 leading-relaxed">
          Only accounts with role "admin" or "superadmin" in the users table can access this dashboard —
          set that manually via the Supabase table editor for your own account first.
        </div>
      </form>
    </div>
  );
}
