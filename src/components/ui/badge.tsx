import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "neutral" | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/10",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10",
  danger: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10",
  neutral: "bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-500/10",
  outline: "border border-zinc-200 bg-white/60 text-zinc-600",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}