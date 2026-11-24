import type { Specialist } from "../types";
import { SpecialistSchema } from "../schemas/doctor";

export const DOCTOR_STORAGE_KEY = "jev-match:local-doctors:v1";

export interface DoctorStore {
  version: 1;
  overrides: Record<string, Specialist>;
  created: Specialist[];
}

export function emptyDoctorStore(): DoctorStore {
  return { version: 1, overrides: {}, created: [] };
}

export function parseDoctorStore(raw: string | null): DoctorStore {
  if (!raw) return emptyDoctorStore();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyDoctorStore();
    const candidate = parsed as Partial<DoctorStore>;
    if (candidate.version !== 1) return emptyDoctorStore();

    const overrides: Record<string, Specialist> = {};
    for (const [id, value] of Object.entries(candidate.overrides ?? {})) {
      const result = SpecialistSchema.safeParse(value);
      if (result.success) overrides[id] = result.data;
    }

    const created = Array.isArray(candidate.created)
      ? candidate.created.flatMap((value) => {
          const result = SpecialistSchema.safeParse(value);
          return result.success ? [result.data] : [];
        })
      : [];

    return { version: 1, overrides, created };
  } catch {
    return emptyDoctorStore();
  }
}

export function serializeDoctorStore(store: DoctorStore): string {
  return JSON.stringify(store);
}

export function mergeDoctors(base: readonly Specialist[], store: DoctorStore): Specialist[] {
  const overrides = store.overrides;
  const merged = base.map((doctor) => overrides[doctor.id] ?? doctor);
  for (const doctor of store.created) {
    if (!overrides[doctor.id]) merged.push(doctor);
  }
  return merged;
}

export function isBaseDoctor(base: readonly Specialist[], id: string): boolean {
  return base.some((doctor) => doctor.id === id);
}

export function saveDoctor(store: DoctorStore, doctor: Specialist, base: readonly Specialist[]): DoctorStore {
  if (isBaseDoctor(base, doctor.id)) {
    return { ...store, overrides: { ...store.overrides, [doctor.id]: doctor } };
  }

  const exists = store.created.some((item) => item.id === doctor.id);
  return {
    ...store,
    created: exists
      ? store.created.map((item) => (item.id === doctor.id ? doctor : item))
      : [...store.created, doctor],
  };
}

export function resetDoctor(store: DoctorStore, id: string): DoctorStore {
  const overrides = { ...store.overrides };
  delete overrides[id];
  return { ...store, overrides };
}

export function deleteLocalDoctor(store: DoctorStore, id: string): DoctorStore {
  return {
    ...resetDoctor(store, id),
    created: store.created.filter((doctor) => doctor.id !== id),
  };
}

export function localDoctorState(
  store: DoctorStore,
  id: string,
): "created" | "edited" | null {
  if (store.created.some((doctor) => doctor.id === id)) return "created";
  if (store.overrides[id]) return "edited";
  return null;
}
