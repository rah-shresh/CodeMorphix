import React from "react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Code2,
  LayoutDashboard,
  RefreshCw,
  History as HistoryIcon,
  CreditCard,
  LogOut,
  Sparkles,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const user = session.user;
  const credits = user.credits ?? 20;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border/40 bg-zinc-950/40 backdrop-blur-md hidden md:flex flex-col">
        {/* Sidebar Header */}
        <div className="h-16 px-6 border-b border-border/40 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded bg-indigo-600 flex items-center justify-center">
            <Code2 className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            CodeMorphix Panel
          </span>
        </div>

        {/* Sidebar Navigation Links */}
        <SidebarNav />

        {/* Sidebar Footer (User details and Sign Out) */}
        <div className="p-4 border-t border-border/40 bg-zinc-950/60 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User Avatar"}
                className="h-9 w-9 rounded-full border border-border"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-indigo-950 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-foreground truncate">{user.name || "Developer"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
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
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border/40 px-6 flex items-center justify-between bg-zinc-950/20 backdrop-blur-md">
          {/* Mobile menu trigger / Brand */}
          <div className="flex items-center gap-3 md:hidden">
            <MobileNav
              user={{
                name: user.name,
                email: user.email,
                image: user.image,
              }}
              credits={credits}
              signOutAction={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            />
            <span className="font-bold text-sm bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">CodeMorphix</span>
          </div>

          {/* Spacer for Desktop */}
          <div className="hidden md:block"></div>

          {/* Credits Display & Profile & ThemeToggle */}
          <div className="flex items-center gap-4">
            <Badge variant="primary" glow className="hidden sm:flex py-1 px-3 items-center gap-1.5 text-xs font-mono">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Credits: <strong className="text-white">{credits}</strong> left</span>
            </Badge>

            <ThemeToggle />

            {/* User Profile Avatar Link on Desktop */}
            <Link
              href="/profile"
              className="hidden md:block hover:opacity-80 transition-opacity"
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User Avatar"}
                  className="h-8 w-8 rounded-full border border-border"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-indigo-950 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-semibold text-xs">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Dynamic Dashboard Page Wrapper */}
        <main className="flex-1 overflow-auto p-6 md:p-10 relative">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] -z-10"></div>
          {children}
        </main>
      </div>
    </div>
  );
}
