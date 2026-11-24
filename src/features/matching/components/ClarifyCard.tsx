"use client";

import { ArrowRight, HelpCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { FlowPoint, FlowState } from "@/features/matching/hooks/useMatchFlow";
import type { MatchCandidate } from "@/features/matching/types";
import { categories, categoryById } from "@/features/specialists/data";
import type { CategoryId } from "@/features/specialists/types";

interface ClarifyCardProps {
  state: FlowState;
  manualOpen: boolean;
  onPick: (candidate: MatchCandidate) => void;
  onManual: (point: FlowPoint) => void;
  onToggleManual: (open: boolean) => void;
}

export function ClarifyCard({ state, manualOpen, onPick, onManual, onToggleManual }: ClarifyCardProps) {
  const [manualId, setManualId] = useState("");
  const options =
    state.step === "category"
      ? categories.map((category) => ({ id: category.id, name: category.name }))
      : (categoryById
          .get(state.category?.id as CategoryId)
          ?.subcategories.map((subcategory) => ({ id: subcategory.id, name: subcategory.name })) ?? []);

  const title =
    state.step === "category"
      ? "JEV не впевнений у категорії"
      : "JEV не впевнений у підкатегорії";

  return (
    <div className="animate-rise rounded-card bg-surface p-4 text-ink shadow-soft sm:p-5">
      <div className="flex items-start gap-2">
        <HelpCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-purple-600" />
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 text-xs/5 text-body">
            Скарга допускає кілька варіантів. Уточніть, будь ласка, що ближче — і JEV продовжить.
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {state.candidates.slice(0, 3).map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            onClick={() => onPick(candidate)}
            className="flex w-full items-center justify-between gap-3 rounded-tile border border-line bg-page px-3 py-2.5 text-left transition-colors hover:border-purple-300 hover:bg-purple-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink">{candidate.name}</span>
              <span className="block truncate text-xs text-muted">{candidate.description}</span>
            </span>
            <span className="tabular shrink-0 text-sm font-semibold text-purple-700">
              {Math.round(candidate.probability * 100)}%
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 border-t border-line pt-3">
        <button
          type="button"
          onClick={() => onToggleManual(!manualOpen)}
          className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
        >
          {manualOpen ? "Згорнути ручний вибір" : "Обрати вручну"}
          <ArrowRight aria-hidden className="size-3.5" />
        </button>

        {manualOpen ? (
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="manual-pick">
              {state.step === "category" ? "Оберіть категорію" : "Оберіть підкатегорію"}
            </label>
            <select
              id="manual-pick"
              value={manualId}
              onChange={(event) => setManualId(event.target.value)}
              className="h-11 min-w-0 flex-1 rounded-control border border-line bg-page px-3 text-sm text-ink focus-visible:border-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/25"
            >
              <option value="">Оберіть варіант…</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <Button
              size="md"
              disabled={!manualId}
              onClick={() => {
                const point = options.find((option) => option.id === manualId);
                if (point) onManual(point);
              }}
            >
              Продовжити
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
