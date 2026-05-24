"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Code2,
  LayoutDashboard,
  RefreshCw,
  History as HistoryIcon,
  CreditCard,
  LogOut,
  Sparkles,
  Menu,
  X,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MobileNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  credits: number;
  signOutAction: () => Promise<void>;
}

export function MobileNav({ user, credits, signOutAction }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer when pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navLinks = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/translate", label: "AI Translator", icon: RefreshCw },
    { href: "/history", label: "Translation History", icon: HistoryIcon },
    { href: "/profile", label: "User Profile", icon: User },
    { href: "/billing", label: "Billing & Plans", icon: CreditCard },
  ];

  return (
    <>
      {/* Menu Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="md:hidden h-9 w-9 p-0 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 bg-zinc-950/40 cursor-pointer"
        title="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Drawer Overlay (Backdrop) */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer Content */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-72 max-w-[80vw] bg-zinc-950 border-r border-zinc-800/80 z-50 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Header */}
          <div className="h-16 px-6 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-indigo-600 flex items-center justify-center">
                <Code2 className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                CodeMorphix
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Credits in mobile drawer */}
          <div className="p-4 border-b border-zinc-800/40">
            <Badge variant="primary" glow className="w-full py-2 px-3 flex items-center justify-center gap-1.5 text-xs font-mono">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Credits: <strong className="text-white">{credits}</strong> left</span>
            </Badge>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 py-6 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "text-white bg-indigo-600/10 border border-indigo-500/20"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-indigo-400" : ""}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User Avatar"}
                className="h-9 w-9 rounded-full border border-zinc-800"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-indigo-950 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-zinc-200 truncate">{user.name || "Developer"}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>

          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
