import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1380px] items-center justify-between gap-4 px-5 sm:px-7">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-control bg-product-hero text-white">
            <Sparkles aria-hidden className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">JEV Match</span>
          <Badge variant="purple" className="hidden sm:inline-flex">
            демо
          </Badge>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <nav aria-label="Основна навігація" className="flex items-center gap-4 sm:gap-6">
            <Link href="/#how" className="hidden text-sm text-body transition-colors hover:text-purple-700 md:inline">
              Як це працює
            </Link>
            <Link href="/doctors" className="text-sm text-body transition-colors hover:text-purple-700">
              Лікарі
            </Link>
          </nav>

          <Link
            href="/#match"
            className="inline-flex h-9 items-center rounded-control bg-brand-dark px-4 text-sm font-medium text-white transition-colors hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
          >
            Спробувати
          </Link>
        </div>
      </div>
    </header>
  );
}
