import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, fullWidth, className, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-bold rounded-lg transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed";
    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-5 py-3 text-base",
    };
    const variants = {
      primary: "bg-pump text-black hover:bg-pump/90 shadow-[0_0_20px_rgba(0,255,102,0.2)] hover:shadow-[0_0_30px_rgba(0,255,102,0.4)]",
      secondary: "bg-hermes text-white hover:bg-hermes/90 shadow-[0_0_20px_rgba(168,85,247,0.2)]",
      ghost: "bg-transparent text-white/70 hover:bg-white/10 hover:text-white border border-white/10",
      danger: "bg-dump text-white hover:bg-dump/90 shadow-[0_0_20px_rgba(255,59,48,0.2)]",
    };
    return (
      <button
        ref={ref}
        className={[base, sizes[size], variants[variant], fullWidth ? "w-full" : "", className ?? ""].filter(Boolean).join(" ")}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
            Loading...
          </>
        ) : children}
      </button>
    );
  }
);
Button.displayName = "Button";
