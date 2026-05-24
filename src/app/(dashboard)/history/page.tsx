import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { HistoryClient } from "./history-client";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const jobs = await db.translationJob.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  // Map to the client component type interface
  const formattedJobs = jobs.map((job: any) => ({
    id: job.id,
    sourceLanguage: job.sourceLanguage,
    targetLanguage: job.targetLanguage,
    sourceCode: job.sourceCode,
    translatedCode: job.translatedCode,
    explanation: job.explanation,
    fileName: job.fileName,
    charCount: job.charCount,
    createdAt: job.createdAt,
    isSaved: job.isSaved,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Translation History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review your past translations, code differences, and optimization logs.
        </p>
      </div>
      <HistoryClient initialJobs={formattedJobs} />
    </div>
  );
}
