"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import JSZip from "jszip";
import {
  Code2,
  Upload,
  Copy,
  Check,
  Download,
  Sparkles,
  RefreshCw,
  AlertCircle,
  X,
  FileCode,
  Folder,
  ChevronRight,
  Split,
  Eye,
  Info,
  ChevronDown,
  Search,
  Star,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeEditor, CodeDiffEditor } from "@/components/editor/monaco-editor";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
];

const SOURCE_LANGUAGES = [
  { value: "auto", label: "Auto-detect" },
  ...LANGUAGES,
];

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

interface ZipFileEntry {
  path: string;
  name: string;
  isDir: boolean;
  contentPromise?: () => Promise<string>;
}

function getLanguageFromExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "py":
      return "python";
    case "java":
      return "java";
    case "cpp":
    case "cc":
    case "cxx":
    case "hpp":
    case "h":
      return "cpp";
    case "c":
      return "c";
    case "go":
      return "go";
    case "rs":
      return "rust";
    default:
      return "plaintext";
  }
}

export default function TranslatePage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Code state
  const [sourceCode, setSourceCode] = useState<string>("");
  const [translatedCode, setTranslatedCode] = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");
  const [jobId, setJobId] = useState<string>("");
  const [isSaved, setIsSaved] = useState<boolean>(false);
  
  // Settings state
  const [sourceLanguage, setSourceLanguage] = useState<string>("auto");
  const [targetLanguage, setTargetLanguage] = useState<string>("python");
  const [detectedLanguage, setDetectedLanguage] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [viewMode, setViewMode] = useState<"split" | "diff">("split");
  
  // File upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadType, setUploadType] = useState<"paste" | "upload">("paste");
  
  // ZIP explorer state
  const [zipFiles, setZipFiles] = useState<ZipFileEntry[]>([]);
  const [selectedZipPath, setSelectedZipPath] = useState<string>("");
  const [zipSearchQuery, setZipSearchQuery] = useState<string>("");
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<{
    isValid: boolean;
    errorLine?: number;
    errorMessage?: string;
    suggestedFix?: string;
  } | null>(null);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  interface ToastMessage {
    id: string;
    type: "success" | "error" | "info";
    message: string;
  }

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [retryType, setRetryType] = useState<"translate" | "execute" | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const parseAndSetError = (err: any, actionType: "translate" | "execute") => {
    // Log full error in console (developer mode)
    console.error("[Developer Mode - Gemini API Error Details]:", err);

    let friendlyMessage = "An unexpected error occurred. Please try again.";

    if (err instanceof Error) {
      const msg = err.message;
      try {
        const parsed = JSON.parse(msg);
        friendlyMessage = parsed.message || parsed.error || friendlyMessage;
      } catch {
        if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("limit")) {
          friendlyMessage = "Daily AI request limit reached. Please try again later.";
        } else if (msg.includes("API_KEY_INVALID") || msg.includes("API key") || msg.includes("configuration error")) {
          friendlyMessage = "AI service configuration error.";
        } else if (msg.includes("fetch failed") || msg.includes("network") || msg.includes("Connection issue") || msg.includes("connection")) {
          friendlyMessage = "Connection issue detected.";
        } else {
          friendlyMessage = msg;
        }
      }
    } else if (typeof err === "object" && err !== null) {
      friendlyMessage = err.message || err.error || friendlyMessage;
    } else if (typeof err === "string") {
      friendlyMessage = err;
    }

    setError(friendlyMessage);
    setRetryType(actionType);
    showToast(friendlyMessage, "error");
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const highlightMonacoError = (line: number, message: string) => {
    if (monacoRef.current && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const totalLines = model.getLineCount();
        const clampedLine = Math.min(Math.max(1, line), totalLines);
        
        monacoRef.current.editor.setModelMarkers(model, "syntax-validation", [
          {
            startLineNumber: clampedLine,
            endLineNumber: clampedLine,
            startColumn: 1,
            endColumn: model.getLineContent(clampedLine).length + 1,
            message: message,
            severity: monacoRef.current.MarkerSeverity.Error,
          },
        ]);
        
        editorRef.current.revealLineInCenter(clampedLine);
      }
    }
  };

  const clearMonacoMarkers = () => {
    if (monacoRef.current && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, "syntax-validation", []);
      }
    }
  };

  // Code execution & verification state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [consoleTab, setConsoleTab] = useState<"summary" | "source" | "target">("summary");
  const [consoleError, setConsoleError] = useState<string>("");
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  // Clear validation errors and markers when source code or language changes
  useEffect(() => {
    setValidationError(null);
    clearMonacoMarkers();
  }, [sourceCode, sourceLanguage]);

  // Fetch updated credits after translation
  const fetchCredits = async () => {
    try {
      const res = await fetch("/api/user/credits");
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
      }
    } catch (err) {
      console.error("Failed to fetch credits", err);
    }
  };
  
  // Auto-scroll terminal console output
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [executionResult, isExecuting, consoleTab]);

  // Execute Code and compare standard outputs
  const handleRunVerify = async () => {
    if (!sourceCode.trim()) {
      setError("Please write, paste, or upload some code to run.");
      return;
    }
    if (!translatedCode.trim()) {
      setError("No translated code found. Please translate your code first.");
      return;
    }

    setIsExecuting(true);
    setConsoleError("");
    setConsoleTab("summary");
    setExecutionResult(null);

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCode,
          sourceLanguage,
          targetCode: translatedCode,
          targetLanguage,
          fileName: selectedZipPath || fileName || undefined,
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.message || errorJson.error || "Failed to execute code.");
      }

      const result = await response.json();
      setExecutionResult(result);
      showToast("Code verification execution completed.", "success");
    } catch (err: any) {
      parseAndSetError(err, "execute");
      setConsoleError(err.message || "An unexpected error occurred during execution.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClearConsole = () => {
    setExecutionResult(null);
    setConsoleError("");
    setIsExecuting(false);
  };

  const handleCopyConsoleOutput = () => {
    if (!executionResult) return;
    
    let textToCopy = "";
    if (consoleTab === "summary") {
      textToCopy = `Verification Status: ${executionResult.status}\nSource Exit Code: ${executionResult.sourceResult.run.code}\nTarget Exit Code: ${executionResult.targetResult.run.code}`;
    } else if (consoleTab === "source") {
      textToCopy = (executionResult.sourceResult.compile?.stderr || "") + "\n" + executionResult.sourceResult.run.stdout + "\n" + executionResult.sourceResult.run.stderr;
    } else if (consoleTab === "target") {
      textToCopy = (executionResult.targetResult.compile?.stderr || "") + "\n" + executionResult.targetResult.run.stdout + "\n" + executionResult.targetResult.run.stderr;
    }
    
    navigator.clipboard.writeText(textToCopy.trim());
  };

  // Keyboard shortcut Ctrl+Enter to trigger Run & Verify
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (!isExecuting && !isTranslating && sourceCode.trim() && translatedCode.trim()) {
          e.preventDefault();
          handleRunVerify();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExecuting, isTranslating, sourceCode, translatedCode]);

  useEffect(() => {
    if (session?.user?.credits !== undefined) {
      setCredits(session.user.credits);
    }
  }, [session]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processUploadedFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processUploadedFile(files[0]);
    }
  };

  const processUploadedFile = async (file: File) => {
    setError("");
    const isZip = file.name.endsWith(".zip");

    if (isZip) {
      try {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        const entries: ZipFileEntry[] = [];

        for (const [path, entry] of Object.entries(loadedZip.files)) {
          entries.push({
            path,
            name: entry.name.split("/").pop() || entry.name,
            isDir: entry.dir,
            contentPromise: entry.dir ? undefined : () => entry.async("string"),
          });
        }

        setZipFiles(entries);
        setUploadType("upload");
        setSelectedZipPath("");
        setSourceCode("");
        setFileName(file.name);

        // Find first file that is not a folder and load it
        const firstFile = entries.find((e) => !e.isDir);
        if (firstFile && firstFile.contentPromise) {
          const content = await firstFile.contentPromise();
          setSourceCode(content);
          setSelectedZipPath(firstFile.path);
          const detectedLang = getLanguageFromExtension(firstFile.name);
          setSourceLanguage(detectedLang !== "plaintext" ? detectedLang : "auto");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to parse ZIP file. Please ensure it is a valid ZIP archive.");
      }
    } else {
      // Single file
      try {
        const text = await file.text();
        setSourceCode(text);
        setFileName(file.name);
        setUploadType("upload");
        setZipFiles([]);
        const detectedLang = getLanguageFromExtension(file.name);
        setSourceLanguage(detectedLang !== "plaintext" ? detectedLang : "auto");
      } catch (err) {
        console.error(err);
        setError("Failed to read file content.");
      }
    }
  };

  const clearUploadedFile = () => {
    setSourceCode("");
    setFileName("");
    setZipFiles([]);
    setSelectedZipPath("");
    setUploadType("paste");
    setSourceLanguage("auto");
    setDetectedLanguage("");
  };

  const parseStreamingTag = (text: string, tag: string): string => {
    const startTag = `<${tag}>`;
    const endTag = `</${tag}>`;
    const startIndex = text.indexOf(startTag);
    if (startIndex === -1) return "";

    const contentStart = startIndex + startTag.length;
    const endIndex = text.indexOf(endTag, contentStart);

    if (endIndex === -1) {
      return text.substring(contentStart);
    }
    return text.substring(contentStart, endIndex);
  };

  const handleTranslate = async () => {
    if (!sourceCode.trim()) {
      setError("Please write, paste, or upload some code to translate.");
      return;
    }
    if (credits !== null && credits <= 0 && !session?.user?.stripeSubscriptionId) {
      setError("You have run out of translation credits. Please purchase more credits or subscribe on the Billing tab.");
      return;
    }

    setValidationError(null);
    clearMonacoMarkers();
    setIsValidating(true);
    setError("");
    setTranslatedCode("");
    setExplanation("");
    setDetectedLanguage("");
    setJobId("");
    setIsSaved(false);

    try {
      const validateRes = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCode,
          sourceLanguage,
          fileName: selectedZipPath || fileName || undefined,
        }),
      });

      if (!validateRes.ok) {
        const errJson = await validateRes.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || "Failed to validate code.");
      }

      const validateData = await validateRes.json();
      if (!validateData.isValid) {
        setValidationError({
          isValid: false,
          errorLine: validateData.errorLine,
          errorMessage: validateData.errorMessage,
          suggestedFix: validateData.suggestedFix,
        });

        if (validateData.errorLine) {
          highlightMonacoError(validateData.errorLine, validateData.errorMessage);
        }
        setIsValidating(false);
        return; // Prevent translation if source code is invalid
      }
    } catch (err: any) {
      parseAndSetError(err, "translate");
      setIsValidating(false);
      return;
    } finally {
      setIsValidating(false);
    }

    setIsTranslating(true);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCode,
          sourceLanguage,
          targetLanguage,
          fileName: selectedZipPath || fileName || undefined,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Translation failed";
        try {
          const errorJson = await response.json();
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch {}
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to initialize response stream.");
      }

      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulatedText += decoder.decode(value, { stream: true });

        // Update streaming outputs
        const codeText = parseStreamingTag(accumulatedText, "translated_code");
        const explanationText = parseStreamingTag(accumulatedText, "explanation");
        const detectedLang = parseStreamingTag(accumulatedText, "source_language");

        if (codeText) {
          setTranslatedCode(codeText);
        } else {
          // If tags aren't parsed yet or didn't render properly, show raw text in output, but clean out job_id tag if present
          let cleanText = accumulatedText;
          if (cleanText.includes("<job_id>")) {
            cleanText = cleanText.split("<job_id>")[0];
          }
          setTranslatedCode(cleanText);
        }

        if (explanationText) {
          setExplanation(explanationText);
        }

        if (detectedLang) {
          setDetectedLanguage(detectedLang);
        }
      }

      // Check if we have a job_id after stream completes
      const jobMatch = accumulatedText.match(/<job_id>([\s\S]*?)<\/job_id>/i);
      if (jobMatch) {
        setJobId(jobMatch[1].trim());
      }

      // Refresh credits after successful translation
      await fetchCredits();
      showToast("Code translated successfully!", "success");
    } catch (err: any) {
      parseAndSetError(err, "translate");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLanguage === "auto") return;
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
  };

  const handleCopyCode = () => {
    if (!translatedCode) return;
    navigator.clipboard.writeText(translatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    if (!translatedCode) return;
    
    // Auto name file based on original file, or default name
    let downloadName = "translated_code";
    const ext = LANGUAGE_EXTENSIONS[targetLanguage] || "txt";

    if (fileName) {
      const baseName = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
      downloadName = `translated_${baseName}`;
    }

    const blob = new Blob([translatedCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${downloadName}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleToggleSave = async () => {
    if (!jobId) return;

    try {
      const newSavedState = !isSaved;
      const res = await fetch("/api/translate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, isSaved: newSavedState }),
      });

      if (res.ok) {
        setIsSaved(newSavedState);
      } else {
        console.error("Failed to toggle save status");
      }
    } catch (err) {
      console.error("Error toggling save status", err);
    }
  };

  // Simple custom markdown renderer
  const renderMarkdownExplanation = (text: string) => {
    if (!text) return null;
    
    // Replace headings (e.g. ### Headers)
    let html = text.replace(
      /^### (.*$)/gim,
      '<h4 class="text-indigo-400 font-bold mt-5 mb-2 text-sm uppercase tracking-wider flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>$1</h4>'
    );
    
    // Replace bold tags (**text**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    
    // Replace inline code block (`code`)
    html = html.replace(/`(.*?)`/g, '<code class="bg-zinc-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono text-xs border border-zinc-700/50">$1</code>');
    
    // Replace bullet points (- Item)
    html = html.replace(/^\- (.*$)/gim, '<li class="text-zinc-300 ml-4 mb-2 text-sm leading-relaxed list-disc">$1</li>');

    // Wrap multiple contiguous list items in an actual list if needed
    // Simple block paragraphs
    const paragraphs = html.split("\n\n").map((p, i) => {
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

  // Filter ZIP files based on query
  const filteredZipFiles = zipFiles.filter((file) =>
    file.path.toLowerCase().includes(zipSearchQuery.toLowerCase())
  );

  const displaySourceLang = sourceLanguage === "auto" 
    ? (detectedLanguage ? `Auto (${detectedLanguage})` : "Auto-detect") 
    : LANGUAGES.find((l) => l.value === sourceLanguage)?.label;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Code2 className="h-6 w-6 text-indigo-500" />
            AI Code Translator Workspace
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Translate individual code snippets or entire repositories in real-time.
          </p>
        </div>

        {/* View Mode & Translate Actions */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("split")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "split"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Split Editor
            </button>
            <button
              onClick={() => setViewMode("diff")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "diff"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Split className="h-3.5 w-3.5" />
              Diff View
            </button>
          </div>
        </div>
      </div>

      {/* Main Controls Panel */}
      <Card className="border-zinc-800 bg-zinc-950/40 backdrop-blur-md">
        <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-end gap-4">
          {/* Source Language Select */}
          <div className="w-full md:w-1/4">
            <Select
              label="Source Language"
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
            >
              {SOURCE_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value} className="bg-zinc-950 text-foreground">
                  {lang.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center pb-0.5 self-center md:self-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSwapLanguages}
              disabled={sourceLanguage === "auto" || isTranslating}
              className="h-10 w-10 p-0 rounded-full flex items-center justify-center shrink-0 border border-zinc-800 hover:bg-zinc-900 cursor-pointer"
              title={sourceLanguage === "auto" ? "Cannot swap with Auto-detect" : "Swap Languages"}
            >
              <RefreshCw className="h-4 w-4 text-zinc-400" />
            </Button>
          </div>

          {/* Target Language Select */}
          <div className="w-full md:w-1/4">
            <Select
              label="Target Language"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value} className="bg-zinc-950 text-foreground">
                  {lang.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Action Trigger Buttons */}
          <div className="w-full md:w-auto md:ml-auto flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <Button
              onClick={handleTranslate}
              isLoading={isTranslating || isValidating}
              disabled={isExecuting || isTranslating || isValidating}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 font-semibold px-6 h-10 shadow-lg shadow-indigo-600/20 active:scale-98 cursor-pointer gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isValidating ? "Validating Code..." : "Translate Code"}
            </Button>
            <Button
              onClick={handleRunVerify}
              isLoading={isExecuting}
              disabled={isTranslating || isValidating || !translatedCode}
              variant="secondary"
              className="w-full md:w-auto font-semibold px-6 h-10 border border-zinc-800 hover:bg-zinc-900 cursor-pointer gap-2"
            >
              <Play className="h-4 w-4 text-emerald-400" />
              Run & Verify Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Errors display */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {retryType && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const type = retryType;
                  setError("");
                  setRetryType(null);
                  if (type === "translate") {
                    handleTranslate();
                  } else if (type === "execute") {
                    handleRunVerify();
                  }
                }}
                className="h-8 px-3 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 font-semibold cursor-pointer"
              >
                Retry
              </Button>
            )}
            <button
              onClick={() => {
                setError("");
                setRetryType(null);
              }}
              className="text-rose-400 hover:text-rose-300 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Validation Errors display */}
      {validationError && (
        <Card className="border-rose-500/30 bg-zinc-950/80 backdrop-blur-md shadow-lg shadow-rose-950/10 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 opacity-80" />
          
          <CardContent className="p-5 md:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              
              <div className="space-y-1 flex-1">
                <h3 className="text-sm font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wide">
                  ❌ Invalid Source Code
                  {validationError.errorLine && (
                    <Badge variant="destructive" className="ml-2 font-mono py-0 px-2 text-[10px]">
                      Line {validationError.errorLine}
                    </Badge>
                  )}
                </h3>
                <p className="text-zinc-200 text-sm font-medium leading-relaxed">
                  {validationError.errorMessage}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValidationError(null);
                  clearMonacoMarkers();
                }}
                className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Suggested Fix Section */}
            {validationError.suggestedFix && (
              <div className="border-t border-zinc-800/80 pt-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                      💡 Suggested Fix
                    </h4>
                    <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-sans bg-zinc-900/40 border border-zinc-800/50 rounded-lg p-3">
                      {validationError.suggestedFix}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Editor Workspace Container */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: ZIP Explorer (Only show if zipFiles has entries) */}
        {zipFiles.length > 0 && (
          <div className="xl:col-span-3 border border-zinc-800 rounded-xl bg-zinc-950/20 flex flex-col h-[600px] overflow-hidden">
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-semibold text-white tracking-wide uppercase">Repository Explorer</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearUploadedFile}
                className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200"
                title="Close ZIP File"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            
            {/* Search filter for ZIP */}
            <div className="p-2 border-b border-zinc-800 bg-zinc-950/10 flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search files..."
                value={zipSearchQuery}
                onChange={(e) => setZipSearchQuery(e.target.value)}
                className="w-full bg-transparent border-0 p-0 text-xs text-white placeholder-zinc-500 focus:ring-0 focus:outline-none"
              />
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
              {filteredZipFiles.map((file) => {
                const isSelected = selectedZipPath === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={async () => {
                      if (file.isDir || !file.contentPromise) return;
                      try {
                        const content = await file.contentPromise();
                        setSourceCode(content);
                        setSelectedZipPath(file.path);
                        const detectedLang = getLanguageFromExtension(file.name);
                        setSourceLanguage(detectedLang !== "plaintext" ? detectedLang : "auto");
                      } catch (err) {
                        setError("Failed to open file from ZIP.");
                      }
                    }}
                    disabled={file.isDir}
                    className={`flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all ${
                      file.isDir 
                        ? "text-zinc-500 font-semibold mt-1.5 mb-0.5 bg-zinc-900/10 cursor-default" 
                        : isSelected
                          ? "bg-indigo-600/15 text-indigo-300 border-l-2 border-indigo-500 font-medium"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 cursor-pointer"
                    }`}
                  >
                    {file.isDir ? (
                      <Folder className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                    ) : (
                      <FileCode className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-indigo-400" : "text-zinc-500"}`} />
                    )}
                    <span className="truncate flex-1">{file.path}</span>
                    {!file.isDir && <ChevronRight className={`h-3 w-3 opacity-0 group-hover:opacity-100 ${isSelected ? "opacity-100 text-indigo-400" : ""}`} />}
                  </button>
                );
              })}
              {filteredZipFiles.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-xs">No files matched search</div>
              )}
            </div>
          </div>
        )}

        {/* Center / Right Editor Panes */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${zipFiles.length > 0 ? "xl:col-span-9" : "xl:col-span-12"}`}>
          
          {/* Source Code Container */}
          <div className="flex flex-col h-[600px] border border-zinc-800 rounded-xl bg-zinc-950/20 overflow-hidden">
            <div className="h-12 px-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white tracking-wide uppercase">Source Code</span>
                <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-mono">
                  {displaySourceLang}
                </span>
                {fileName && (
                  <span className="text-xs text-indigo-400 truncate max-w-[150px]" title={fileName}>
                    ({fileName})
                  </span>
                )}
              </div>
              
              {/* Tab Selector */}
              {zipFiles.length === 0 && (
                <div className="flex bg-zinc-900/80 border border-zinc-800/85 rounded-lg p-0.5">
                  <button
                    onClick={() => {
                      setUploadType("paste");
                      clearUploadedFile();
                    }}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      uploadType === "paste"
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Paste
                  </button>
                  <button
                    onClick={() => setUploadType("upload")}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      uploadType === "upload"
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Upload File
                  </button>
                </div>
              )}

              {fileName && (
                <button
                  onClick={clearUploadedFile}
                  className="text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 hover:bg-zinc-850 transition"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>

            {/* Source Editor Body */}
            <div className="flex-1 min-h-0 relative">
              {uploadType === "upload" && !sourceCode && zipFiles.length === 0 ? (
                /* Upload Drag Drop Area */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`absolute inset-0 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-b-xl m-4 transition-all duration-200 ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-500/5 text-indigo-400"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/20 text-zinc-400"
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.h,.go,.rs,.zip"
                  />
                  <Upload className={`h-10 w-10 mb-4 animate-float ${isDragging ? "text-indigo-400" : "text-zinc-500"}`} />
                  <label
                    htmlFor="file-upload"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-lg cursor-pointer transition shadow-md shadow-indigo-600/10 mb-2"
                  >
                    Choose Code or ZIP file
                  </label>
                  <p className="text-xs text-zinc-500 mt-1">
                    Drag & drop single files (.js, .py, etc.) or .zip packages here.
                  </p>
                </div>
              ) : (
                /* Source Monaco Editor */
                <CodeEditor
                  value={sourceCode}
                  onChange={(val) => setSourceCode(val || "")}
                  language={sourceLanguage === "auto" ? "javascript" : sourceLanguage}
                  height="100%"
                  onMount={handleEditorMount}
                />
              )}
            </div>
          </div>

          {/* Target Code Container */}
          <div className="flex flex-col h-[600px] border border-zinc-800 rounded-xl bg-zinc-950/20 overflow-hidden">
            <div className="h-12 px-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white tracking-wide uppercase">
                  {viewMode === "split" ? "Translated Output" : "Diff Comparison"}
                </span>
                <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-mono uppercase">
                  {targetLanguage}
                </span>
              </div>

              {/* Action buttons (Copy, Download, Star) */}
              {translatedCode && (
                <div className="flex items-center gap-2">
                  {jobId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleSave}
                      className={`h-8 text-xs border border-zinc-800 hover:bg-zinc-900 cursor-pointer transition ${
                        isSaved ? "text-amber-400 hover:text-amber-300" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Star className={`h-3.5 w-3.5 mr-1 ${isSaved ? "fill-amber-400 text-amber-400" : ""}`} />
                      {isSaved ? "Saved" : "Save"}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCode}
                    className="h-8 text-xs text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-900 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400 mr-1" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadCode}
                    className="h-8 text-xs text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-900 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> Download
                  </Button>
                </div>
              )}
            </div>

            {/* Target Editor Body */}
            <div className="flex-1 min-h-0 relative">
              {viewMode === "diff" ? (
                <CodeDiffEditor
                  original={sourceCode}
                  modified={translatedCode}
                  originalLanguage={sourceLanguage === "auto" ? "javascript" : sourceLanguage}
                  modifiedLanguage={targetLanguage}
                  height="100%"
                />
              ) : (
                <CodeEditor
                  value={translatedCode}
                  language={targetLanguage}
                  readOnly={true}
                  height="100%"
                />
              )}

              {/* Loader overlay during translation */}
              {isTranslating && !translatedCode && (
                <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
                  <p className="text-xs text-zinc-400">Gemini is translating your code...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Console Output & Verification Terminal */}
      {(isExecuting || executionResult || consoleError) && (
        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-md relative overflow-hidden shadow-2xl glow-indigo">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-850 px-6 py-4 gap-4 bg-zinc-950/60">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center gap-2">
                Code Execution & Verification Terminal
              </h2>
              {/* Badges */}
              {isExecuting ? (
                <Badge variant="primary" glow className="py-0.5 px-2">
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  Running...
                </Badge>
              ) : executionResult ? (
                <Badge
                  variant={
                    executionResult.status === "verified"
                      ? "success"
                      : executionResult.status === "mismatch"
                      ? "warning"
                      : "destructive"
                  }
                  glow
                  className="py-0.5 px-2"
                >
                  {executionResult.status === "verified" && "✅ Translation Verified"}
                  {executionResult.status === "mismatch" && "⚠ Output Mismatch"}
                  {executionResult.status === "failed" && "❌ Compilation Failed"}
                </Badge>
              ) : null}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyConsoleOutput}
                disabled={!executionResult}
                className="h-8 text-xs text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-900 cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy Output
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearConsole}
                className="h-8 text-xs text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:bg-zinc-900 cursor-pointer"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear Console
              </Button>
            </div>
          </div>

          {/* Console Navigation Tabs */}
          <div className="flex border-b border-zinc-850 bg-zinc-950/20 px-6 py-2 gap-2">
            <button
              onClick={() => setConsoleTab("summary")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                consoleTab === "summary"
                  ? "bg-zinc-900 text-white shadow-sm border border-zinc-850"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Verification Summary
            </button>
            <button
              onClick={() => setConsoleTab("source")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                consoleTab === "source"
                  ? "bg-zinc-900 text-white shadow-sm border border-zinc-850"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Source Console
            </button>
            <button
              onClick={() => setConsoleTab("target")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                consoleTab === "target"
                  ? "bg-zinc-900 text-white shadow-sm border border-zinc-850"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Translated Console
            </button>
          </div>

          {/* Terminal Screen Body */}
          <div 
            ref={terminalContainerRef}
            className="p-6 bg-black/80 font-mono text-xs overflow-y-auto max-h-[300px] h-[220px] custom-scrollbar text-zinc-300 relative selection:bg-zinc-800 selection:text-white"
          >
            {isExecuting && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-6 w-6 text-indigo-500 animate-spin" />
                <span className="text-zinc-400">Sandboxing code on remote servers...</span>
              </div>
            )}

            {consoleTab === "summary" && (
              <div className="space-y-4">
                {consoleError ? (
                  <div className="text-rose-400 font-semibold">{consoleError}</div>
                ) : executionResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">Status:</span>
                      <strong className={
                        executionResult.status === "verified" 
                          ? "text-emerald-400" 
                          : executionResult.status === "mismatch" 
                          ? "text-amber-400" 
                          : "text-rose-400"
                      }>
                        {executionResult.status === "verified" && "✅ VERIFIED - Outputs match perfectly!"}
                        {executionResult.status === "mismatch" && "⚠ MISMATCH - Translated output differs from source!"}
                        {executionResult.status === "failed" && "❌ COMPILATION / RUNTIME FAILED - Check console error output!"}
                      </strong>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-3.5 rounded-lg border border-zinc-850 bg-zinc-950/60 space-y-1.5">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Source Program</span>
                        <div className="flex justify-between text-zinc-400">
                          <span>Exit Code:</span>
                          <span className={executionResult.sourceResult.run.code === 0 ? "text-emerald-400" : "text-rose-400"}>
                            {executionResult.sourceResult.run.code}
                          </span>
                        </div>
                        {executionResult.sourceResult.compile && (
                          <div className="flex justify-between text-zinc-400">
                            <span>Compile:</span>
                            <span className={executionResult.sourceResult.compile.code === 0 ? "text-emerald-400" : "text-rose-400"}>
                              {executionResult.sourceResult.compile.code === 0 ? "Success" : "Failed"}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-zinc-400">
                          <span>Execution time:</span>
                          <span>{executionResult.sourceResult.executionTimeMs || 12}ms</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-lg border border-zinc-850 bg-zinc-950/60 space-y-1.5">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Translated Program</span>
                        <div className="flex justify-between text-zinc-400">
                          <span>Exit Code:</span>
                          <span className={executionResult.targetResult.run.code === 0 ? "text-emerald-400" : "text-rose-400"}>
                            {executionResult.targetResult.run.code}
                          </span>
                        </div>
                        {executionResult.targetResult.compile && (
                          <div className="flex justify-between text-zinc-400">
                            <span>Compile:</span>
                            <span className={executionResult.targetResult.compile.code === 0 ? "text-emerald-400" : "text-rose-400"}>
                              {executionResult.targetResult.compile.code === 0 ? "Success" : "Failed"}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-zinc-400">
                          <span>Execution time:</span>
                          <span>{executionResult.targetResult.executionTimeMs || 15}ms</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 text-zinc-400 leading-relaxed text-[11px] border-t border-zinc-900">
                      {executionResult.status === "verified" && "The source program and translated program were executed in identical sandboxed runtimes. Both outputs are semantic equivalents."}
                      {executionResult.status === "mismatch" && "Verification alert: The translation preserves structure but returned different standard outputs. Please check logic differences."}
                      {executionResult.status === "failed" && "Error alert: The translated code failed to build or exited with an error. Review the 'Translated Console' tab for debugging details."}
                    </div>
                  </div>
                ) : (
                  <div className="text-zinc-500 italic">No execution logs available. Click \"Run & Verify Code\" to begin.</div>
                )}
              </div>
            )}

            {consoleTab === "source" && executionResult && (
              <div className="space-y-2">
                {/* Compile Stderr if any */}
                {executionResult.sourceResult.compile && executionResult.sourceResult.compile.stderr && (
                  <div className="text-amber-500 whitespace-pre-wrap pb-2 border-b border-amber-950/30">
                    <div className="font-bold uppercase text-[10px] mb-1">=== Compilation Errors ===</div>
                    {executionResult.sourceResult.compile.stderr}
                  </div>
                )}
                
                {/* Stdout */}
                {executionResult.sourceResult.run.stdout && (
                  <div className="text-emerald-400 whitespace-pre-wrap">
                    {executionResult.sourceResult.run.stdout}
                  </div>
                )}

                {/* Stderr */}
                {executionResult.sourceResult.run.stderr && (
                  <div className="text-rose-400 whitespace-pre-wrap font-semibold">
                    <div className="font-bold uppercase text-[10px] mb-1">=== Runtime Errors ===</div>
                    {executionResult.sourceResult.run.stderr}
                  </div>
                )}

                {!executionResult.sourceResult.run.stdout && !executionResult.sourceResult.run.stderr && (
                  <div className="text-zinc-500 italic">Program exited with code {executionResult.sourceResult.run.code} (no output)</div>
                )}
              </div>
            )}

            {consoleTab === "target" && executionResult && (
              <div className="space-y-2">
                {/* Compile Stderr if any */}
                {executionResult.targetResult.compile && executionResult.targetResult.compile.stderr && (
                  <div className="text-amber-500 whitespace-pre-wrap pb-2 border-b border-amber-950/30">
                    <div className="font-bold uppercase text-[10px] mb-1">=== Compilation Errors ===</div>
                    {executionResult.targetResult.compile.stderr}
                  </div>
                )}
                
                {/* Stdout */}
                {executionResult.targetResult.run.stdout && (
                  <div className="text-emerald-400 whitespace-pre-wrap">
                    {executionResult.targetResult.run.stdout}
                  </div>
                )}

                {/* Stderr */}
                {executionResult.targetResult.run.stderr && (
                  <div className="text-rose-400 whitespace-pre-wrap font-semibold">
                    <div className="font-bold uppercase text-[10px] mb-1">=== Runtime Errors ===</div>
                    {executionResult.targetResult.run.stderr}
                  </div>
                )}

                {!executionResult.targetResult.run.stdout && !executionResult.targetResult.run.stderr && (
                  <div className="text-zinc-500 italic">Program exited with code {executionResult.targetResult.run.code} (no output)</div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Bottom Panel: AI Explanations and Insight */}
      {(explanation || isTranslating) && (
        <Card className="border-zinc-800 bg-zinc-950/30 backdrop-blur-md">
          <CardHeader className="border-b border-zinc-850 px-6 py-4 flex flex-row items-center gap-2">
            <Info className="h-4.5 w-4.5 text-indigo-400" />
            <CardTitle className="text-sm font-semibold text-white tracking-wide uppercase">
              AI Optimization & Explanation Insights
            </CardTitle>
            {isTranslating && !explanation && (
              <span className="text-xs text-indigo-400 animate-pulse ml-2">Generating insights...</span>
            )}
          </CardHeader>
          <CardContent className="px-6 py-5 min-h-[100px]">
            {explanation ? (
              renderMarkdownExplanation(explanation)
            ) : (
              <div className="flex items-center gap-3 text-zinc-500 text-sm">
                <RefreshCw className="h-4 w-4 animate-spin text-zinc-600" />
                <span>Generating breakdown of translations and best practices for the target code...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-md transition-all duration-300 ${
              toast.type === "error"
                ? "bg-zinc-950/90 border-rose-500/30 text-rose-200 shadow-rose-950/10"
                : toast.type === "success"
                ? "bg-zinc-950/90 border-emerald-500/30 text-emerald-200 shadow-emerald-950/10"
                : "bg-zinc-950/90 border-zinc-700/30 text-zinc-200 shadow-zinc-950/10"
            }`}
            style={{
              animation: "slide-in 0.25s ease-out forwards"
            }}
          >
            {toast.type === "error" && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
            {toast.type === "success" && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
            {toast.type === "info" && <Info className="h-4 w-4 text-indigo-400 shrink-0" />}
            <span className="text-xs font-semibold tracking-wide">{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-zinc-500 hover:text-zinc-300 ml-2 cursor-pointer shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
