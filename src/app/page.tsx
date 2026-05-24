"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code2,
  FileCode,
  Zap,
  Cpu,
  RefreshCw,
  FolderArchive,
  ArrowRight,
  Check,
  Shield,
  Sparkles,
  Lock,
  Moon,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock snippets for the interactive showcase
const mockSnippets = {
  JavaScript: `// Calculate Fibonacci numbers
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`,
  Rust: `// Calculate Fibonacci numbers (Optimized)
fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}`,
  Python: `# Calculate Fibonacci numbers
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)`,
  Go: `// Calculate Fibonacci numbers
func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}`
};

type Language = keyof typeof mockSnippets;

export default function Home() {
  const [activeLanguage, setActiveLanguage] = useState<Language>("Rust");
  const [isThemeLight, setIsThemeLight] = useState(false);

  const toggleTheme = () => {
    setIsThemeLight(!isThemeLight);
    document.documentElement.classList.toggle("light");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300 font-sans selection:bg-indigo-500/20 selection:text-indigo-200">

      {/* Decorative Radial Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] -z-10 animate-pulse-slow"></div>
      <div className="absolute top-[20%] right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] -z-10"></div>

      {/* Global Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent dark:from-white dark:to-zinc-500">
              Code<span className="text-indigo-400 font-extrabold">Morphix</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#demo" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Interactive Demo
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              Github
            </a>
          </nav>

          {/* Controls & CTA */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="rounded-full w-9 h-9 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Toggle theme"
            >
              {isThemeLight ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </Button>
            <Link href="/login" passHref>
              <Button variant="secondary" size="sm" className="hidden sm:inline-flex cursor-pointer">
                Sign In
              </Button>
            </Link>
            <Link href="/signup" passHref>
              <Button variant="primary" size="sm" className="shadow-lg shadow-indigo-600/25 cursor-pointer">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 px-6 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Translate. Execute. Verify.
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto mb-6 leading-tight">
            Translate Code Across Languages.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 glow-indigo">
              Retain Semantics & Flow.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Move legacy libraries, optimize performance, or study algorithms. Convert snippet-by-snippet or translate entire repositories with production-ready accuracy, powered by Gemini.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20 max-w-md mx-auto">
            <Link href="/signup" passHref>
              <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-xl shadow-indigo-600/20 cursor-pointer">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/dashboard" passHref>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto cursor-pointer">
                View Documentation
              </Button>
            </Link>
          </div>

          {/* Interactive Workspace Mockup (Hero Illustration) */}
          <div id="demo" className="w-full max-w-5xl mx-auto mt-10 rounded-xl border border-border bg-card/50 glass-panel shadow-2xl overflow-hidden text-left glow-indigo">
            {/* Mock IDE Window Controls */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/80 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/70 inline-block"></span>
                <span className="h-3 w-3 rounded-full bg-amber-500/70 inline-block"></span>
                <span className="h-3 w-3 rounded-full bg-emerald-500/70 inline-block"></span>
                <span className="text-xs text-muted-foreground ml-3 font-mono">Workspace.ts — CodeMorphix IDE</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="primary" glow>Gemini Active</Badge>
              </div>
            </div>

            {/* Editor Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/60 font-mono text-sm h-[320px] bg-zinc-950/90 text-zinc-300">
              {/* Input Editor */}
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-zinc-900/40 text-xs">
                  <span className="text-muted-foreground font-semibold">SOURCE CODE</span>
                  <Badge variant="outline">JavaScript</Badge>
                </div>
                <div className="p-4 flex-1 overflow-auto text-xs sm:text-sm">
                  <pre className="text-emerald-400/90 whitespace-pre-wrap">{mockSnippets.JavaScript}</pre>
                </div>
              </div>

              {/* Output Editor */}
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-zinc-900/40 text-xs">
                  <span className="text-muted-foreground font-semibold">AI TRANSLATION</span>
                  <div className="flex gap-1">
                    {(Object.keys(mockSnippets) as Language[]).filter(lang => lang !== "JavaScript").map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setActiveLanguage(lang)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${activeLanguage === lang
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-zinc-800 text-muted-foreground hover:bg-zinc-700 hover:text-foreground"
                          }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 flex-1 overflow-auto text-xs sm:text-sm bg-indigo-950/5">
                  <pre className="text-indigo-200/95 whitespace-pre-wrap">{mockSnippets[activeLanguage]}</pre>
                </div>
              </div>
            </div>

            {/* Explanation / Diff bar */}
            <div className="bg-zinc-900/60 border-t border-border/40 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                <span className="text-muted-foreground">
                  <strong>Semantic Mapping</strong>: Replaced standard recursion with type-safe patterns, mapped functional primitives, and handled return bindings natively.
                </span>
              </div>
              <Link href="/dashboard" passHref>
                <Button size="sm" variant="ghost" className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer gap-1 text-[11px] h-7 px-2 shrink-0">
                  View detailed explanation <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 px-6 bg-zinc-950/30 border-t border-b border-border/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-extrabold mb-4 sm:text-4xl">
                Engineered for Modern Teams
              </h2>
              <p className="text-muted-foreground">
                Smarter compilation, type-safety parsing, and comprehensive repository structure translation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card glass className="hover:border-indigo-500/40 hover:-translate-y-1 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-2 border border-indigo-500/20 text-indigo-400">
                    <Zap className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Paste & Stream translation</CardTitle>
                  <CardDescription>
                    Write or paste snippet blocks. Receive instant, streaming character-by-character translation from our optimized LLM models.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Feature 2 */}
              <Card glass className="hover:border-indigo-500/40 hover:-translate-y-1 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2 border border-purple-500/20 text-purple-400">
                    <FolderArchive className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">File & ZIP uploads</CardTitle>
                  <CardDescription>
                    Upload single files or drag-and-drop a ZIP directory. We maintain folder structures and resolve import declarations during conversions.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Feature 3 */}
              <Card glass className="hover:border-indigo-500/40 hover:-translate-y-1 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2 border border-emerald-500/20 text-emerald-400">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">AI Explanations & Diffing</CardTitle>
                  <CardDescription>
                    Understand syntax replacements. Our system generates diff breakdowns, highlights package updates, and suggests performance enhancements.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Feature 4 */}
              <Card glass className="hover:border-indigo-500/40 hover:-translate-y-1 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center mb-2 border border-rose-500/20 text-rose-400">
                    <FileCode className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Monaco Editor & Themes</CardTitle>
                  <CardDescription>
                    Fully responsive workspace built with the core VS Code engine, offering syntax highlighting, autocompletes, and full-screen layouts.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Feature 5 */}
              <Card glass className="hover:border-indigo-500/40 hover:-translate-y-1 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2 border border-amber-500/20 text-amber-400">
                    <Shield className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Secure & Private</CardTitle>
                  <CardDescription>
                    Your code is private. All file uploads are sandboxed and wiped immediately after processing. Enterprise setups offer full data isolation.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Feature 6 */}
              <Card glass className="hover:border-indigo-500/40 hover:-translate-y-1 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-2 border border-cyan-500/20 text-cyan-400">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">8+ Default Languages</CardTitle>
                  <CardDescription>
                    Seamless translation between JavaScript, TypeScript, Python, Java, C, C++, Go, and Rust with semantic correctness and idiom mappings.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold mb-4 sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground">
              Choose the plan that fits your coding flow. Pay as you go or get unlimited access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Hobby Tier */}
            <Card className="flex flex-col h-full bg-card border-border hover:border-border/80 relative">
              <CardHeader className="flex-1">
                <CardTitle className="text-lg font-bold text-zinc-100">Hobby</CardTitle>
                <CardDescription>Perfect for individual developers experimenting.</CardDescription>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold">$0</span>
                  <span className="ml-1 text-sm text-muted-foreground">/ forever</span>
                </div>
                <ul className="mt-8 space-y-4 text-sm text-zinc-300">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <span>20 translation credits / month</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <span>Paste-in snippets only</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <span>Standard speed models (Gemini Flash)</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-muted-foreground/60 line-through">
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>File & ZIP upload translations</span>
                  </li>
                </ul>
              </CardHeader>
              <CardFooter className="pt-4 border-t border-border/40">
                <Link href="/signup" passHref className="w-full">
                  <Button variant="secondary" className="w-full cursor-pointer">
                    Get Started Free
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Pro Tier (Popular) */}
            <Card className="flex flex-col h-full bg-zinc-950 border-indigo-500 shadow-xl shadow-indigo-500/10 relative">
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[11px] font-bold tracking-wider px-3 py-1 rounded-full uppercase">
                Most Popular
              </div>
              <CardHeader className="flex-1">
                <CardTitle className="text-lg font-bold text-zinc-100">Developer Pro</CardTitle>
                <CardDescription>Ideal for day-to-day coding productivity.</CardDescription>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold">$19</span>
                  <span className="ml-1 text-sm text-muted-foreground">/ month</span>
                </div>
                <ul className="mt-8 space-y-4 text-sm text-zinc-300">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <span><strong>1,000</strong> translation credits / month</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <span>Single files & ZIP archives (.zip, .py, etc.)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <span>High-priority models (Gemini Pro)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <span>Detailed syntax diffs & AI suggestions</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <span>Historical activity saves (Unlimited)</span>
                  </li>
                </ul>
              </CardHeader>
              <CardFooter className="pt-4 border-t border-border/40">
                <Link href="/signup" passHref className="w-full">
                  <Button variant="primary" className="w-full cursor-pointer">
                    Upgrade to Pro
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Enterprise Tier */}
            <Card className="flex flex-col h-full bg-card border-border hover:border-border/80 relative">
              <CardHeader className="flex-1">
                <CardTitle className="text-lg font-bold text-zinc-100">Enterprise</CardTitle>
                <CardDescription>Tailored for massive codebases and custom models.</CardDescription>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold">Custom</span>
                </div>
                <ul className="mt-8 space-y-4 text-sm text-zinc-300">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <span>Unlimited translations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <span>Custom fine-tuned translation parameters</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <span>On-premise / isolated cloud deployments</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <span>Dedicated SLA support & API integration</span>
                  </li>
                </ul>
              </CardHeader>
              <CardFooter className="pt-4 border-t border-border/40">
                <Link href="/signup" passHref className="w-full">
                  <Button variant="secondary" className="w-full cursor-pointer">
                    Contact Sales
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <footer className="border-t border-border/40 bg-zinc-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-indigo-600 flex items-center justify-center">
              <Code2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">
              CodeMorphix
            </span>
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            &copy; 2026 CodeMorphix SaaS. All rights reserved.
          </div>

          <div className="flex gap-6 text-xs text-muted-foreground font-mono">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms of Service</a>
            <a href="#" className="hover:text-foreground">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
