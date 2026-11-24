"use client";

import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClarifyCard } from "@/features/matching/components/ClarifyCard";
import { MatchResults } from "@/features/matching/components/MatchResults";
import { StepTracker } from "@/features/matching/components/StepTracker";
import type { FlowPoint, FlowState } from "@/features/matching/hooks/useMatchFlow";
import type { MatchCandidate, MatchStep } from "@/features/matching/types";
import { categories, categoryById } from "@/features/specialists/data";
import type { CategoryId } from "@/features/specialists/types";

const RUNNING_LABEL: Record<MatchStep, string> = {
  category: "JEV читає скаргу й обирає категорію…",
  subcategory: "Звужуємо до конкретного фаху…",
  doctors: "Порівнюємо профілі й рахуємо ймовірності…",
};

interface DecisionConsoleProps {
  state: FlowState;
  onPick: (candidate: MatchCandidate) => void;
  onManualCategory: (point: FlowPoint) => void;
  onManualSubcategory: (point: FlowPoint) => void;
  onRetry: () => void;
  onReset: () => void;
  onToggleManual: (open: boolean) => void;
}

function ModeBadge({ state }: { state: FlowState }) {
  if (state.mode === "live") return <Badge variant="onDark">JEV · live</Badge>;
  if (state.mode === "mock") return <Badge variant="onDark">Демо-режим</Badge>;
  return <Badge variant="onDark">JEV · очікує</Badge>;
}

function EmptyState() {
  return (
    <div className="rounded-card bg-white/8 p-4 ring-1 ring-white/12">
      <p className="text-sm font-medium text-white">Як JEV ухвалює рішення</p>
      <ol className="mt-3 space-y-2.5">
        {[
          ["1", "Категорія", "8 напрямів медицини"],
          ["2", "Підкатегорія", "конкретний фах усередині"],
          ["3", "Фахівець", "5–8 профілів, рейтинг за ймовірністю"],
        ].map(([number, title, hint]) => (
          <li key={number} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/12 text-[10px] font-semibold text-white">
              {number}
            </span>
            <span>
              <span className="block text-sm leading-5 text-white">{title}</span>
              <span className="block text-xs leading-5 text-white/55">{hint}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 border-t border-white/12 pt-3 text-xs/5 text-white/50">
        JEV не генерує текст: він обирає серед заданих профілів і повертає ймовірності.
      </p>
    </div>
  );
}

function ManualFallback({
  state,
  onManualCategory,
  onManualSubcategory,
}: {
  state: FlowState;
  onManualCategory: (point: FlowPoint) => void;
  onManualSubcategory: (point: FlowPoint) => void;
}) {
  const options =
    state.step === "category" && !state.category
      ? categories.map((category) => ({ id: category.id, name: category.name }))
      : (categoryById
          .get(state.category?.id as CategoryId)
          ?.subcategories.map((subcategory) => ({ id: subcategory.id, name: subcategory.name })) ?? []);

  return (
    <div className="mt-3">
      <p className="text-xs text-white/60">Або оберіть вручну:</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() =>
              state.step === "category" && !state.category
                ? onManualCategory(option)
                : onManualSubcategory(option)
            }
            className="rounded-full border border-white/25 px-3 py-1.5 text-xs text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            {option.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DecisionConsole({
  state,
  onPick,
  onManualCategory,
  onManualSubcategory,
  onRetry,
  onReset,
  onToggleManual,
}: DecisionConsoleProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.phase === "done") panelRef.current?.focus({ preventScroll: true });
  }, [state.phase]);

  return (
    <section
      id="how"
      aria-label="Журнал рішення JEV"
      className="relative overflow-hidden rounded-hero bg-product-hero p-5 text-white shadow-card sm:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-cyan-400/20 blur-3xl"
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">JEV · журнал рішення</p>
          <ModeBadge state={state} />
        </div>

        <StepTracker state={state} />

        <div
          ref={panelRef}
          tabIndex={-1}
          aria-live="polite"
          className="mt-5 outline-none"
        >
          {state.safety.showEmergency ? (
            <Alert intent="danger" className="mb-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle aria-hidden className="size-4" />
                Можливо, потрібна невідкладна допомога
              </p>
              <p className="mt-1 text-xs/5">
                Біль у грудях із задишкою, раптова слабкість, порушення мовлення, втрата свідомості — телефонуйте
                103 або 112. Результати нижче не замінюють виклик швидкої.
              </p>
            </Alert>
          ) : null}

          {state.phase === "idle" ? <EmptyState /> : null}

          {state.phase === "running" ? (
            <div className="rounded-card bg-white/10 p-4 ring-1 ring-white/15">
              <p className="flex items-center gap-2 text-sm text-white">
                <Loader2 aria-hidden className="size-4 animate-spin" />
                {RUNNING_LABEL[state.step]}
              </p>
              <div className="mt-4 space-y-2">
                {[0, 1, 2].map((row) => (
                  <div
                    key={row}
                    className="shimmer h-10 rounded-tile bg-white/10"
                    style={{ animationDelay: `${row * 120}ms` }}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-white/45">
                Крок {state.step === "category" ? 1 : state.step === "subcategory" ? 2 : 3} з 3
              </p>
            </div>
          ) : null}

          {state.phase === "clarify" ? (
            <ClarifyCard
              state={state}
              manualOpen={state.manual}
              onPick={onPick}
              onManual={state.step === "category" ? onManualCategory : onManualSubcategory}
              onToggleManual={onToggleManual}
            />
          ) : null}

          {state.phase === "done" ? <MatchResults state={state} onReset={onReset} /> : null}

          {state.phase === "error" ? (
            <div className="rounded-card bg-surface p-4 text-ink shadow-soft sm:p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <AlertTriangle aria-hidden className="size-4 text-danger-ink" />
                Не вдалося отримати рішення
              </p>
              <p className="mt-1 text-sm/6 text-body">{state.error}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={onRetry}>
                  Спробувати ще раз
                </Button>
                {state.step !== "doctors" ? (
                  <Button size="sm" variant="outline" onClick={() => onToggleManual(true)}>
                    Обрати вручну
                  </Button>
                ) : null}
              </div>
              {state.manual && state.step !== "doctors" ? (
                <ManualFallback
                  state={state}
                  onManualCategory={onManualCategory}
                  onManualSubcategory={onManualSubcategory}
                />
              ) : null}
              <div className="mt-4 border-t border-line pt-3">
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex items-center gap-1 text-xs font-medium text-purple-700"
                >
                  Почати спочатку <ArrowRight aria-hidden className="size-3.5" />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {state.warning === "fallback_mock" && state.phase !== "error" ? (
          <p className="mt-3 text-[11px] text-white/45">
            JEV недоступний — показано локальний демо-розрахунок.
          </p>
        ) : null}
      </div>
    </section>
  );
}
