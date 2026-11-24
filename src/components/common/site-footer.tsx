import Link from "next/link";
import { Sparkles } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-[1380px] px-5 py-8 sm:px-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-[52ch]">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="flex size-7 items-center justify-center rounded-[10px] bg-product-hero text-white">
                <Sparkles aria-hidden className="size-3.5" />
              </span>
              JEV Match
            </p>
            <p className="mt-2 text-xs/5 text-muted">
              Демонстраційний проєкт: показує, як TypeSafe JEV обирає фахівця у три кроки. Усі категорії,
              підкатегорії та профілі згенеровані — збіг із реальними людьми випадковий.
            </p>
          </div>

          <div className="text-xs/6 text-muted sm:text-right">
            <p>
              Екстрена допомога:{" "}
              <a href="tel:103" className="font-medium text-ink underline underline-offset-4">
                103
              </a>{" "}
              ·{" "}
              <a href="tel:112" className="font-medium text-ink underline underline-offset-4">
                112
              </a>
            </p>
            <p className="mt-1">
              <Link href="/doctors" className="underline underline-offset-4 hover:text-purple-700">
                Каталог лікарів
              </Link>
              {" · "}
              <Link href="/doctors/editor" className="underline underline-offset-4 hover:text-purple-700">
                Редактор лікарів
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 border-t border-line pt-5 text-[11px]/5 text-muted">
          Це не медична порада, не діагностика і не запис до лікаря. Відсотки показують упевненість моделі у
          виборі серед заданих варіантів, а не клінічну точність. Якщо стан гострий — телефонуйте 103.
        </p>
      </div>
    </footer>
  );
}
