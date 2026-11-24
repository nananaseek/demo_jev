"use client";

import Link from "next/link";
import { Check, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { pluralize } from "@/features/matching/lib/format";
import { SpecialistSchema } from "@/features/specialists/schemas/doctor";
import { useDoctorStore } from "@/features/specialists/local/use-doctor-store";
import { localDoctorState, mergeDoctors } from "@/features/specialists/local/store";
import type { Category, CategoryId, Specialist } from "@/features/specialists/types";
import { cn } from "@/lib/utils";

interface DoctorEditorProps {
  baseDoctors: readonly Specialist[];
  categories: readonly Category[];
  initialEditId?: string;
}

interface FormState {
  id: string;
  name: string;
  role: string;
  categoryId: CategoryId;
  subcategoryId: string;
  experienceYears: string;
  rating: string;
  reviews: string;
  priceUah: string;
  languages: string;
  approaches: string;
  tags: string;
  bio: string;
  education: string;
  nextSlot: string;
}

function localDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const DEFAULT_SLOT = "2026-12-01T09:00";

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function emptyForm(categories: readonly Category[], nextSlot = DEFAULT_SLOT): FormState {
  const category = categories[0];
  const subcategory = category?.subcategories[0];
  return {
    id: "",
    name: "",
    role: subcategory?.name ?? "",
    categoryId: category?.id ?? "mental-health",
    subcategoryId: subcategory?.id ?? "",
    experienceYears: "5",
    rating: "4.8",
    reviews: "0",
    priceUah: "1200",
    languages: "Українська",
    approaches: "консультування",
    tags: category?.tags.slice(0, 2).join(", ") ?? "",
    bio: "",
    education: "",
    nextSlot,
  };
}

function formFromDoctor(doctor: Specialist): FormState {
  return {
    id: doctor.id,
    name: doctor.name,
    role: doctor.role,
    categoryId: doctor.categoryId,
    subcategoryId: doctor.subcategoryId,
    experienceYears: String(doctor.experienceYears),
    rating: String(doctor.rating),
    reviews: String(doctor.reviews),
    priceUah: String(doctor.priceUah),
    languages: doctor.languages.join(", "),
    approaches: doctor.approaches.join(", "),
    tags: doctor.tags.join(", "),
    bio: doctor.bio,
    education: doctor.education,
    nextSlot: localDateTime(doctor.nextSlot),
  };
}

function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-xs font-medium text-body">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[11px]/4 text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-[11px]/4 text-danger-ink">
          {error}
        </p>
      )}
    </div>
  );
}

