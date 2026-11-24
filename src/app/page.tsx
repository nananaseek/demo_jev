import { SiteFooter } from "@/components/common/site-footer";
import { SiteHeader } from "@/components/common/site-header";
import { TrustStrip } from "@/components/common/trust-strip";
import { MatchExperience } from "@/features/matching/components/MatchExperience";
import { categories, specialists } from "@/features/specialists/data";

export default function Home() {
  const subcategoryCount = categories.reduce(
    (total, category) => total + category.subcategories.length,
    0,
  );

  return (
    <>
      <SiteHeader />
      <main className="relative flex-1">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] overflow-hidden">
          <div className="absolute -left-24 top-8 size-[420px] rounded-full bg-purple-300/30 blur-3xl" />
          <div className="absolute right-0 top-0 size-[360px] rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="mx-auto w-full max-w-[1380px] px-5 sm:px-7">
          <MatchExperience specialistCount={specialists.length} categoryCount={categories.length} />
          <TrustStrip
            specialistCount={specialists.length}
            categoryCount={categories.length}
            subcategoryCount={subcategoryCount}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
