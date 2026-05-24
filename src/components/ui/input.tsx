import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type = "text", label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={`w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:opacity-50 disabled:pointer-events-none ${
            error ? "border-destructive focus:ring-destructive focus:border-destructive" : ""
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-destructive mt-0.5">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
