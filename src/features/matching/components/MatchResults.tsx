"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { FlowState } from "@/features/matching/hooks/useMatchFlow";
import { SpecialistCard } from "@/features/matching/components/SpecialistCard";
import { pluralize } from "@/features/matching/lib/format";

interface MatchResultsProps {
  state: FlowState;
  onReset: () => void;
}

export function MatchResults({ state, onReset }: MatchResultsProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? state.doctors : state.doctors.slice(0, 3);
  const hiddenCount = state.doctors.length - visible.length;

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Результат підбору</p>
      <p className="mt-1 text-sm text-white/75">
        {state.category?.name ?? "Категорія"}
        <span aria-hidden className="mx-1.5 text-white/40">
          →
        </span>
        {state.subcategory?.name ?? "Підкатегорія"}
      </p>
      <h2 id="match-results-title" className="mt-1 text-xl font-semibold text-white">
        Кому варто звернутися
      </h2>
      <p className="mt-1 text-xs/5 text-white/55">
        Відсоток — оцінка відповідності профілю запиту, не діагноз і не гарантія.
      </p>

      {state.warning === "low_confidence" ? (
        <p className="mt-3 rounded-tile bg-white/10 px-3 py-2 text-xs/5 text-white/75">
          JEV не бачить явного лідера серед профілів — показуємо всі за спаданням ймовірності.
        </p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {visible.map((doctor, index) => (
          <li key={doctor.id} className="animate-rise" style={{ animationDelay: `${index * 60}ms` }}>
            <SpecialistCard doctor={doctor} index={index} />
          </li>
        ))}
      </ul>

      {hiddenCount > 0 ? (
        <Button
          variant="ghost"
          className="mt-3 w-full text-white hover:bg-white/10"
          onClick={() => setExpanded(true)}
        >
          Показати ще {hiddenCount} {pluralize(hiddenCount, "профіль", "профілі", "профілів")}
        </Button>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-3">
        <p className="text-[11px] text-white/45">Дані профілів вигадані для демо</p>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-white/80 underline decoration-white/30 underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          Підібрати ще раз
        </button>
      </div>
    </div>
  );
}
