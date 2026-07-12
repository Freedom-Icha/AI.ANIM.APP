import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff, AlertCircle, Home, FolderOpen, Plus, LayoutTemplate, User } from "lucide-react";
import { C, font } from "../theme";

export function Logo({ size = 34 }) {
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <div
        style={{
          width: 0, height: 0, position: "absolute", left: size * 0.02,
          borderLeft: `${size * 0.28}px solid transparent`,
          borderRight: `${size * 0.28}px solid transparent`,
          borderBottom: `${size * 0.5}px solid ${C.white}`,
        }}
      />
      <div
        style={{
          width: 0, height: 0, position: "absolute", right: -size * 0.08,
          borderTop: `${size * 0.25}px solid transparent`,
          borderBottom: `${size * 0.25}px solid transparent`,
          borderLeft: `${size * 0.36}px solid ${C.red}`,
        }}
      />
    </div>
  );
}

export function WordMark({ size = 20 }) {
  return (
    <div style={{ ...font, fontWeight: 600, fontSize: size, letterSpacing: 4, color: C.white }}>
      ANIM<span style={{ color: C.red }}>AI</span>
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, style = {}, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", padding: "15px 18px", borderRadius: 14, border: "none",
        background: disabled ? "#4a1210" : C.red, color: C.white, fontWeight: 600,
        fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
        gap: 8, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
        ...font, ...style,
      }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, style = {} }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%", padding: "14px 18px", borderRadius: 14, cursor: "pointer",
        background: "transparent", color: C.white, fontWeight: 500, fontSize: 15,
        border: `1px solid ${C.border}`, ...font, ...style,
      }}
    >
      {children}
    </button>
  );
}

export function TextField({ label, placeholder, type = "text", value, onChange, error }) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div style={{ marginBottom: error ? 4 : 16 }}>
      {label && <div style={{ fontSize: 12.5, color: C.gray, marginBottom: 7, ...font }}>{label}</div>}
      <div style={{ position: "relative" }}>
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type={isPass && !show ? "password" : "text"}
          style={{
            width: "100%", boxSizing: "border-box", background: C.card,
            border: `1px solid ${error ? C.red : C.border}`,
            borderRadius: 12, padding: "13px 14px", color: C.white, fontSize: 14, outline: "none", ...font,
          }}
        />
        {isPass && (
          <div onClick={() => setShow((s) => !s)} style={{ position: "absolute", right: 14, top: 13, cursor: "pointer", color: C.gray }}>
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </div>
        )}
      </div>
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, marginBottom: 10 }}>
          <AlertCircle size={12} color={C.red} />
          <div style={{ fontSize: 11, color: C.red, ...font }}>{error}</div>
        </div>
      )}
    </div>
  );
}

export function TopBar({ title, onBack, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 4px 18px" }}>
      <div
        onClick={onBack}
        style={{
          width: 36, height: 36, borderRadius: 10, background: onBack ? C.card : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: onBack ? "pointer" : "default",
        }}
      >
        {onBack && <ChevronLeft size={19} color={C.white} />}
      </div>
      <div style={{ fontSize: 15.5, fontWeight: 600, color: C.white, ...font }}>{title}</div>
      <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>{right}</div>
    </div>
  );
}

export function Stepper({ steps, active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 22, padding: "0 2px" }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: i <= active ? C.red : C.card,
                border: i === active ? `2px solid ${C.red}` : `1px solid ${C.border}`,
                color: C.white, fontSize: 11, fontWeight: 600,
              }}
            >
              {i + 1}
            </div>
            <div style={{ fontSize: 9.5, color: i <= active ? C.white : C.grayDim, ...font }}>{s}</div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 1, background: i < active ? C.red : C.border, margin: "0 4px 16px" }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function GradCard({ grad = ["#333", "#0a0a0a"], children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: `linear-gradient(150deg, ${grad[0]}, ${grad[1]})`,
        borderRadius: 16, position: "relative", overflow: "hidden", ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ProgressRing({ pct }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} stroke={C.border} strokeWidth="10" fill="none" />
      <circle
        cx="70" cy="70" r={r} stroke={C.red} strokeWidth="10" fill="none"
        strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} strokeLinecap="round"
        transform="rotate(-90 70 70)" style={{ transition: "stroke-dashoffset 0.3s" }}
      />
      <text x="70" y="76" textAnchor="middle" fill={C.white} fontSize="22" fontWeight="700" fontFamily="Poppins">
        {pct}%
      </text>
    </svg>
  );
}

export function BottomNav({ active, onNavigate }) {
  const items = [
    { key: "home", icon: Home, label: "Home" },
    { key: "projects", icon: FolderOpen, label: "Projects" },
    { key: "create", icon: Plus, label: "" },
    { key: "templates", icon: LayoutTemplate, label: "Templates" },
    { key: "profile", icon: User, label: "Profile" },
  ];
  return (
    <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", borderTop: `1px solid ${C.border}`, padding: "10px 6px", background: C.panel }}>
      {items.map((it) => {
        const isActive = active === it.key;
        if (it.key === "create") {
          return (
            <div
              key={it.key} onClick={() => onNavigate("create")}
              style={{
                width: 46, height: 46, borderRadius: "50%", background: C.red, display: "flex",
                alignItems: "center", justifyContent: "center", cursor: "pointer", marginTop: -22,
                boxShadow: "0 4px 14px rgba(255,26,26,0.4)",
              }}
            >
              <Plus size={22} color={C.white} />
            </div>
          );
        }
        return (
          <div key={it.key} onClick={() => onNavigate(it.key)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", minWidth: 44 }}>
            <it.icon size={20} color={isActive ? C.red : C.grayDim} />
            <div style={{ fontSize: 9.5, color: isActive ? C.red : C.grayDim, ...font }}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export function ConfirmOverlay({ data, onClose }) {
  if (!data) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360, background: C.card, borderRadius: 18, padding: 22, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.white, marginBottom: 8, ...font }}>{data.title}</div>
        <div style={{ fontSize: 12.5, color: C.gray, marginBottom: 20, lineHeight: 1.55, ...font }}>{data.message}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          </div>
          <div style={{ flex: 1 }}>
            <PrimaryButton
              onClick={() => { data.onConfirm(); onClose(); }}
              style={data.danger ? { background: "#C4130F" } : {}}
            >
              {data.confirmLabel || "Confirm"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ToastBubble({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 40px)",
        maxWidth: 380, background: "#1e1e1e", border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 16px",
        fontSize: 12, color: C.white, textAlign: "center", zIndex: 300, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", ...font,
      }}
    >
      {message}
    </div>
  );
}

export function EmptyState({ text, actionLabel, onAction }) {
  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      <div style={{ fontSize: 13, color: C.gray, marginBottom: 14, ...font }}>{text}</div>
      {actionLabel && (
        <div style={{ maxWidth: 220, margin: "0 auto" }}>
          <PrimaryButton onClick={onAction}>{actionLabel}</PrimaryButton>
        </div>
      )}
    </div>
  );
}

export { ChevronRight };
