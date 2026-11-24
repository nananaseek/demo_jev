import type * as React from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full resize-none rounded-tile border border-line bg-page px-4 py-3.5 text-base/7 text-ink",
        "placeholder:text-muted/80",
        "focus-visible:border-purple-500 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/25",
        "aria-[invalid=true]:border-danger-line aria-[invalid=true]:ring-danger-line/20",
        className,
      )}
      {...props}
    />
  );
}
