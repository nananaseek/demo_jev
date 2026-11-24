import type * as React from "react";

import { cn } from "@/lib/utils";

const intents = {
  info: "border-purple-300 bg-purple-100 text-purple-700",
  danger: "border-danger-line bg-danger-bg text-danger-ink",
} as const;

export function Alert({
  className,
  intent = "info",
  ...props
}: React.ComponentProps<"div"> & { intent?: keyof typeof intents }) {
  return (
    <div
      role={intent === "danger" ? "alert" : "status"}
      className={cn("rounded-tile border p-4 text-sm/6", intents[intent], className)}
      {...props}
    />
  );
}
