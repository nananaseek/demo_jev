"use client";

import { Check, Loader2 } from "lucide-react";

import type { FlowState } from "@/features/matching/hooks/useMatchFlow";
import type { MatchStep } from "@/features/matching/types";
import { cn } from "@/lib/utils";

const STEPS: Array<{ key: MatchStep; label: string; hint: string }> = [
  { key: "category", label: "Категорія", hint: "напрям медицини" },
  { key: "subcategory", label: "Підкатегорія", hint: "конкретний фах" },
  { key: "doctors", label: "Фахівець", hint: "профіль і досвід" },
];

type Status = "done" | "active" | "pending";

function statusFor(step: MatchStep, state: FlowState): Status {
  if (step === "category" && state.category) return "done";
  if (step === "subcategory" && state.subcategory) return "done";
  if (step === "doctors" && state.doctors.length > 0) return "done";
  if ((state.phase === "running" || state.phase === "clarify") && state.step === step) return "active";
  return "pending";
}

function valueFor(step: MatchStep, state: FlowState): string | null {
  if (step === "category") return state.category?.name ?? null;
  if (step === "subcategory") return state.subcategory?.name ?? null;
  if (state.doctors.length > 0) return `${state.doctors.length} профілів`;
  return null;
}

export function StepTracker({ state }: { state: FlowState }) {
  return (
    <ol className="mt-5 space-y-1">
      {STEPS.map((step, index) => {
        const status = statusFor(step.key, state);
        const value = valueFor(step.key, state);
        return (
          <li key={step.key} className="relative flex gap-3 pb-3 last:pb-0">
            {index < STEPS.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-px",
                  status === "done" ? "bg-cyan-400/50" : "bg-white/15",
                )}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                status === "done" && "bg-cyan-400 text-brand-dark",
                status === "active" && "bg-white text-brand-dark",
                status === "pending" && "border border-white/25 text-white/60",
              )}
            >
              {status === "done" ? (
                <Check aria-hidden className="size-3.5" />
              ) : status === "active" ? (
                <Loader2 aria-hidden className="size-3.5 animate-spin" />
              ) : (
                index + 1
              )}
            </span>
            <div className="min-w-0 flex-1" aria-current={status === "active" ? "step" : undefined}>
              <p
                className={cn(
                  "text-sm font-medium leading-5",
                  status === "pending" ? "text-white/55" : "text-white",
                )}
              >
                {step.label}
              </p>
              <p className="truncate text-xs leading-5 text-white/55">{value ?? step.hint}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
