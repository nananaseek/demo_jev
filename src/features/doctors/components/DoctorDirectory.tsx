"use client";

import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DoctorCatalogCard } from "@/features/doctors/components/DoctorCatalogCard";
import { pluralize } from "@/features/matching/lib/format";
import { useDoctorStore } from "@/features/specialists/local/use-doctor-store";
import { localDoctorState, mergeDoctors } from "@/features/specialists/local/store";
import type { Category, CategoryId, Specialist } from "@/features/specialists/types";
import { cn } from "@/lib/utils";

type SortKey = "rating" | "experience" | "price";

interface DoctorDirectoryProps {
  baseDoctors: readonly Specialist[];
  categories: readonly Category[];
}

function normalize(value: string): string {
  return value.toLocaleLowerCase("uk-UA").trim();
}

export function DoctorDirectory({ baseDoctors, categories }: DoctorDirectoryProps) {
  const { store, ready } = useDoctorStore(baseDoctors);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId | "all">("all");
  const [subcategoryId, setSubcategoryId] = useState("all");
  const [sort, setSort] = useState<SortKey>("rating");

  const doctors = useMemo(() => mergeDoctors(baseDoctors, store), [baseDoctors, store]);
  const categoryById = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);

  const activeCategory = categoryId === "all" ? null : categoryById.get(categoryId) ?? null;
  const localCount = Object.keys(store.overrides).length + store.created.length;

  const visible = useMemo(() => {
    const needle = normalize(query);

    const filtered = doctors.filter((doctor) => {
      if (categoryId !== "all" && doctor.categoryId !== categoryId) return false;
      if (subcategoryId !== "all" && doctor.subcategoryId !== subcategoryId) return false;
      if (!needle) return true;

      const category = categoryById.get(doctor.categoryId);
      const subcategory = category?.subcategories.find((item) => item.id === doctor.subcategoryId);
      const haystack = normalize(
        [
          doctor.name,
          doctor.role,
          doctor.bio,
          doctor.tags.join(" "),
          doctor.approaches.join(" "),
          doctor.languages.join(" "),
          category?.name ?? "",
          subcategory?.name ?? "",
        ].join(" "),
      );
      return haystack.includes(needle);
    });

    return filtered.sort((left, right) => {
      if (sort === "price") return left.priceUah - right.priceUah;
      if (sort === "experience") return right.experienceYears - left.experienceYears;
      return right.rating - left.rating || right.reviews - left.reviews;
    });
  }, [categoryById, categoryId, doctors, query, sort, subcategoryId]);

  const subcategories = activeCategory?.subcategories ?? [];

  function chooseCategory(next: CategoryId | "all") {
    setCategoryId(next);
    setSubcategoryId("all");
  }

  function resetFilters() {
    setQuery("");
    setCategoryId("all");
    setSubcategoryId("all");
    setSort("rating");
  }

  const hasFilters = Boolean(query) || categoryId !== "all" || subcategoryId !== "all";

  return (
    <div className="py-8 sm:py-10">
      <section aria-labelledby="catalog-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-[62ch]">
            <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
              <span aria-hidden className="size-1.5 rounded-full bg-cyan-400" />
              Каталог фахівців
            </span>
            <h1
              id="catalog-title"
              className="mt-3 text-[32px] font-bold leading-[1.08] tracking-tight text-ink sm:text-[42px]"
            >
              Знайдіть свого лікаря
            </h1>
            <p className="mt-2 max-w-[58ch] text-sm/6 text-body sm:text-base/7">
              {doctors.length} вигаданих профілів у 8 напрямах. Шукайте за ім&apos;ям, темою або
              скаргою — або створіть власний профіль у локальному редакторі.
            </p>
          </div>
          <Link
            href="/doctors/editor"
            className="inline-flex h-11 items-center gap-2 rounded-control bg-brand-dark px-5 text-sm font-medium text-white transition-colors hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
          >
            <SlidersHorizontal aria-hidden className="size-4" />
            Редактор лікарів
          </Link>
        </div>

        <div className="mt-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">Напрями</h2>
            {activeCategory && (
              <button
                type="button"
                onClick={() => chooseCategory("all")}
                className="inline-flex min-h-8 items-center gap-1 rounded-control px-2 text-xs font-medium text-purple-700 hover:bg-purple-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
              >
                <X aria-hidden className="size-3.5" />
                Усі напрями
              </button>
            )}
          </div>

          <div className="-mx-5 mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {categories.map((category) => {
              const selected = categoryId === category.id;
              const count = doctors.filter((doctor) => doctor.categoryId === category.id).length;
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => chooseCategory(category.id)}
                  className={cn(
                    "min-w-[240px] snap-start rounded-card border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40 sm:min-w-0",
                    selected
                      ? "border-purple-500 bg-purple-100/70 ring-1 ring-purple-500"
                      : "border-line bg-surface hover:border-purple-300 hover:bg-purple-100/30",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{category.name}</span>
                    <span className="tabular text-xs text-muted">{count}</span>
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1">
                    {category.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-page px-2 py-0.5 text-[11px] text-body"
                      >
                        {tag}
                      </span>
                    ))}
                    {category.tags.length > 3 && (
                      <span className="rounded-full bg-page px-2 py-0.5 text-[11px] text-muted">
                        +{category.tags.length - 3}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {activeCategory && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted">Теми:</span>
              {activeCategory.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setQuery(tag)}
                  className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-body transition-colors hover:border-purple-300 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section aria-label="Пошук у каталозі" className="mt-8 rounded-card border border-line bg-surface p-4 shadow-soft sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
          <label className="grid gap-1.5 text-xs font-medium text-body">
            Пошук
            <span className="relative">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ім'я, тема, скарга або мова"
                className="pl-9"
                aria-label="Пошук лікарів"
              />
            </span>
          </label>

          <label className="grid gap-1.5 text-xs font-medium text-body">
            Підкатегорія
            <Select
              value={subcategoryId}
              onChange={(event) => setSubcategoryId(event.target.value)}
              disabled={!activeCategory}
              aria-label="Фільтр за підкатегорією"
            >
              <option value="all">{activeCategory ? "Усі підкатегорії" : "Спочатку оберіть напрям"}</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </Select>
          </label>

          <label className="grid gap-1.5 text-xs font-medium text-body">
            Сортування
            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              aria-label="Сортування лікарів"
            >
              <option value="rating">За рейтингом</option>
              <option value="experience">За досвідом</option>
              <option value="price">Спочатку дешевші</option>
            </Select>
          </label>

          <Button variant="outline" onClick={resetFilters} disabled={!hasFilters} className="h-11">
            Скинути
          </Button>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-body" aria-live="polite">
          {ready ? `Знайдено ${visible.length} ${pluralize(visible.length, "лікар", "лікарі", "лікарів")}` : "Завантажуємо профілі…"}
        </p>
        {localCount > 0 && (
          <Link
            href="/doctors/editor"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 underline underline-offset-4"
          >
            <Badge variant="cyan">{localCount}</Badge>
            локальних змін у цьому браузері
          </Link>
        )}
      </div>

      {visible.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((doctor) => {
            const category = categoryById.get(doctor.categoryId);
            const subcategory = category?.subcategories.find(
              (item) => item.id === doctor.subcategoryId,
            );
            return (
              <DoctorCatalogCard
                key={doctor.id}
                doctor={doctor}
                categoryName={category?.name ?? doctor.categoryId}
                subcategoryName={subcategory?.name ?? doctor.role}
                localState={localDoctorState(store, doctor.id)}
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-card border border-dashed border-line bg-surface/70 p-10 text-center">
          <p className="text-base font-semibold text-ink">Нічого не знайшли</p>
          <p className="mt-1 text-sm text-body">
            Спробуйте інший запит або скиньте фільтри — у каталозі {doctors.length} профілів.
          </p>
          <Button variant="outline" onClick={resetFilters} className="mt-4">
            Скинути фільтри
          </Button>
        </div>
      )}

      <p className="mt-6 text-xs/5 text-muted">
        Усі профілі вигадані. Локальні зміни зберігаються лише у цьому браузері (localStorage) і не
        впливають на підбір JEV, який використовує згенерований набір.
      </p>
    </div>
  );
}
