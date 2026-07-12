import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, PrimaryButton } from "../components/ui";
import { C, font } from "../theme";
import { signUpWithEmail, signInWithGoogle, signInWithFacebook } from "../lib/supabaseClient";
import { useApp } from "../context/AppContext";

export default function SignUp() {
  const navigate = useNavigate();
  const { toast } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  async function handleSignUp() {
    const e = {};
    if (!name.trim()) e.name = "Enter your full name";
    if (!email.trim()) e.email = "Enter your email address";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email address";
    if (!password || password.length < 6) e.password = "Password must be at least 6 characters";
    if (Object.keys(e).length) return setErrors(e);

    setBusy(true);
    const { error } = await signUpWithEmail(email, password, name.trim());
    setBusy(false);
    if (error) {
      setErrors({ email: error.message });
      return;
    }
    toast("Check your inbox to confirm your email, then sign in.");
    navigate("/signin");
  }

  async function handleGoogle() {
    const { error } = await signInWithGoogle();
    if (error) toast(error.message);
  }
  async function handleFacebook() {
    const { error } = await signInWithFacebook();
    if (error) toast(error.message);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", paddingTop: 30 }}>
      <div style={{ fontSize: 26, fontWeight: 600, color: C.white, ...font }}>Create Account</div>
      <div style={{ fontSize: 13.5, color: C.gray, margin: "8px 0 26px", ...font }}>Join AnimAI and start creating</div>

      <TextField label="Full Name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
      <TextField label="Email Address" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      <TextField label="Password" type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />

      <PrimaryButton disabled={busy} onClick={handleSignUp}>{busy ? "Creating account…" : "Sign Up"}</PrimaryButton>

      <div style={{ textAlign: "center", color: C.grayDim, fontSize: 12, margin: "18px 0", ...font }}>or continue with</div>
      <div style={{ display: "flex", gap: 12 }}>
        <div onClick={handleGoogle} style={socialStyle}>G</div>
        <div onClick={handleFacebook} style={socialStyle}>f</div>
      </div>

      <div style={{ marginTop: "auto", textAlign: "center", fontSize: 13, color: C.gray, paddingTop: 20, ...font }}>
        Already have an account?{" "}
        <span onClick={() => navigate("/signin")} style={{ color: C.red, fontWeight: 600, cursor: "pointer" }}>
          Sign In
        </span>
      </div>
    </div>
  );
}

const socialStyle = {
  flex: 1, height: 46, borderRadius: 12, border: `1px solid ${C.border}`, display: "flex",
  alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 700, cursor: "pointer",
};
