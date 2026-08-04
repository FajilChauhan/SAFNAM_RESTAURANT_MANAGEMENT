import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "gold" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:opacity-60 disabled:pointer-events-none";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary-600 text-white shadow-emerald hover:bg-primary-700",
    secondary: "bg-secondary-500 text-white hover:bg-secondary-600",
    gold: "bg-gradient-to-r from-secondary-400 to-secondary-600 text-white shadow-gold",
    ghost: "bg-transparent text-primary-700 hover:bg-primary-50",
    danger: "bg-danger text-white hover:opacity-90",
    outline: "border-2 border-primary-600 text-primary-600 hover:bg-primary-50",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4",
    lg: "h-12 px-6 text-lg",
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading ? "Loading..." : leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
}
