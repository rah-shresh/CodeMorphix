"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Code2,
  Copy,
  Check,
  Download,
  Trash2,
  Calendar,
  Split,
  Eye,
  Info,
  ChevronRight,
  RefreshCw,
  Folder,
  Star,
  Edit2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CodeEditor, CodeDiffEditor } from "@/components/editor/monaco-editor";

interface TranslationJob {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceCode: string;
  translatedCode: string;
  explanation: string | null;
  fileName: string | null;
  charCount: number;
  createdAt: Date;
  isSaved: boolean;
}

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  java: "java",
  c: "c",
  cpp: "cpp",
  go: "go",
  rust: "rs",
};

export function HistoryClient({ initialJobs }: { initialJobs: TranslationJob[] }) {
  const [jobs, setJobs] = useState<TranslationJob[]>(initialJobs);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    initialJobs.length > 0 ? initialJobs[0].id : null
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"split" | "diff">("split");

  // Actions states
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editFileName, setEditFileName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Sync hash on mount (to scroll/select the job clicked from the dashboard)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hashId = window.location.hash.substring(1);
      const matched = jobs.find((j) => j.id === hashId);
      if (matched) {
        setSelectedJobId(matched.id);
      }
    }
  }, [jobs]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;

  useEffect(() => {
    if (selectedJob) {
      setEditFileName(selectedJob.fileName || "");
      setEditCode(selectedJob.translatedCode);
      setIsEditing(false);
    }
  }, [selectedJobId]);

  // Filter logic
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      (job.fileName && job.fileName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      job.sourceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.translatedCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSource = sourceFilter === "all" || job.sourceLanguage === sourceFilter;
    const matchesTarget = targetFilter === "all" || job.targetLanguage === targetFilter;

    return matchesSearch && matchesSource && matchesTarget;
  });

  const handleCopyCode = () => {
    if (!selectedJob) return;
    navigator.clipboard.writeText(selectedJob.translatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    if (!selectedJob) return;
    
    let downloadName = "translated_code";
    const ext = LANGUAGE_EXTENSIONS[selectedJob.targetLanguage] || "txt";

    if (selectedJob.fileName) {
      const baseName = selectedJob.fileName.substring(0, selectedJob.fileName.lastIndexOf(".")) || selectedJob.fileName;
      downloadName = `translated_${baseName}`;
    }

    const blob = new Blob([selectedJob.translatedCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${downloadName}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm("Are you sure you want to delete this translation record from history?")) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/translate?id=${id}`, {
        method: "DELETE",
      });
 
      if (!res.ok) {
        throw new Error("Failed to delete the translation record.");
      }
 
      const updatedJobs = jobs.filter((j) => j.id !== id);
      setJobs(updatedJobs);
      
      if (selectedJobId === id) {
        setSelectedJobId(updatedJobs.length > 0 ? updatedJobs[0].id : null);
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting record");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleSave = async (id: string) => {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;

    try {
      const newSavedState = !job.isSaved;
      const res = await fetch("/api/translate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isSaved: newSavedState }),
      });

      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) => (j.id === id ? { ...j, isSaved: newSavedState } : j))
        );
      } else {
        console.error("Failed to toggle save status");
      }
    } catch (err) {
      console.error("Error toggling save status", err);
    }
  };

  const handleStartEdit = () => {
    if (!selectedJob) return;
    setEditFileName(selectedJob.fileName || "");
    setEditCode(selectedJob.translatedCode);
    setViewMode("split");
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedJob) return;

    setIsSavingEdit(true);
    try {
      const res = await fetch("/api/translate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedJob.id,
          fileName: editFileName || null,
          translatedCode: editCode,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save translation edits.");
      }

      const updatedJob = await res.json();
      setJobs((prev) =>
        prev.map((j) =>
          j.id === selectedJob.id
            ? {
                ...j,
                fileName: updatedJob.fileName,
                translatedCode: updatedJob.translatedCode,
              }
            : j
        )
      );
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving edit:", err);
      alert("Error saving your edits.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const renderMarkdownExplanation = (text: string) => {
    if (!text) return null;
    
    let html = text.replace(
      /^### (.*$)/gim,
      '<h4 class="text-indigo-400 font-bold mt-5 mb-2 text-sm uppercase tracking-wider flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>$1</h4>'
    );
    
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    
    html = html.replace(/`(.*?)`/g, '<code class="bg-zinc-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono text-xs border border-zinc-700/50">$1</code>');
    
    html = html.replace(/^\- (.*$)/gim, '<li class="text-zinc-300 ml-4 mb-2 text-sm leading-relaxed list-disc">$1</li>');

    const paragraphs = html.split("\n\n").map((p) => {
      if (p.trim().startsWith("<li")) {
        return `<ul class="space-y-1 my-2">${p}</ul>`;
      }
      return `<p class="text-zinc-300 text-sm leading-relaxed mb-3">${p}</p>`;
    });

    return (
      <div 
        className="space-y-2" 
        dangerouslySetInnerHTML={{ __html: paragraphs.join("") }} 
      />
    );
  };

  const getSourceLanguages = () => {
    const list = new Set(jobs.map((j) => j.sourceLanguage));
    return Array.from(list);
  };

  const getTargetLanguages = () => {
    const list = new Set(jobs.map((j) => j.targetLanguage));
    return Array.from(list);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
      {/* Left Column: Jobs List & Filters */}
      <div className="lg:col-span-4 flex flex-col h-[700px] border border-zinc-800 rounded-xl bg-zinc-950/20 overflow-hidden">
        
        {/* Filters Panel */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 space-y-3 shrink-0">
          <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white">
            <Search className="h-4 w-4 text-zinc-500 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search file names or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 p-0 text-xs text-white placeholder-zinc-500 focus:ring-0 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase font-semibold text-zinc-500">From</label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full bg-zinc-900 text-foreground border border-zinc-800 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none h-8 cursor-pointer mt-0.5"
              >
                <option value="all">All Source</option>
                {getSourceLanguages().map((lang) => (
                  <option key={lang} value={lang} className="capitalize">
                    {lang}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-semibold text-zinc-500">To</label>
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                className="w-full bg-zinc-900 text-foreground border border-zinc-800 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none h-8 cursor-pointer mt-0.5"
              >
                <option value="all">All Target</option>
                {getTargetLanguages().map((lang) => (
                  <option key={lang} value={lang} className="capitalize">
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Jobs List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              No matching translations found.
            </div>
          ) : (
            filteredJobs.map((job) => {
              const isSelected = selectedJobId === job.id;
              return (
                <button
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`flex flex-col text-left w-full p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600/10 border-indigo-500 text-white"
                      : "bg-zinc-900/20 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className="font-semibold text-xs truncate text-white flex items-center gap-1">
                      {job.fileName ? job.fileName : "Code Snippet"}
                      {job.isSaved && (
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                      )}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono shrink-0">
                      {job.charCount} chars
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-mono capitalize">
                      {job.sourceLanguage}
                    </span>
                    <span className="text-[10px] text-zinc-500">&rarr;</span>
                    <span className="text-[10px] bg-indigo-950/40 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono text-indigo-400 font-semibold capitalize">
                      {job.targetLanguage}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 text-[10px] text-zinc-500">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(job.createdAt).toLocaleString()}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Code Viewer Details */}
      <div className="lg:col-span-8 flex flex-col h-[700px] border border-zinc-800 rounded-xl bg-zinc-950/20 overflow-hidden">
        {selectedJob ? (
          <>
            {/* Header Pane */}
            <div className="h-14 px-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40 shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1 mr-4">
                {isEditing ? (
                  <div className="flex items-center gap-2 w-full max-w-xs">
                    <input
                      type="text"
                      value={editFileName}
                      onChange={(e) => setEditFileName(e.target.value)}
                      placeholder="filename.ext"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                ) : (
                  <>
                    <span className="text-xs font-semibold text-white tracking-wide uppercase truncate">
                      {selectedJob.fileName ? selectedJob.fileName : "Snippet Details"}
                    </span>
                    <span className="text-[9px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-mono capitalize text-zinc-400">
                      {selectedJob.sourceLanguage} &rarr; {selectedJob.targetLanguage}
                    </span>
                  </>
                )}
              </div>

              {/* View Control & Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                {!isEditing && (
                  <>
                    <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                      <button
                        onClick={() => setViewMode("split")}
                        className={`p-1 px-2.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                          viewMode === "split"
                            ? "bg-zinc-850 text-white"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Code
                      </button>
                      <button
                        onClick={() => setViewMode("diff")}
                        className={`p-1 px-2.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                          viewMode === "diff"
                            ? "bg-zinc-850 text-white"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Diff
                      </button>
                    </div>

                    <div className="h-6 w-px bg-zinc-800"></div>
                  </>
                )}

                <div className="flex items-center gap-1.5">
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={isSavingEdit}
                        className="h-8 text-[11px] text-emerald-400 hover:text-emerald-300 border border-zinc-850 hover:bg-emerald-950/20 cursor-pointer flex items-center gap-1"
                      >
                        {isSavingEdit ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        disabled={isSavingEdit}
                        className="h-8 text-[11px] text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:bg-zinc-900 cursor-pointer"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleStartEdit}
                        className="h-8 text-[11px] text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-900 cursor-pointer"
                        title="Edit Code & Filename"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>

                      {/* Bookmark Toggle (Star) */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleSave(selectedJob.id)}
                        className={`h-8 text-[11px] border border-zinc-800 hover:bg-zinc-900 cursor-pointer transition ${
                          selectedJob.isSaved ? "text-amber-400 hover:text-amber-300" : "text-zinc-400 hover:text-white"
                        }`}
                        title={selectedJob.isSaved ? "Unsave Project" : "Save Project"}
                      >
                        <Star className={`h-3.5 w-3.5 ${selectedJob.isSaved ? "fill-amber-400 text-amber-400" : ""}`} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyCode}
                        className="h-8 text-[11px] text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-900 cursor-pointer"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDownloadCode}
                        className="h-8 text-[11px] text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-900 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteJob(selectedJob.id)}
                        disabled={isDeleting}
                        className="h-8 text-[11px] text-rose-400 hover:text-rose-300 border border-zinc-800 hover:bg-rose-500/5 cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Split Editor or Diff Viewer */}
            <div className="flex-1 min-h-0 relative grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
              {viewMode === "diff" ? (
                <div className="col-span-2 h-full">
                  <CodeDiffEditor
                    original={selectedJob.sourceCode}
                    modified={selectedJob.translatedCode}
                    originalLanguage={selectedJob.sourceLanguage}
                    modifiedLanguage={selectedJob.targetLanguage}
                    height="100%"
                  />
                </div>
              ) : (
                <>
                  {/* Original Code */}
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="px-3 py-1 bg-zinc-950/60 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider shrink-0 font-mono">
                      Source Code ({selectedJob.sourceLanguage})
                    </div>
                    <div className="flex-1 min-h-0">
                      <CodeEditor
                        value={selectedJob.sourceCode}
                        language={selectedJob.sourceLanguage}
                        readOnly={true}
                        height="100%"
                      />
                    </div>
                  </div>

                  {/* Translated Code */}
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="px-3 py-1 bg-zinc-950/60 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider shrink-0 font-mono flex items-center justify-between">
                      <span>Translated Code ({selectedJob.targetLanguage})</span>
                      {isEditing && (
                        <span className="text-[9px] text-emerald-400 font-medium lowercase animate-pulse mr-1">
                          [editing mode]
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-h-0">
                      <CodeEditor
                        value={isEditing ? editCode : selectedJob.translatedCode}
                        onChange={(val) => {
                          if (isEditing) setEditCode(val || "");
                        }}
                        language={selectedJob.targetLanguage}
                        readOnly={!isEditing}
                        height="100%"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Explanations section */}
            {selectedJob.explanation && (
              <div className="border-t border-zinc-800 bg-zinc-950/30 max-h-[220px] overflow-y-auto p-4 custom-scrollbar shrink-0">
                <div className="flex items-center gap-1.5 mb-2 text-indigo-400">
                  <Info className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">AI Insights & Optimization Logs</span>
                </div>
                {renderMarkdownExplanation(selectedJob.explanation)}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-3">
            <Code2 className="h-10 w-10 text-zinc-700" />
            <p className="text-xs">No translation record selected.</p>
          </div>
        )}
      </div>
    </div>
  );
}
