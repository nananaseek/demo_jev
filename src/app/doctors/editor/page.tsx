import type { Metadata } from "next";

import { SiteFooter } from "@/components/common/site-footer";
import { SiteHeader } from "@/components/common/site-header";
import { DoctorEditor } from "@/features/doctors/components/DoctorEditor";
import { categories, specialists } from "@/features/specialists/data";

// The editor reads ?edit=<id>; keep the route blocking instead of prerendering a shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Локальний редактор лікарів — JEV Match",
  description: "Створення та редагування профілів лікарів у localStorage демо-каталогу.",
  robots: { index: false, follow: false },
};

export default async function DoctorEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string | string[] }>;
}) {
  const params = await searchParams;
  const edit = Array.isArray(params.edit) ? params.edit[0] : params.edit;

  return (
    <>
      <SiteHeader />
      <main className="relative flex-1">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] overflow-hidden">
          <div className="absolute -left-24 top-0 size-[320px] rounded-full bg-purple-300/25 blur-3xl" />
          <div className="absolute right-0 top-0 size-[260px] rounded-full bg-cyan-400/10 blur-3xl" />
        </div>
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-7">
          <DoctorEditor baseDoctors={specialists} categories={categories} initialEditId={edit} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
