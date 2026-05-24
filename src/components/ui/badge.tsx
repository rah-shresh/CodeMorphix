import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "destructive" | "outline";
  glow?: boolean;
}

export const Badge = ({
  className = "",
  variant = "primary",
  glow = false,
  ...props
}: BadgeProps) => {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-colors border";

  const variants = {
    primary: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    secondary: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    destructive: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    outline: "bg-transparent text-foreground border-border",
  };

  const glowStyles = glow ? "shadow-[0_0_10px_rgba(99,102,241,0.15)] animate-pulse-slow" : "";

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${glowStyles} ${className}`}
      {...props}
    />
  );
};
