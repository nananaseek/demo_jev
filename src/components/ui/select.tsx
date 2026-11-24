import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-11 w-full appearance-none rounded-tile border border-line bg-surface px-3.5 pr-9 text-sm text-ink outline-none transition-colors",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%235b6480%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-no-repeat",
        "focus-visible:border-purple-500 focus-visible:ring-4 focus-visible:ring-purple-500/15",
        "aria-invalid:border-danger-line",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
