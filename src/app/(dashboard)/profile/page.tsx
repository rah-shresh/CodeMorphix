import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  User,
  Mail,
  Calendar,
  Zap,
  Shield,
  BarChart3,
  Code,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Retrieve user full details
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      credits: true,
      stripeSubscriptionId: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Aggregate statistics
  const totalJobs = await db.translationJob.count({
    where: { userId },
  });

  const charAggregate = await db.translationJob.aggregate({
    where: { userId },
    _sum: {
      charCount: true,
    },
  });

  const totalChars = charAggregate._sum.charCount ?? 0;
  const avgChars = totalJobs > 0 ? Math.round(totalChars / totalJobs) : 0;

  // Formatting char count for clean display (e.g., 1.5k)
  const formatCharCount = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  const accountAgeDays = Math.max(
    1,
    Math.ceil((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          User Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings, view usage analytics, and check credit balances.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column - User profile info */}
        <div className="md:col-span-1 space-y-6">
          <Card glass className="flex flex-col items-center p-6 text-center">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User Avatar"}
                className="h-24 w-24 rounded-full border-2 border-indigo-500/30 p-1"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-indigo-950/60 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-3xl shadow-inner">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
            )}

            <h2 className="text-xl font-bold mt-4 text-foreground truncate max-w-full">
              {user.name || "Developer"}
            </h2>
            <p className="text-xs text-zinc-500 truncate max-w-full mb-6">
              {user.email}
            </p>

            <div className="w-full border-t border-zinc-800/60 pt-4 space-y-3.5 text-left text-xs">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Mail className="h-4 w-4 text-indigo-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Calendar className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Shield className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Account Status: </span>
                <Badge variant={user.stripeSubscriptionId ? "success" : "secondary"} className="text-[10px] py-0 px-1.5">
                  {user.stripeSubscriptionId ? "PRO" : "FREE"}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column - Plan & Usage Stats */}
        <div className="md:col-span-2 space-y-6">
          {/* Subscription plan details */}
          <Card glass>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg font-bold">Billing & Resources</CardTitle>
                <CardDescription>Your current subscription tier details</CardDescription>
              </div>
              <Zap className="h-5 w-5 text-indigo-400" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {user.stripeSubscriptionId ? "Developer Pro Plan" : "Free Trial Account"}
                    </span>
                    <Badge variant={user.stripeSubscriptionId ? "primary" : "secondary"}>
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user.stripeSubscriptionId 
                      ? "Unrestricted ZIP file translations and large code volumes."
                      : "Limit of 20 translation requests total. Upgrade to remove limits."}
                  </p>
                </div>
                {!user.stripeSubscriptionId && (
                  <Link href="/billing" className="w-full sm:w-auto shrink-0">
                    <Button variant="primary" size="sm" className="w-full gap-1 shadow-md shadow-indigo-600/10 cursor-pointer">
                      Upgrade <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/20 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Remaining Credits</span>
                  <div className="text-2xl font-mono font-black text-indigo-400 mt-1">{user.credits}</div>
                </div>
                <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/20 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Account Age</span>
                  <div className="text-2xl font-mono font-black text-indigo-400 mt-1">
                    {accountAgeDays} {accountAgeDays === 1 ? "day" : "days"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics cards */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Usage Analytics</CardTitle>
              <CardDescription>Aggregate metrics of your translation history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3.5 p-4 rounded-xl border border-zinc-800/40 bg-zinc-950/10">
                  <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400">
                    <Layers className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">Total Jobs</span>
                    <span className="text-lg font-bold font-mono text-zinc-200">{totalJobs}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-4 rounded-xl border border-zinc-800/40 bg-zinc-950/10">
                  <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400">
                    <Code className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">Code Volume</span>
                    <span className="text-lg font-bold font-mono text-zinc-200">{formatCharCount(totalChars)} chars</span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-4 rounded-xl border border-zinc-800/40 bg-zinc-950/10">
                  <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400">
                    <BarChart3 className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">Avg Size</span>
                    <span className="text-lg font-bold font-mono text-zinc-200">{avgChars} chars</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
