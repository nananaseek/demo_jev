"use client";

import { useCallback, useEffect, useState } from "react";

import type { Specialist } from "../types";
import {
  DOCTOR_STORAGE_KEY,
  deleteLocalDoctor,
  emptyDoctorStore,
  parseDoctorStore,
  resetDoctor,
  saveDoctor,
  serializeDoctorStore,
  type DoctorStore,
} from "./store";

export function useDoctorStore(base: readonly Specialist[]) {
  const [store, setStore] = useState<DoctorStore>(emptyDoctorStore);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hydrate from localStorage (external store) after mount to keep SSR markup stable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStore(parseDoctorStore(window.localStorage.getItem(DOCTOR_STORAGE_KEY)));
    setReady(true);

    function onStorage(event: StorageEvent) {
      if (event.key === DOCTOR_STORAGE_KEY) {
        setStore(parseDoctorStore(event.newValue));
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: DoctorStore) => {
    setStore(next);
    try {
      window.localStorage.setItem(DOCTOR_STORAGE_KEY, serializeDoctorStore(next));
    } catch {
      // Storage can be full or blocked in private mode; the in-memory state still works.
    }
  }, []);

  const save = useCallback(
    (doctor: Specialist) => commit(saveDoctor(store, doctor, base)),
    [base, commit, store],
  );

  const reset = useCallback((id: string) => commit(resetDoctor(store, id)), [commit, store]);

  const remove = useCallback((id: string) => commit(deleteLocalDoctor(store, id)), [commit, store]);

  return { store, ready, save, reset, remove, commit };
}
