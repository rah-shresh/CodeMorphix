"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  RefreshCw,
  History as HistoryIcon,
  User,
  CreditCard
} from "lucide-react";

export function SidebarNav() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/translate", label: "AI Translator", icon: RefreshCw },
    { href: "/history", label: "Translation History", icon: HistoryIcon },
    { href: "/profile", label: "User Profile", icon: User },
    { href: "/billing", label: "Billing & Plans", icon: CreditCard },
  ];

  return (
    <nav className="flex-1 px-4 py-6 space-y-1.5">
      {navLinks.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
              isActive
                ? "text-white bg-zinc-900/60 border border-border/40 shadow-[0_0_12px_rgba(99,102,241,0.06)] glow-indigo"
                : "text-muted-foreground hover:text-foreground hover:bg-zinc-950/20"
            }`}
          >
            {/* Left Indicator bar */}
            {isActive && (
              <span className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
            )}
            
            <Icon
              className={`h-4 w-4 shrink-0 transition-colors ${
                isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
              }`}
            />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
