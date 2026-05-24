"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code2,
  ExternalLink,
  FileCode2,
  Star,
  Trash2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Job {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  fileName: string | null;
  createdAt: string | Date;
  isSaved: boolean;
  charCount: number;
}

interface DashboardTabsProps {
  initialRecentJobs: Job[];
  initialSavedJobs: Job[];
}

export function DashboardTabs({ initialRecentJobs, initialSavedJobs }: DashboardTabsProps) {
  const [recentJobs, setRecentJobs] = useState<Job[]>(initialRecentJobs);
  const [savedJobs, setSavedJobs] = useState<Job[]>(initialSavedJobs);
  const [activeTab, setActiveTab] = useState<"recent" | "saved">("recent");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const toggleBookmark = async (jobId: string, currentSaved: boolean) => {
    setLoadingId(jobId);
    try {
      const response = await fetch("/api/translate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, isSaved: !currentSaved }),
      });

      if (response.ok) {
        const updatedJob = await response.json();
        
        // Ensure createdAt is parsed properly
        const parsedJob = {
          ...updatedJob,
          createdAt: new Date(updatedJob.createdAt)
        };

        // Update in recentJobs
        setRecentJobs(prev =>
          prev.map(job => (job.id === jobId ? { ...job, isSaved: !currentSaved } : job))
        );

        // Update in savedJobs
        if (!currentSaved) {
          // It was not saved, now it is saved, so add it
          setSavedJobs(prev => {
            if (prev.some(j => j.id === jobId)) return prev;
            return [parsedJob, ...prev];
          });
        } else {
          // It was saved, now it is unsaved, so remove it
          setSavedJobs(prev => prev.filter(job => job.id !== jobId));
        }
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this translation job?")) return;
    setLoadingId(jobId);
    try {
      const response = await fetch(`/api/translate?id=${jobId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRecentJobs(prev => prev.filter(job => job.id !== jobId));
        setSavedJobs(prev => prev.filter(job => job.id !== jobId));
      }
    } catch (error) {
      console.error("Failed to delete job:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const activeJobs = activeTab === "recent" ? recentJobs : savedJobs;

  return (
    <div className="space-y-4">
      {/* Tabs Header */}
      <div className="flex border-b border-zinc-800/60 pb-px">
        <button
          onClick={() => setActiveTab("recent")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "recent"
              ? "border-indigo-500 text-white font-semibold"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Recent Activity
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "saved"
              ? "border-indigo-500 text-white font-semibold"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <span>Saved Projects</span>
          {savedJobs.length > 0 && (
            <span className="text-[10px] bg-indigo-600/30 text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">
              {savedJobs.length}
            </span>
          )}
        </button>
      </div>

      {/* Tabs Content */}
      <div className="space-y-4 pt-2">
        {activeJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-zinc-800/80 rounded-xl space-y-3 bg-zinc-950/20">
            <FileCode2 className="h-10 w-10 text-zinc-600" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-300">
                {activeTab === "recent" ? "No translations yet" : "No saved projects yet"}
              </p>
              <p className="text-xs text-zinc-500 max-w-xs">
                {activeTab === "recent"
                  ? "Translate some code snippets to populate your recent activity."
                  : "Star important translation jobs to keep them bookmarked here for quick access."}
              </p>
            </div>
            {activeTab === "recent" && (
              <Link href="/translate">
                <Button variant="secondary" size="sm" className="cursor-pointer">
                  Create Translation
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {activeJobs.map((job) => (
              <div
                key={job.id}
                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 group transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800/60 flex items-center justify-center shrink-0">
                    <Code2 className="h-4.5 w-4.5 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">
                      {job.fileName ? `File: ${job.fileName}` : "Code Snippet translation"}
                    </p>
                    <p className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-400">
                        {job.sourceLanguage.toUpperCase()}
                      </span>
                      <span>&rarr;</span>
                      <span className="font-mono bg-indigo-950/40 text-indigo-400 px-1 py-0.5 rounded font-bold">
                        {job.targetLanguage.toUpperCase()}
                      </span>
                      <span className="hidden sm:inline-block font-mono bg-zinc-900/60 px-1 py-0.5 rounded text-zinc-500">
                        {job.charCount} chars
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline-block">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>

                  {/* Bookmark Star Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loadingId === job.id}
                    onClick={() => toggleBookmark(job.id, job.isSaved)}
                    className="h-8 w-8 p-0 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/5 cursor-pointer rounded-lg border border-transparent hover:border-amber-500/10"
                    title={job.isSaved ? "Remove bookmark" : "Save project"}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        job.isSaved ? "fill-amber-400 text-amber-400" : ""
                      }`}
                    />
                  </Button>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loadingId === job.id}
                    onClick={() => deleteJob(job.id)}
                    className="h-8 w-8 p-0 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 cursor-pointer rounded-lg border border-transparent hover:border-rose-500/10"
                    title="Delete job from history"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <Link href={`/history#${job.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 gap-1 text-xs hover:bg-indigo-600/5 hover:text-white border-zinc-800 hover:border-indigo-500/30"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
