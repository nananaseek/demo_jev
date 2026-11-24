"use client";

import { CalendarClock, ChevronDown, GraduationCap, Languages, Star } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatSlot, initials } from "@/features/matching/lib/format";
import type { MatchDoctor } from "@/features/matching/types";
import { cn } from "@/lib/utils";

const AVATARS = [
  "from-purple-500 to-cyan-400",
  "from-cyan-400 to-mint-500",
  "from-purple-600 to-purple-400",
  "from-mint-500 to-cyan-400",
];

export function SpecialistCard({ doctor, index }: { doctor: MatchDoctor; index: number }) {
  const [booked, setBooked] = useState(false);
  const extraTags = doctor.tags.filter((tag) => !doctor.matchedTags.includes(tag)).slice(0, 2);

  return (
    <article className="animate-rise rounded-card border border-line bg-surface p-4 text-ink shadow-soft sm:p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white",
            AVATARS[index % AVATARS.length],
          )}
        >
          {initials(doctor.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold leading-6 text-ink">{doctor.name}</h3>
            <Badge variant="match" className="tabular">
              {doctor.matchPercent}%
            </Badge>
          </div>
          <p className="text-sm leading-5 text-body">{doctor.role}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>Досвід {doctor.experienceYears} р.</span>
            <span className="inline-flex items-center gap-1">
              <Star aria-hidden className="size-3 fill-amber-400 text-amber-400" />
              {doctor.rating.toFixed(1)} ({doctor.reviews})
            </span>
            <span className="tabular">{doctor.priceUah} ₴</span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {doctor.matchedTags.map((tag) => (
          <Badge key={tag} variant="cyan">
            {tag}
          </Badge>
        ))}
        {extraTags.map((tag) => (
          <Badge key={tag} variant="neutral">
            {tag}
          </Badge>
        ))}
      </div>

      <p className="mt-3 text-xs/5 text-body">{doctor.rationale}</p>

      <Collapsible>
        <CollapsibleTrigger className="group mt-2 inline-flex items-center gap-1 text-xs font-medium text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40">
          Детальніше про профіль
          <ChevronDown
            aria-hidden
            className="size-3.5 transition-transform group-data-[state=open]:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <dl className="mt-2 grid gap-2 rounded-tile bg-page p-3 text-xs/5 text-body">
            <div>
              <dt className="font-medium text-ink">Про підхід</dt>
              <dd>{doctor.bio}</dd>
            </div>
            <div className="flex items-start gap-2">
              <GraduationCap aria-hidden className="mt-0.5 size-3.5 shrink-0 text-purple-600" />
              <dd>{doctor.education}</dd>
            </div>
            <div className="flex items-start gap-2">
              <Languages aria-hidden className="mt-0.5 size-3.5 shrink-0 text-purple-600" />
              <dd>{doctor.languages.join(", ")}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Підходи</dt>
              <dd>{doctor.approaches.join(", ")}</dd>
            </div>
          </dl>
        </CollapsibleContent>
      </Collapsible>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <CalendarClock aria-hidden className="size-3.5" />
          {booked ? "У демо запис вимкнено" : `Найближчий слот: ${formatSlot(doctor.nextSlot)}`}
        </span>
        <Button size="sm" variant="soft" onClick={() => setBooked(true)}>
          Записатися
        </Button>
      </div>
    </article>
  );
}
