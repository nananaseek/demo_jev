import { describe, expect, it } from "vitest";

import { specialists } from "@/features/specialists/data";
import {
  deleteLocalDoctor,
  emptyDoctorStore,
  localDoctorState,
  mergeDoctors,
  parseDoctorStore,
  resetDoctor,
  saveDoctor,
  serializeDoctorStore,
} from "@/features/specialists/local/store";
import type { Specialist } from "@/features/specialists/types";

const baseDoctor = specialists[0];

function copy(overrides: Partial<Specialist> = {}): Specialist {
  return { ...baseDoctor, ...overrides };
}

describe("local doctor store", () => {
  it("returns an empty store for missing, broken or foreign payloads", () => {
    expect(parseDoctorStore(null)).toEqual(emptyDoctorStore());
    expect(parseDoctorStore("{not json")).toEqual(emptyDoctorStore());
    expect(parseDoctorStore(JSON.stringify({ version: 2 }))).toEqual(emptyDoctorStore());
  });

  it("drops invalid entries but keeps valid overrides and created doctors", () => {
    const created = copy({ id: "local-1", name: "Локальний Лікар" });
    const raw = serializeDoctorStore({
      version: 1,
      overrides: { [baseDoctor.id]: copy({ name: "Змінений Лікар" }), broken: { id: "broken" } as unknown as Specialist },
      created: [created, { id: "invalid" } as unknown as Specialist],
    });

    const parsed = parseDoctorStore(raw);
    expect(parsed.overrides[baseDoctor.id]?.name).toBe("Змінений Лікар");
    expect(parsed.overrides.broken).toBeUndefined();
    expect(parsed.created).toHaveLength(1);
    expect(parsed.created[0]?.id).toBe("local-1");
  });

  it("merges overrides in place and appends created doctors", () => {
    const edited = copy({ name: "Редагований" });
    const created = copy({ id: "local-2", name: "Створений" });
    const merged = mergeDoctors([baseDoctor], {
      version: 1,
      overrides: { [baseDoctor.id]: edited },
      created: [created],
    });

    expect(merged.map((doctor) => doctor.name)).toEqual(["Редагований", "Створений"]);
  });

  it("saves base doctors as overrides and created doctors in the created list", () => {
    const edited = copy({ name: "Редагований" });
    const withOverride = saveDoctor(emptyDoctorStore(), edited, [baseDoctor]);
    expect(localDoctorState(withOverride, baseDoctor.id)).toBe("edited");

    const created = copy({ id: "local-3", name: "Новий" });
    const withCreated = saveDoctor(emptyDoctorStore(), created, [baseDoctor]);
    expect(localDoctorState(withCreated, "local-3")).toBe("created");

    const renamed = { ...created, name: "Перейменований" };
    const updated = saveDoctor(withCreated, renamed, [baseDoctor]);
    expect(updated.created).toHaveLength(1);
    expect(updated.created[0]?.name).toBe("Перейменований");
  });

  it("resets overrides without touching created doctors", () => {
    const store = {
      version: 1 as const,
      overrides: { [baseDoctor.id]: copy({ name: "Редагований" }) },
      created: [copy({ id: "local-4" })],
    };
    const reset = resetDoctor(store, baseDoctor.id);
    expect(reset.overrides).toEqual({});
    expect(reset.created).toHaveLength(1);
    expect(localDoctorState(reset, baseDoctor.id)).toBeNull();
  });

  it("deletes created doctors and their override, if any", () => {
    const store = {
      version: 1 as const,
      overrides: { "local-5": copy({ id: "local-5" }) },
      created: [copy({ id: "local-5" })],
    };
    const next = deleteLocalDoctor(store, "local-5");
    expect(next.created).toHaveLength(0);
    expect(next.overrides["local-5"]).toBeUndefined();
  });
});
