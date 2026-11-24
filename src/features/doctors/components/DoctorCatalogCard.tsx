"use client";

import Link from "next/link";
import { CalendarClock, GraduationCap, Languages, Pencil, Star } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatSlot, initials } from "@/features/matching/lib/format";
import type { Specialist } from "@/features/specialists/types";
import { cn } from "@/lib/utils";

const AVATARS = [
  "from-purple-500 to-cyan-400",
  "from-cyan-400 to-mint-500",
  "from-purple-600 to-purple-400",
  "from-mint-500 to-cyan-400",
];

function avatarClass(name: string): string {
  const index = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  return AVATARS[index % AVATARS.length] ?? AVATARS[0];
}

interface DoctorCatalogCardProps {
  doctor: Specialist;
  categoryName: string;
  subcategoryName: string;
  localState: "created" | "edited" | null;
}

export function DoctorCatalogCard({
  doctor,
  categoryName,
  subcategoryName,
  localState,
}: DoctorCatalogCardProps) {
  const [booked, setBooked] = useState(false);

  return (
    <article className="flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-soft transition-shadow hover:shadow-card">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white",
            avatarClass(doctor.name),
          )}
        >
          {initials(doctor.name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold leading-6 text-ink">{doctor.name}</h3>
            <Link
              href={`/doctors/editor?edit=${encodeURIComponent(doctor.id)}`}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-purple-100 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
              aria-label={`Редагувати профіль ${doctor.name}`}
            >
              <Pencil aria-hidden className="size-3.5" />
            </Link>
          </div>
          <p className="text-sm leading-5 text-body">{doctor.role}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Star aria-hidden className="size-3 fill-amber-400 text-amber-400" />
              {doctor.rating.toFixed(1)} ({doctor.reviews})
            </span>
            <span>Досвід {doctor.experienceYears} р.</span>
            <span className="tabular">{doctor.priceUah} ₴</span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant="purple">{subcategoryName}</Badge>
        <Badge variant="neutral">{categoryName}</Badge>
        {localState && (
          <Badge variant="cyan">{localState === "created" ? "локальний" : "змінено"}</Badge>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {doctor.tags.slice(0, 4).map((tag) => (
          <Badge key={tag} variant="neutral">
            {tag}
          </Badge>
        ))}
        {doctor.tags.length > 4 && (
          <Badge variant="neutral" className="tabular">
            +{doctor.tags.length - 4}
          </Badge>
        )}
      </div>

      {doctor.bio && <p className="mt-3 line-clamp-2 text-xs/5 text-body">{doctor.bio}</p>}

      <Collapsible>
        <CollapsibleTrigger className="group mt-2 inline-flex items-center gap-1 text-xs font-medium text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40">
          Детальніше про профіль
          <span aria-hidden className="transition-transform group-data-[state=open]:rotate-180">
            ▾
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <dl className="mt-2 grid gap-2 rounded-tile bg-page p-3 text-xs/5 text-body">
            <div className="flex gap-2">
              <Languages aria-hidden className="mt-0.5 size-3.5 shrink-0 text-muted" />
              <div>
                <dt className="sr-only">Мови</dt>
                <dd>{doctor.languages.join(", ")}</dd>
              </div>
            </div>
            <div className="flex gap-2">
              <GraduationCap aria-hidden className="mt-0.5 size-3.5 shrink-0 text-muted" />
              <div>
                <dt className="sr-only">Освіта</dt>
                <dd>{doctor.education}</dd>
              </div>
            </div>
            <div>
              <dt className="font-medium text-ink">Підходи</dt>
              <dd>{doctor.approaches.join(", ")}</dd>
            </div>
          </dl>
        </CollapsibleContent>
      </Collapsible>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <CalendarClock aria-hidden className="size-3.5" />
          {formatSlot(doctor.nextSlot)}
        </span>
        <Button
          variant="soft"
          size="sm"
          onClick={() => setBooked((value) => !value)}
          aria-pressed={booked}
        >
          {booked ? "Запис вимкнено" : "Записатися"}
        </Button>
      </div>
    </article>
  );
}
