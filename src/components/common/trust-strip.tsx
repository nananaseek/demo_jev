import { Layers, ListChecks, ShieldCheck, Sparkles } from "lucide-react";

interface TrustStripProps {
  specialistCount: number;
  categoryCount: number;
  subcategoryCount: number;
}

export function TrustStrip({ specialistCount, categoryCount, subcategoryCount }: TrustStripProps) {
  const items = [
    {
      icon: Layers,
      title: `${categoryCount} категорій`,
      text: `${subcategoryCount} підкатегорій — від психічного здоров'я до педіатрії`,
    },
    {
      icon: ListChecks,
      title: "3 кроки",
      text: "категорія → підкатегорія → конкретний фахівець",
    },
    {
      icon: Sparkles,
      title: `${specialistCount} профілів`,
      text: "вигадані лікарі з тегами, підходами й досвідом",
    },
    {
      icon: ShieldCheck,
      title: "Ймовірності, не діагноз",
      text: "кожен вибір JEV супроводжується числовою впевненістю",
    },
  ];

  return (
    <section aria-label="Що всередині демо" className="border-y border-line py-8 sm:py-10">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-tile bg-purple-100 text-purple-700">
              <Icon aria-hidden className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-xs/5 text-muted">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
