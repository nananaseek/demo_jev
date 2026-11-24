import type { Metadata } from "next";

import { SiteFooter } from "@/components/common/site-footer";
import { SiteHeader } from "@/components/common/site-header";
import { DoctorDirectory } from "@/features/doctors/components/DoctorDirectory";
import { categories, specialists } from "@/features/specialists/data";

export const metadata: Metadata = {
  title: "Каталог лікарів — JEV Match",
  description:
    "Пошук серед 159 вигаданих профілів за напрямом, темою, мовою та досвідом. Локальний редактор лікарів у демо.",
};

export default function DoctorsPage() {
  return (
    <>
      <SiteHeader />
      <main className="relative flex-1">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
          <div className="absolute -left-24 top-0 size-[360px] rounded-full bg-purple-300/25 blur-3xl" />
          <div className="absolute right-0 top-0 size-[320px] rounded-full bg-cyan-400/10 blur-3xl" />
        </div>
        <div className="mx-auto w-full max-w-[1380px] px-5 sm:px-7">
          <DoctorDirectory baseDoctors={specialists} categories={categories} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
