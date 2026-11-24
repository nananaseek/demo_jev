import type * as React from "react";

import { cn } from "@/lib/utils";

const variants = {
  purple: "bg-purple-200 text-purple-700",
  cyan: "bg-cyan-400/15 text-cyan-500",
  neutral: "bg-purple-100 text-muted",
  onDark: "bg-white/12 text-white ring-1 ring-white/20",
  match: "bg-purple-600 text-white",
  danger: "bg-danger-bg text-danger-ink ring-1 ring-danger-line/60",
} as const;

export function Badge({
  className,
  variant = "purple",
  ...props
}: React.ComponentProps<"span"> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium leading-none",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
