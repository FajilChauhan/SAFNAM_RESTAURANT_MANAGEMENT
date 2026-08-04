import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  padding?: string;
}

export function Card({ children, className, hover, glass, padding = "p-6" }: CardProps) {
  return (
    <div className={cn("rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-dark/90", glass && "glass", hover && "transition hover:scale-[1.02]", padding, className)}>
      {children}
    </div>
  );
}
