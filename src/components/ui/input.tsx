import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-tile border border-line bg-surface px-3.5 text-sm text-ink shadow-[0_1px_0_rgba(11,19,42,0.02)] outline-none transition-colors",
        "placeholder:text-muted/70 focus-visible:border-purple-500 focus-visible:ring-4 focus-visible:ring-purple-500/15",
        "aria-invalid:border-danger-line aria-invalid:ring-4 aria-invalid:ring-danger-line/20",
        className,
      )}
      {...props}
    />
  );
}