export function DoctorEditor({ baseDoctors, categories, initialEditId }: DoctorEditorProps) {
  const { store, ready, save, reset, remove } = useDoctorStore(baseDoctors);
  const doctors = useMemo(() => mergeDoctors(baseDoctors, store), [baseDoctors, store]);
  const [form, setForm] = useState<FormState>(() => emptyForm(categories));
  const [query, setQuery] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selected = form.id ? doctors.find((doctor) => doctor.id === form.id) ?? null : null;
  const state = form.id ? localDoctorState(store, form.id) : null;
  const activeCategory = categories.find((category) => category.id === form.categoryId);
  const localCount = Object.keys(store.overrides).length + store.created.length;

  useEffect(() => {
    if (!ready || !initialEditId) return;
    const doctor = doctors.find((item) => item.id === initialEditId);
    // Loading the requested profile from the external localStorage-backed store is a sync,
    // not derived render state.
    if (doctor) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(formFromDoctor(doctor));
    }
  }, [doctors, initialEditId, ready]);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("uk-UA");
    const list = needle
      ? doctors.filter((doctor) =>
          [doctor.name, doctor.role, doctor.tags.join(" "), doctor.categoryId]
            .join(" ")
            .toLocaleLowerCase("uk-UA")
            .includes(needle),
        )
      : doctors;

    return [...list].sort((left, right) => {
      const leftLocal = localDoctorState(store, left.id) ? 0 : 1;
      const rightLocal = localDoctorState(store, right.id) ? 0 : 1;
      return leftLocal - rightLocal || left.name.localeCompare(right.name, "uk");
    });
  }, [doctors, query, store]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function chooseCategory(categoryId: CategoryId) {
    const category = categories.find((item) => item.id === categoryId);
    setForm((current) => ({
      ...current,
      categoryId,
      subcategoryId: category?.subcategories[0]?.id ?? "",
      role: category?.subcategories[0]?.name ?? current.role,
    }));
  }

  function chooseSubcategory(subcategoryId: string) {
    const subcategory = activeCategory?.subcategories.find((item) => item.id === subcategoryId);
    setForm((current) => ({ ...current, subcategoryId, role: subcategory?.name ?? current.role }));
  }

  function startNew() {
    setForm(emptyForm(categories));
    setErrors({});
    setStatus("");
    setConfirmDelete(false);
  }

  function startEdit(doctor: Specialist) {
    setForm(formFromDoctor(doctor));
    setErrors({});
    setStatus("");
    setConfirmDelete(false);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedSlot = new Date(form.nextSlot);
    const nextSlot = Number.isNaN(parsedSlot.getTime()) ? "" : parsedSlot.toISOString();
    const candidate: Specialist = {
      id: form.id || `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId,
      name: form.name.trim(),
      role: form.role.trim(),
      experienceYears: Number(form.experienceYears),
      rating: Number(form.rating.replace(",", ".")),
      reviews: Number(form.reviews),
      priceUah: Number(form.priceUah),
      languages: splitList(form.languages),
      approaches: splitList(form.approaches),
      tags: splitList(form.tags),
      bio: form.bio.trim(),
      education: form.education.trim(),
      nextSlot,
    };

    const parsed = SpecialistSchema.safeParse(candidate);
    const nextErrors: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !nextErrors[key]) nextErrors[key] = issue.message;
      }
    }
    if (!nextSlot) {
      nextErrors.nextSlot = "Оберіть дату й час";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus("Перевірте виділені поля.");
      return;
    }

    save(candidate);
    setForm(formFromDoctor(candidate));
    setErrors({});
    setStatus(form.id ? "Зміни збережено в цьому браузері." : "Лікаря створено локально.");
  }

  function resetOverride() {
    if (!form.id) return;
    reset(form.id);
    const original = baseDoctors.find((doctor) => doctor.id === form.id);
    if (original) setForm(formFromDoctor(original));
    setStatus("Повернуто згенерований профіль.");
  }

  function deleteCreated() {
    if (!form.id) return;
    remove(form.id);
    setForm(emptyForm(categories));
    setConfirmDelete(false);
    setStatus("Локального лікаря видалено.");
  }

  return (
    <div className="py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[62ch]">
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
            <span aria-hidden className="size-1.5 rounded-full bg-cyan-400" />
            Локальний редактор
          </span>
          <h1 className="mt-3 text-[32px] font-bold leading-[1.08] tracking-tight text-ink sm:text-[42px]">
            Керуйте профілями лікарів
          </h1>
          <p className="mt-2 text-sm/6 text-body sm:text-base/7">
            Створюйте й редагуйте профілі без бекенду. Зміни зберігаються в localStorage цього
            браузера та одразу з&apos;являються в каталозі.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/doctors"
            className="inline-flex h-11 items-center rounded-control border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:border-purple-300"
          >
            До каталогу
          </Link>
          <Button onClick={startNew} className="h-11">
            <Plus aria-hidden className="size-4" />
            Новий лікар
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:items-start">
        <section aria-labelledby="editor-list-title" className="order-2 min-w-0 rounded-card border border-line bg-surface p-4 shadow-soft sm:p-5 lg:order-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="editor-list-title" className="text-sm font-semibold text-ink">
              Профілі · {doctors.length}
            </h2>
            <p className="hidden text-xs text-muted sm:block">
              {localCount > 0
                ? `${localCount} ${pluralize(localCount, "локальна зміна", "локальні зміни", "локальних змін")}`
                : "згенерований набір"}
            </p>
          </div>

          <label className="mt-3 grid gap-1.5 text-xs font-medium text-body">
            Пошук у списку
            <span className="relative">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ім'я, роль або тег"
                className="pl-9"
              />
            </span>
          </label>

          <ul className="mt-3 max-h-[62vh] divide-y divide-line overflow-y-auto rounded-tile border border-line">
            {visible.map((doctor) => {
              const doctorState = localDoctorState(store, doctor.id);
              const active = doctor.id === form.id;
              return (
                <li key={doctor.id}>
                  <button
                    type="button"
                    onClick={() => startEdit(doctor)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-500/40",
                      active ? "bg-purple-100/70" : "bg-surface hover:bg-page",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-ink">{doctor.name}</span>
                        {doctorState && (
                          <Badge variant="cyan">
                            {doctorState === "created" ? "локальний" : "змінено"}
                          </Badge>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-body">
                        {doctor.role} · {doctor.tags.slice(0, 2).join(", ")}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular text-muted">{doctor.priceUah} ₴</span>
                  </button>
                </li>
              );
            })}
            {visible.length === 0 && (
              <li className="p-6 text-center text-sm text-body">Нічого не знайдено.</li>
            )}
          </ul>
        </section>

        <section aria-labelledby="editor-form-title" className="order-1 min-w-0 rounded-card border border-line bg-surface p-4 shadow-soft sm:p-5 lg:order-2 lg:sticky lg:top-24">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 id="editor-form-title" className="text-base font-semibold text-ink">
                {selected ? selected.name : "Новий лікар"}
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                {state === "created"
                  ? "Локальний профіль"
                  : state === "edited"
                    ? "Згенерований профіль · змінений локально"
                    : selected
                      ? "Згенерований профіль"
                      : "Заповніть поля й збережіть"}
              </p>
            </div>
            {state && <Badge variant="cyan">{state === "created" ? "локальний" : "змінено"}</Badge>}
          </div>

          <form className="mt-4 grid gap-3" onSubmit={submit} noValidate>
            <Field id="doctor-name" label="Ім'я та прізвище" error={errors.name}>
              <Input
                id="doctor-name"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "doctor-name-error" : undefined}
                autoComplete="off"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="doctor-category" label="Категорія" error={errors.categoryId}>
                <Select
                  id="doctor-category"
                  value={form.categoryId}
                  onChange={(event) => chooseCategory(event.target.value as CategoryId)}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field id="doctor-subcategory" label="Підкатегорія" error={errors.subcategoryId}>
                <Select
                  id="doctor-subcategory"
                  value={form.subcategoryId}
                  onChange={(event) => chooseSubcategory(event.target.value)}
                >
                  {activeCategory?.subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field id="doctor-role" label="Роль у каталозі" error={errors.role}>
              <Input
                id="doctor-role"
                value={form.role}
                onChange={(event) => update("role", event.target.value)}
                aria-invalid={Boolean(errors.role)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field id="doctor-experience" label="Досвід, років" error={errors.experienceYears}>
                <Input
                  id="doctor-experience"
                  type="number"
                  min={0}
                  max={70}
                  value={form.experienceYears}
                  onChange={(event) => update("experienceYears", event.target.value)}
                />
              </Field>
              <Field id="doctor-price" label="Ціна, ₴" error={errors.priceUah}>
                <Input
                  id="doctor-price"
                  type="number"
                  min={0}
                  value={form.priceUah}
                  onChange={(event) => update("priceUah", event.target.value)}
                />
              </Field>
              <Field id="doctor-rating" label="Рейтинг (0–5)" error={errors.rating}>
                <Input
                  id="doctor-rating"
                  inputMode="decimal"
                  value={form.rating}
                  onChange={(event) => update("rating", event.target.value)}
                />
              </Field>
              <Field id="doctor-reviews" label="Відгуки" error={errors.reviews}>
                <Input
                  id="doctor-reviews"
                  type="number"
                  min={0}
                  value={form.reviews}
                  onChange={(event) => update("reviews", event.target.value)}
                />
              </Field>
            </div>

            <Field id="doctor-languages" label="Мови" hint="Через кому" error={errors.languages}>
              <Input
                id="doctor-languages"
                value={form.languages}
                onChange={(event) => update("languages", event.target.value)}
              />
            </Field>

            <Field id="doctor-approaches" label="Підходи" hint="Через кому" error={errors.approaches}>
              <Input
                id="doctor-approaches"
                value={form.approaches}
                onChange={(event) => update("approaches", event.target.value)}
              />
            </Field>

            <Field id="doctor-tags" label="Теги / теми" hint="Через кому; використовуються в пошуку" error={errors.tags}>
              <Input
                id="doctor-tags"
                value={form.tags}
                onChange={(event) => update("tags", event.target.value)}
                aria-invalid={Boolean(errors.tags)}
              />
            </Field>

            <Field id="doctor-bio" label="Про лікаря" error={errors.bio}>
              <Textarea
                id="doctor-bio"
                rows={3}
                value={form.bio}
                onChange={(event) => update("bio", event.target.value)}
                className="min-h-20"
              />
            </Field>

            <Field id="doctor-education" label="Освіта" error={errors.education}>
              <Input
                id="doctor-education"
                value={form.education}
                onChange={(event) => update("education", event.target.value)}
              />
            </Field>

            <Field id="doctor-slot" label="Найближчий слот" error={errors.nextSlot}>
              <Input
                id="doctor-slot"
                type="datetime-local"
                value={form.nextSlot}
                onChange={(event) => update("nextSlot", event.target.value)}
              />
            </Field>

            {status && (
              <p role="status" className="rounded-tile bg-purple-100 px-3 py-2 text-xs text-purple-800">
                {status}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <Button type="submit" className="h-11">
                <Check aria-hidden className="size-4" />
                {form.id ? "Зберегти зміни" : "Створити лікаря"}
              </Button>
              <Button type="button" variant="ghost" onClick={startNew} className="h-11">
                Очистити
              </Button>
              {state === "edited" && (
                <Button type="button" variant="outline" onClick={resetOverride} className="h-11">
                  <RotateCcw aria-hidden className="size-4" />
                  Повернути оригінал
                </Button>
              )}
              {state === "created" &&
                (confirmDelete ? (
                  <span className="flex items-center gap-1">
                    <Button type="button" variant="danger" onClick={deleteCreated} className="h-11">
                      Підтвердити
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setConfirmDelete(false)}
                      className="h-11"
                    >
                      Скасувати
                    </Button>
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setConfirmDelete(true)}
                    className="h-11 text-danger-ink"
                  >
                    <Trash2 aria-hidden className="size-4" />
                    Видалити
                  </Button>
                ))}
            </div>
          </form>
        </section>
      </div>

      {!ready && <p className="mt-4 text-xs text-muted">Завантажуємо локальні зміни…</p>}
    </div>
  );
}
