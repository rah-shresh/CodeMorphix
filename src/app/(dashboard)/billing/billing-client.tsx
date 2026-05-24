"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, CreditCard, Shield, Zap, AlertCircle } from "lucide-react";
import { upgradeUserToPro, cancelProSubscription } from "@/app/actions/auth";

interface BillingClientProps {
  userId: string;
  initialCredits: number;
  initialSubId: string | null;
}

export default function BillingClient({ userId, initialCredits, initialSubId }: BillingClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const isPro = !!initialSubId;

  const handleUpgrade = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await upgradeUserToPro(userId);
      if (res.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your Pro subscription?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await cancelProSubscription(userId);
      if (res.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          Billing & Subscription
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your developer tier, view credit quotas, and scale your translation limits.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Credit overview widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card glass className="md:col-span-2 p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-foreground">Current Plan Overview</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {isPro 
                ? "You have full access to developer tools, including ZIP package conversions and priority translations." 
                : "You are currently using a Free Trial. Upgrade to Developer Pro to unlock folder translations and priority model speeds."}
            </p>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Remaining Balance</p>
              <p className="text-2xl font-mono font-black text-indigo-400">{initialCredits} Credits</p>
            </div>
            
            <div className="ml-auto flex items-center gap-2.5">
              <span className="text-xs text-muted-foreground">Plan Status:</span>
              <Badge variant={isPro ? "success" : "secondary"} className="py-0.5 px-2.5 text-xs font-semibold">
                {isPro ? "Developer Pro" : "Free Tier"}
              </Badge>
            </div>
          </div>
        </Card>

        <Card glass className="md:col-span-1 p-6 flex flex-col justify-between border-indigo-500/30">
          <div className="space-y-1 text-center py-2">
            <Sparkles className="h-8 w-8 text-indigo-400 mx-auto animate-pulse-slow" />
            <h3 className="text-sm font-bold text-zinc-200 mt-2">Need More Credits?</h3>
            <p className="text-xs text-muted-foreground">
              Upgrading instantly adds <strong>1,000</strong> priority credits to your balance!
            </p>
          </div>
          {!isPro ? (
            <Button
              variant="primary"
              className="w-full mt-4 cursor-pointer gap-2"
              onClick={handleUpgrade}
              isLoading={loading}
            >
              Upgrade Now
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="w-full mt-4 cursor-default text-zinc-400 bg-zinc-900 border-zinc-800"
              disabled
            >
              Subscription Active
            </Button>
          )}
        </Card>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mt-8">
        
        {/* Free Plan Card */}
        <Card glass className={`flex flex-col h-full ${!isPro ? "border-zinc-700 bg-zinc-950/40" : "border-zinc-800 bg-zinc-950/10 opacity-70"}`}>
          <CardHeader className="flex-1 p-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-bold text-zinc-100">Hobby Plan</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">For testing or low-volume snippet conversions.</p>
              </div>
              {!isPro && <Badge variant="secondary">Active</Badge>}
            </div>
            
            <div className="mt-6 flex items-baseline">
              <span className="text-4xl font-extrabold text-white">$0</span>
              <span className="ml-1 text-sm text-muted-foreground">/ forever</span>
            </div>

            <ul className="mt-8 space-y-4 text-xs text-zinc-300">
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                <span>20 translation credits upon registration</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                <span>Paste-in snippets translation only</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                <span>Standard-priority processing speeds</span>
              </li>
              <li className="flex items-center gap-2.5 text-zinc-500">
                <Shield className="h-4.5 w-4.5 shrink-0" />
                <span className="line-through">Folder or ZIP directory translations</span>
              </li>
            </ul>
          </CardHeader>
          <CardFooter className="p-6 pt-0 border-t border-zinc-900/60 mt-6">
            {!isPro ? (
              <Button
                variant="secondary"
                className="w-full cursor-default border-zinc-800 text-zinc-400 bg-zinc-900"
                disabled
              >
                Current Tier
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full cursor-pointer"
                onClick={handleCancel}
                isLoading={loading}
              >
                Downgrade to Free
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Pro Plan Card */}
        <Card glass className={`flex flex-col h-full relative ${isPro ? "border-indigo-500/80 bg-zinc-950/60 shadow-lg shadow-indigo-600/5" : "border-zinc-800"}`}>
          {isPro && (
            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-bold tracking-wider px-3 py-1 rounded-full uppercase">
              Current Plan
            </div>
          )}
          <CardHeader className="flex-1 p-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-bold text-zinc-100">Developer Pro</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">For professional developers and teams.</p>
              </div>
              {isPro && <Badge variant="primary">Active</Badge>}
            </div>
            
            <div className="mt-6 flex items-baseline">
              <span className="text-4xl font-extrabold text-white">$19</span>
              <span className="ml-1 text-sm text-muted-foreground">/ month</span>
            </div>

            <ul className="mt-8 space-y-4 text-xs text-zinc-300">
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                <span><strong>1,000</strong> translation credits per billing period</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                <span>Single file & ZIP directory upload conversions</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                <span>High-priority models (Gemini Flash / Pro)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                <span>Detailed AI syntax explanations & code diffing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                <span>Unlimited translation history storage</span>
              </li>
            </ul>
          </CardHeader>
          <CardFooter className="p-6 pt-0 border-t border-zinc-900/60 mt-6">
            {!isPro ? (
              <Button
                variant="primary"
                className="w-full bg-indigo-600 hover:bg-indigo-500 cursor-pointer shadow-lg shadow-indigo-600/20 gap-2"
                onClick={handleUpgrade}
                isLoading={loading}
              >
                Upgrade to Pro
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full text-rose-400 hover:text-rose-300 border-rose-500/20 hover:bg-rose-500/5 cursor-pointer"
                onClick={handleCancel}
                isLoading={loading}
              >
                Cancel Subscription
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
