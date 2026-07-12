import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { useAdminAuth } from "./context/AdminAuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/Users";
import Revenue from "./pages/Revenue";
import Expenses from "./pages/Expenses";
import AIUsage from "./pages/AIUsage";
import Subscriptions from "./pages/Subscriptions";
import FileManagement from "./pages/FileManagement";
import Analytics from "./pages/Analytics";
import NotificationsAdmin from "./pages/NotificationsAdmin";
import AppSettings from "./pages/AppSettings";
import Logs from "./pages/Logs";

function Shell({ children }) {
  const { isAuthenticated, loading } = useAdminAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen overflow-x-hidden">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Shell><Dashboard /></Shell>} />
      <Route path="/users" element={<Shell><UsersPage /></Shell>} />
      <Route path="/revenue" element={<Shell><Revenue /></Shell>} />
      <Route path="/expenses" element={<Shell><Expenses /></Shell>} />
      <Route path="/ai-usage" element={<Shell><AIUsage /></Shell>} />
      <Route path="/subscriptions" element={<Shell><Subscriptions /></Shell>} />
      <Route path="/files" element={<Shell><FileManagement /></Shell>} />
      <Route path="/analytics" element={<Shell><Analytics /></Shell>} />
      <Route path="/notifications" element={<Shell><NotificationsAdmin /></Shell>} />
      <Route path="/settings" element={<Shell><AppSettings /></Shell>} />
      <Route path="/logs" element={<Shell><Logs /></Shell>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
