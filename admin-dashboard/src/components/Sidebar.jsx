import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, DollarSign, Receipt, Sparkles, CreditCard,
  FolderOpen, TrendingUp, Bell, Settings, FileClock, LogOut,
} from "lucide-react";
import { signOut } from "../lib/supabaseClient";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/users", icon: Users, label: "User Management" },
  { to: "/revenue", icon: DollarSign, label: "Revenue & Profit" },
  { to: "/expenses", icon: Receipt, label: "Expenses" },
  { to: "/ai-usage", icon: Sparkles, label: "AI Usage" },
  { to: "/subscriptions", icon: CreditCard, label: "Subscriptions" },
  { to: "/files", icon: FolderOpen, label: "File Management" },
  { to: "/analytics", icon: TrendingUp, label: "Analytics" },
  { to: "/notifications", icon: Bell, label: "Notifications" },
  { to: "/settings", icon: Settings, label: "App Settings" },
  { to: "/logs", icon: FileClock, label: "Logs" },
];

export default function Sidebar() {
  return (
    <div className="w-64 shrink-0 bg-brand-panel border-r border-brand-border h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-6">
        <div className="text-white font-semibold tracking-widest text-lg">
          ANIM<span className="text-brand-red">AI</span>
        </div>
        <div className="text-[10px] text-gray-500 mt-1">ADMIN DASHBOARD</div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors ${
                isActive ? "bg-brand-red text-white" : "text-gray-400 hover:bg-brand-card hover:text-white"
              }`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-brand-border">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-brand-card hover:text-white"
        >
          <LogOut size={16} /> Log Out
        </button>
      </div>
    </div>
  );
}
