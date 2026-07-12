import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, PrimaryButton } from "../components/ui";
import { C, font } from "../theme";
import { signInWithEmail, signInWithGoogle, signInWithFacebook, resetPassword } from "../lib/supabaseClient";
import { useApp } from "../context/AppContext";

export default function SignIn() {
  const navigate = useNavigate();
  const { toast } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    const e = {};
    if (!email.trim()) e.email = "Enter your email address";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email address";
    if (!password) e.password = "Enter your password";
    if (Object.keys(e).length) return setErrors(e);

    setBusy(true);
    const { error } = await signInWithEmail(email, password);
    setBusy(false);
    if (error) {
      setErrors({ password: error.message });
      return;
    }
    navigate("/home");
  }

  async function handleGoogle() {
    const { error } = await signInWithGoogle();
    if (error) toast(error.message);
  }
  async function handleFacebook() {
    const { error } = await signInWithFacebook();
    if (error) toast(error.message);
  }
  async function handleForgot() {
    if (!email.trim()) return toast("Enter your email above first");
    const { error } = await resetPassword(email);
    toast(error ? error.message : "Password reset email sent");
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", paddingTop: 30 }}>
      <div style={{ fontSize: 26, fontWeight: 600, color: C.white, ...font }}>Welcome Back!</div>
      <div style={{ fontSize: 13.5, color: C.gray, margin: "8px 0 26px", ...font }}>Sign in to continue to AnimAI</div>

      <TextField label="Email Address" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      <TextField label="Password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
      <div onClick={handleForgot} style={{ textAlign: "right", color: C.red, fontSize: 12.5, marginBottom: 20, cursor: "pointer", ...font }}>
        Forgot Password?
      </div>

      <PrimaryButton disabled={busy} onClick={handleSignIn}>{busy ? "Signing in…" : "Sign In"}</PrimaryButton>

      <div style={{ textAlign: "center", color: C.grayDim, fontSize: 12, margin: "18px 0", ...font }}>or continue with</div>
      <div style={{ display: "flex", gap: 12 }}>
        <SocialButton label="G" onClick={handleGoogle} />
        <SocialButton label="f" onClick={handleFacebook} />
      </div>

      <div style={{ marginTop: "auto", textAlign: "center", fontSize: 13, color: C.gray, paddingTop: 20, ...font }}>
        Don't have an account?{" "}
        <span onClick={() => navigate("/signup")} style={{ color: C.red, fontWeight: 600, cursor: "pointer" }}>
          Sign Up
        </span>
      </div>
    </div>
  );
}

function SocialButton({ label, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, height: 46, borderRadius: 12, border: `1px solid ${C.border}`, display: "flex",
        alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 700, cursor: "pointer",
      }}
    >
      {label}
    </div>
  );
}
