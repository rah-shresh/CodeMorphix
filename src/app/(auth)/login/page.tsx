"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, Sparkles, AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const authError = searchParams.get("error");
  const registered = searchParams.get("registered");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin" || result.error.includes("CredentialsSignin")) {
          setError("Invalid email or password. Please try again.");
        } else {
          setError("Authentication failed. Please check your credentials.");
        }
        setLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    await signIn("google", { callbackUrl });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -z-10 animate-pulse-slow"></div>
      
      <Card glass className="w-full max-w-md border-border/60 shadow-2xl relative glow-indigo">
        <div className="absolute -top-3 -right-3">
          <Badge variant="primary" glow className="px-3 py-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Secure Auth
          </Badge>
        </div>
        
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Code2 className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Sign in to translate code, view history, and optimize your repositories.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Notification Banners */}
          {registered && !error && (
            <div className="p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Registration successful! You can now sign in with your account.</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {authError && !error && (
            <div className="p-3.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>
                {authError === "OAuthSignin" || authError === "OAuthCallback"
                  ? "Google authentication failed. Please try again."
                  : "Authentication error occurred. Please try again."}
              </span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-border bg-card pl-3 pr-10 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:opacity-50 disabled:pointer-events-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer flex items-center justify-center"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 text-sm font-semibold shadow-lg shadow-indigo-600/20 cursor-pointer mt-2"
              isLoading={loading}
            >
              Sign In
            </Button>
          </form>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-border/40"></div>
            <span className="flex-shrink mx-4 text-zinc-500 text-[11px] font-mono uppercase tracking-wider">Secure Access</span>
            <div className="flex-grow border-t border-border/40"></div>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-11 text-sm font-semibold gap-3 cursor-pointer"
          >
            {/* Google G-logo SVG */}
            <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </Button>

          <div className="flex flex-col gap-2.5 text-center mt-2">
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Sign up
              </Link>
            </p>

            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors font-medium"
            >
              Back to landing page
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-sm text-muted-foreground animate-pulse">Loading login portal...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
