import type * as React from "react";

import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-brand-dark text-white hover:bg-purple-800",
  soft: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  outline: "border border-line bg-surface text-ink hover:bg-purple-100",
  ghost: "text-ink hover:bg-purple-100",
  danger: "bg-danger-ink text-white hover:brightness-110",
} as const;

const sizes = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-6 text-base",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2 focus-visible:ring-offset-page",
        "disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
