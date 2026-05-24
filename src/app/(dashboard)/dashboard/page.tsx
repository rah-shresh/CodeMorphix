import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  Code2,
  Zap,
  ArrowRight,
  History,
  FileCode2,
  Sparkles,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const user = session.user;
  const userId = user.id;

  // 1. Fetch total translation count
  const totalTranslations = await db.translationJob.count({
    where: { userId }
  });

  // 2. Fetch recent jobs (limit 5)
  const recentJobsRaw = await db.translationJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  // 3. Fetch saved jobs (limit 5)
  const savedJobsRaw = await db.translationJob.findMany({
    where: { userId, isSaved: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  // Convert dates to ISO strings for safe serialization to Client Component
  const recentJobs = recentJobsRaw.map((job: any) => ({
    id: job.id,
    sourceLanguage: job.sourceLanguage,
    targetLanguage: job.targetLanguage,
    fileName: job.fileName,
    createdAt: job.createdAt.toISOString(),
    isSaved: job.isSaved,
    charCount: job.charCount
  }));

  const savedJobs = savedJobsRaw.map((job: any) => ({
    id: job.id,
    sourceLanguage: job.sourceLanguage,
    targetLanguage: job.targetLanguage,
    fileName: job.fileName,
    createdAt: job.createdAt.toISOString(),
    isSaved: job.isSaved,
    charCount: job.charCount
  }));

  // 4. Fetch language distribution stats
  const rawLanguageStats = await db.translationJob.groupBy({
    by: ["targetLanguage"],
    where: { userId },
    _count: {
      id: true
    }
  });

  const totalTargetCount = rawLanguageStats.reduce((acc: any, curr: any) => acc + curr._count.id, 0);

  const languageStats = rawLanguageStats.map(stat => {
    const lang = stat.targetLanguage.toLowerCase();
    const count = stat._count.id;
    const percentage = totalTargetCount > 0 ? Math.round((count / totalTargetCount) * 100) : 0;
    return {
      language: lang,
      count,
      percentage
    };
  }).sort((a, b) => b.count - a.count);

  const languageColors: Record<string, string> = {
    javascript: "bg-amber-500",
    typescript: "bg-blue-500",
    python: "bg-sky-500",
    java: "bg-red-500",
    c: "bg-zinc-400",
    cpp: "bg-purple-500",
    go: "bg-cyan-500",
    rust: "bg-orange-500",
  };

  const getLanguageLabel = (lang: string) => {
    if (lang === "cpp") return "C++";
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-transparent border border-indigo-500/10 p-6 md:p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/10 rounded-full blur-[60px] -z-10"></div>
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back, <span className="text-indigo-400">{user.name || "Developer"}</span>!
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            You are ready to translate code. Paste legacy snippets, upload zip files, and see immediate semantics explanations.
          </p>
        </div>
        <Link href="/translate">
          <Button variant="primary" className="shadow-lg shadow-indigo-600/20 cursor-pointer shrink-0">
            Start New Translation <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Available Credits</CardTitle>
            <Zap className="h-4.5 w-4.5 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold font-mono">{user.credits ?? 20}</div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <span>Free package active</span> &middot; 
              <Link href="/billing" className="text-indigo-400 hover:text-indigo-300 font-medium">Get more</Link>
            </p>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total Translations</CardTitle>
            <History className="h-4.5 w-4.5 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold font-mono">{totalTranslations}</div>
            <p className="text-xs text-muted-foreground mt-1.5">Across all default programming languages</p>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Subscription Tier</CardTitle>
            <Code2 className="h-4.5 w-4.5 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold flex items-center gap-2">
              <span>{user.stripeSubscriptionId ? "Developer Pro" : "Free Trial"}</span>
              <Badge variant={user.stripeSubscriptionId ? "success" : "secondary"}>
                {user.stripeSubscriptionId ? "Active" : "Free"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {user.stripeSubscriptionId ? "Billed monthly via Stripe" : "Upgrade to unlock large file & ZIP translation"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Dynamic Activity and Saved Projects Tabs */}
        <Card glass className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Activity Dashboard</CardTitle>
            <CardDescription>Track and manage your recent translation jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardTabs initialRecentJobs={recentJobs} initialSavedJobs={savedJobs} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Visual Language Statistics */}
          <Card glass>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-400" />
                Language Metrics
              </CardTitle>
              <CardDescription>Distribution of target languages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {languageStats.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No stats available yet. Complete your first translation.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {languageStats.map(stat => {
                    const barColor = languageColors[stat.language] || "bg-zinc-600";
                    return (
                      <div key={stat.language} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-zinc-300">
                            {getLanguageLabel(stat.language)}
                          </span>
                          <span className="text-zinc-500 font-mono">
                            {stat.count} ({stat.percentage}%)
                          </span>
                        </div>
                        {/* Progress Bar Container */}
                        <div className="h-2 w-full bg-zinc-900 border border-zinc-800/40 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor} rounded-full transition-all duration-500`}
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Info Guides */}
          <Card glass className="h-fit">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-zinc-300">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs leading-relaxed text-zinc-400">
              <div className="space-y-1">
                <p className="font-semibold text-indigo-400">1. Paste Clean Snippets</p>
                <p>For optimal results, ensure source code compiles and imports are clearly stated. AI maps semantics directly.</p>
              </div>
              
              <div className="space-y-1">
                <p className="font-semibold text-indigo-400">2. Star Projects</p>
                <p>Star any translation in your history to display it under the "Saved Projects" tab for easy code reference.</p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-indigo-400">3. Review Explanations</p>
                <p>Every translation has step-by-step semantic explanations highlighting cross-language syntax mapping.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
