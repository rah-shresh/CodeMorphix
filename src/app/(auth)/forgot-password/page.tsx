"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, Sparkles, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);

      const result = await requestPasswordReset(formData);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        setSubmitted(true);
        setLoading(false);
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -z-10 animate-pulse-slow"></div>
      
      <Card glass className="w-full max-w-md border-border/60 shadow-2xl relative glow-indigo animate-fade-in">
        {!submitted ? (
          <>
            <div className="absolute -top-3 -right-3">
              <Badge variant="primary" glow className="px-3 py-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Password Reset
              </Badge>
            </div>
            
            <CardHeader className="space-y-3 text-center pb-6">
              <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-2xl font-bold tracking-tight">Forgot Password?</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Enter your email address and we will send you instructions to reset your password.
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-11 text-sm font-semibold shadow-lg shadow-indigo-600/20 cursor-pointer mt-2"
                  isLoading={loading}
                >
                  Send Reset Link
                </Button>
              </form>

              <div className="text-center mt-4">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </Link>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="pt-8 pb-6 text-center space-y-6">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Check Your Email</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We have sent password reset instructions to <strong className="text-zinc-200">{email}</strong> if it is associated with an account.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/40 text-xs text-muted-foreground text-left leading-relaxed">
              <p className="font-semibold text-zinc-300 mb-1">Didn&apos;t receive it?</p>
              Check your spam folder or try again in a few minutes. For local development, check the server terminal logs to inspect the request.
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Link href="/login" className="w-full">
                <Button variant="primary" className="w-full h-11 text-sm font-semibold">
                  Back to Sign In
                </Button>
              </Link>
              
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Try a different email address
              </button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
