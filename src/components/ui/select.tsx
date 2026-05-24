import React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, children, ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            className={`w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:opacity-50 disabled:pointer-events-none appearance-none cursor-pointer pr-10 ${
              error ? "border-destructive focus:ring-destructive focus:border-destructive" : ""
            } ${className}`}
            {...props}
          >
            {children}
          </select>
          {/* Custom Chevron Icon */}
          <div className="pointer-events-none absolute right-3 flex items-center text-muted-foreground">
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <span className="text-xs text-destructive mt-0.5">{error}</span>}
      </div>
    );
  }
);

Select.displayName = "Select";
