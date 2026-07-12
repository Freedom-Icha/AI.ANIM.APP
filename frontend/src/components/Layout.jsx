import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BottomNav, ToastBubble, ConfirmOverlay } from "./ui";
import { useApp } from "../context/AppContext";
import { C, font } from "../theme";

const NAV_ROUTES = { home: "/home", projects: "/projects", templates: "/templates", profile: "/profile", create: "/create" };
const NAV_KEY_BY_PATH = { "/home": "home", "/projects": "projects", "/templates": "templates", "/profile": "profile" };

export default function Layout({ children, noPadding }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toastMsg, confirmData, closeConfirm } = useApp();

  const activeNavKey = NAV_KEY_BY_PATH[location.pathname];
  const showNav = Boolean(activeNavKey);

  return (
    <div
      style={{
        minHeight: "100vh", width: "100%", background: "#000", display: "flex",
        alignItems: "center", justifyContent: "center", padding: "24px 12px", ...font,
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 430, minHeight: "calc(100vh - 48px)", maxHeight: 880,
          background: C.bg, borderRadius: 32, border: `1px solid ${C.border}`,
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)", overflow: "hidden", position: "relative",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", padding: noPadding ? 0 : "16px 20px 14px" }}>{children}</div>
        {showNav && <BottomNav active={activeNavKey} onNavigate={(key) => navigate(NAV_ROUTES[key])} />}
        <ToastBubble message={toastMsg} />
        <ConfirmOverlay data={confirmData} onClose={closeConfirm} />
      </div>
    </div>
  );
}
