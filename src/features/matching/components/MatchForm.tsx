"use client";

import { ArrowRight, Loader2, Mic } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechInput } from "@/features/matching/hooks/use-speech-input";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "Панічні атаки ввечері, важко дихати",
  "Біль у грудях і задишка",
  "Висип на руках, свербить",
  "Болить коліно після бігу",
  "Дитина з температурою 38.5",
];

const MAX_LENGTH = 1000;
const MIN_LENGTH = 12;

interface MatchFormProps {
  value: string;
  busy: boolean;
  busyLabel: string;
  onChange: (value: string) => void;
  onSubmit: (complaint: string) => void;
}

export function MatchForm({ value, busy, busyLabel, onChange, onSubmit }: MatchFormProps) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);

  function appendTranscript(transcript: string) {
    const clean = transcript.replace(/\s+/g, " ").trim();
    if (!clean) return;
    const next = value.trim() ? `${value.trim()} ${clean}` : clean;
    onChange(next.slice(0, MAX_LENGTH));
    setError(null);
  }

  const { listening, interim, error: voiceError, toggle, stop, clearError } = useSpeechInput({
    onTranscript: appendTranscript,
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    stop();
    const complaint = value.trim();
    if (complaint.length < MIN_LENGTH) {
      setError("Опишіть, будь ласка, скаргу хоча б одним реченням.");
      return;
    }
    setError(null);
    onSubmit(complaint);
  }

  return (
    <Card className="mt-7 rounded-[24px] border-white/70 p-5 shadow-card sm:p-6">
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={id} className="text-sm font-semibold text-ink">
            Що вас турбує?
          </label>
          <button
            type="button"
            onClick={toggle}
            disabled={busy}
            aria-pressed={listening}
            aria-label={listening ? "Зупинити голосове введення" : "Надиктувати скаргу голосом"}
            title="Голосове введення: Chrome або Edge"
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40",
              "disabled:pointer-events-none disabled:opacity-60",
              listening
                ? "border-purple-300 bg-purple-100 text-purple-700"
                : "border-line bg-page text-body hover:border-purple-300 hover:bg-purple-100 hover:text-purple-700",
            )}
          >
            {listening ? (
              <span aria-hidden className="size-2 animate-pulse rounded-full bg-purple-600" />
            ) : (
              <Mic aria-hidden className="size-3.5" />
            )}
            {listening ? "Слухаю…" : "Надиктувати"}
          </button>
        </div>
        <p id={`${id}-hint`} className="mt-1 text-xs/5 text-muted">
          Симптоми, як давно триває і що вже пробували. Щонайменше {MIN_LENGTH} символів.
        </p>
        <Textarea
          id={id}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            clearError();
            if (error) setError(null);
          }}
          maxLength={MAX_LENGTH}
          placeholder="Наприклад: панічні атаки ввечері, важко дихати, триває два тижні…"
          aria-describedby={`${id}-hint ${id}-counter`}
          aria-invalid={error ? true : undefined}
          className="mt-3 min-h-[124px]"
          disabled={busy}
        />
        <div className="mt-2 flex items-start justify-between gap-3">
          <p
            className={cn("min-h-4 text-xs", listening ? "text-purple-700" : "text-danger-ink")}
            role={listening ? "status" : error || voiceError ? "alert" : undefined}
          >
            {listening
              ? interim
                ? `Слухаю: «${interim}»`
                : "Слухаю… говоріть українською"
              : error || voiceError || ""}
          </p>
          <p id={`${id}-counter`} className="tabular shrink-0 text-xs text-muted">
            {value.length}/{MAX_LENGTH}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                stop();
                onChange(example);
                setError(null);
              }}
              disabled={busy}
              className={cn(
                "rounded-full border border-line bg-page px-3 py-1.5 text-xs text-body transition-colors",
                "hover:border-purple-300 hover:bg-purple-100 hover:text-purple-700",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40",
                "disabled:pointer-events-none disabled:opacity-60",
              )}
            >
              {example}
            </button>
          ))}
        </div>

        <Button type="submit" size="lg" disabled={busy} className="mt-5 w-full rounded-[14px]">
          {busy ? (
            <>
              <Loader2 aria-hidden className="size-4 animate-spin" />
              {busyLabel}
            </>
          ) : (
            <>
              Підібрати фахівця
              <ArrowRight aria-hidden className="size-4" />
            </>
          )}
        </Button>
        <p className="mt-3 text-center text-[11px]/5 text-muted">
          Демо: профілі вигадані, це не медична порада. Голос розпізнає браузер — демо не
          зберігає аудіо.
        </p>
      </form>
    </Card>
  );
}
