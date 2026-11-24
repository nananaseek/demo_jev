"use client";

import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { DecisionConsole } from "@/features/matching/components/DecisionConsole";
import { MatchForm } from "@/features/matching/components/MatchForm";
import { useMatchFlow } from "@/features/matching/hooks/useMatchFlow";

const BUSY_LABEL = {
  category: "JEV обирає категорію…",
  subcategory: "JEV обирає підкатегорію…",
  doctors: "JEV порівнює профілі…",
} as const;

interface MatchExperienceProps {
  specialistCount: number;
  categoryCount: number;
}

export function MatchExperience({ specialistCount, categoryCount }: MatchExperienceProps) {
  const [complaint, setComplaint] = useState("");
  const consoleRef = useRef<HTMLDivElement>(null);
  const { state, submit, pickCandidate, chooseCategory, chooseSubcategory, retry, reset, openManual } =
    useMatchFlow();

  useEffect(() => {
    if (state.phase !== "done") return;
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isMobile && !reducedMotion) {
      consoleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state.phase]);

  function handleSubmit(value: string) {
    setComplaint(value);
    void submit(value);

    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isMobile && !reducedMotion) {
      window.setTimeout(() => {
        consoleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }

  function handleReset() {
    setComplaint("");
    reset();
  }

  return (
    <section
      id="match"
      aria-labelledby="match-title"
      className="scroll-mt-24 grid gap-8 pb-10 pt-8 sm:pt-12 lg:grid-cols-[1.03fr_0.97fr] lg:items-start lg:gap-12 lg:pb-16 lg:pt-16"
    >
      <div className="animate-rise">
        <Badge variant="purple" className="gap-2">
          <span aria-hidden className="size-1.5 rounded-full bg-cyan-400" />
          TypeSafe JEV · інтерактивне демо
        </Badge>

        <h1
          id="match-title"
          className="mt-5 max-w-[19ch] text-balance text-[clamp(2.05rem,4.5vw,3.3rem)] font-bold leading-[1.06] tracking-[-0.025em] text-ink"
        >
          Опишіть, що вас турбує —{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
            підберемо фахівця за 3 кроки
          </span>
        </h1>

        <p className="mt-4 max-w-[54ch] text-base/7 text-body sm:text-lg/8">
          Скарга проходить категорію, підкатегорію і профіль. JEV обирає серед {specialistCount} вигаданих
          фахівців у {categoryCount} категоріях і показує ймовірність кожного кроку — без діагнозів і
          вигаданих порад.
        </p>

        <MatchForm
          value={complaint}
          busy={state.phase === "running"}
          busyLabel={BUSY_LABEL[state.step]}
          onChange={setComplaint}
          onSubmit={handleSubmit}
        />

        <p className="mt-3 text-xs/5 text-muted">
          Приклад: «панічні атаки ввечері, важко дихати, триває два тижні». Не вводьте справжні медичні
          документи чи персональні дані.
        </p>
      </div>

      <div ref={consoleRef} className="scroll-mt-24">
        <DecisionConsole
          state={state}
          onPick={pickCandidate}
          onManualCategory={chooseCategory}
          onManualSubcategory={chooseSubcategory}
          onRetry={retry}
          onReset={handleReset}
          onToggleManual={openManual}
        />
      </div>
    </section>
  );
}
