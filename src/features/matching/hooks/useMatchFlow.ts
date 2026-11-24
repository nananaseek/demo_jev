"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

import type { MatchRequest } from "@/features/matching/schemas/match";
import type { CategoryId } from "@/features/specialists/types";
import type {
  MatchCandidate,
  MatchDoctor,
  MatchMode,
  MatchResponse,
  MatchSafety,
  MatchSelected,
  MatchStep,
  MatchWarning,
} from "@/features/matching/types";

export type FlowPhase = "idle" | "running" | "clarify" | "done" | "error";

export interface FlowPoint {
  id: string;
  name: string;
}

export interface FlowState {
  phase: FlowPhase;
  step: MatchStep;
  complaint: string;
  category: FlowPoint | null;
  subcategory: FlowPoint | null;
  candidates: MatchCandidate[];
  doctors: MatchDoctor[];
  selected: MatchSelected | null;
  safety: MatchSafety;
  mode: MatchMode | null;
  warning?: MatchWarning;
  error: string | null;
  manual: boolean;
}

const initialState: FlowState = {
  phase: "idle",
  step: "category",
  complaint: "",
  category: null,
  subcategory: null,
  candidates: [],
  doctors: [],
  selected: null,
  safety: { emergencyProbability: 0, showEmergency: false },
  mode: null,
  warning: undefined,
  error: null,
  manual: false,
};

const MIN_STEP_MS = 350;

type Action =
  | { type: "submit"; complaint: string }
  | { type: "step"; step: MatchStep }
  | { type: "category"; response: MatchResponse }
  | { type: "subcategory"; response: MatchResponse }
  | { type: "doctors"; response: MatchResponse }
  | { type: "clarify"; step: MatchStep; candidates: MatchCandidate[] }
  | { type: "pick"; step: MatchStep; id: string; name: string }
  | { type: "manual"; open: boolean }
  | { type: "error"; message: string }
  | { type: "reset" };

function mergeSafety(current: MatchSafety, next: MatchSafety): MatchSafety {
  return {
    emergencyProbability: Math.max(current.emergencyProbability, next.emergencyProbability),
    showEmergency: current.showEmergency || next.showEmergency,
  };
}

function reducer(state: FlowState, action: Action): FlowState {
  switch (action.type) {
    case "submit":
      return { ...initialState, phase: "running", step: "category", complaint: action.complaint };
    case "step":
      return { ...state, phase: "running", step: action.step, error: null, candidates: [] };
    case "category": {
      const { response } = action;
      return {
        ...state,
        phase: response.needsClarification ? "clarify" : "running",
        step: "category",
        category: { id: response.selected.id, name: response.selected.name },
        selected: response.selected,
        candidates: response.candidates,
        safety: mergeSafety(state.safety, response.safety),
        mode: response.mode,
        warning: response.warning,
      };
    }
    case "subcategory": {
      const { response } = action;
      return {
        ...state,
        phase: response.needsClarification ? "clarify" : "running",
        step: "subcategory",
        subcategory: { id: response.selected.id, name: response.selected.name },
        selected: response.selected,
        candidates: response.candidates,
        safety: mergeSafety(state.safety, response.safety),
        mode: response.mode,
        warning: response.warning ?? state.warning,
      };
    }
    case "doctors": {
      const { response } = action;
      return {
        ...state,
        phase: "done",
        step: "doctors",
        doctors: response.doctors ?? [],
        selected: response.selected,
        candidates: response.candidates,
        safety: mergeSafety(state.safety, response.safety),
        mode: response.mode,
        warning: response.warning ?? state.warning,
      };
    }
    case "clarify":
      return { ...state, phase: "clarify", step: action.step, candidates: action.candidates };
    case "pick": {
      const point = { id: action.id, name: action.name };
      return {
        ...state,
        phase: "running",
        candidates: [],
        category: action.step === "category" ? point : state.category,
        subcategory: action.step === "subcategory" ? point : state.subcategory,
      };
    }
    case "manual":
      return { ...state, manual: action.open };
    case "error":
      return { ...state, phase: "error", error: action.message };
    case "reset":
      return initialState;
    default:
      return state;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postMatch(body: MatchRequest): Promise<MatchResponse> {
  const response = await fetch("/api/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data && typeof data.message === "string"
        ? data.message
        : "Не вдалося отримати відповідь JEV";
    throw new Error(message);
  }
  return data as MatchResponse;
}

export function useMatchFlow() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  const runId = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const call = useCallback(async (body: MatchRequest): Promise<MatchResponse> => {
    const [response] = await Promise.all([postMatch(body), delay(MIN_STEP_MS)]);
    return response;
  }, []);

  const startDoctors = useCallback(
    async (run: number, complaint: string, categoryId: string, subcategoryId: string) => {
      dispatch({ type: "step", step: "doctors" });
      try {
        const response = await call({ step: "doctors", complaint, categoryId: categoryId as CategoryId, subcategoryId });
        if (runId.current !== run) return;
        dispatch({ type: "doctors", response });
      } catch (error) {
        if (runId.current !== run) return;
        dispatch({ type: "error", message: error instanceof Error ? error.message : "Помилка запиту" });
      }
    },
    [call],
  );

  const startSubcategory = useCallback(
    async (run: number, complaint: string, categoryId: string) => {
      dispatch({ type: "step", step: "subcategory" });
      try {
        const response = await call({ step: "subcategory", complaint, categoryId: categoryId as CategoryId });
        if (runId.current !== run) return;
        dispatch({ type: "subcategory", response });
        if (response.needsClarification) return;
        await startDoctors(run, complaint, categoryId, response.selected.id);
      } catch (error) {
        if (runId.current !== run) return;
        dispatch({ type: "error", message: error instanceof Error ? error.message : "Помилка запиту" });
      }
    },
    [call, startDoctors],
  );

  const submit = useCallback(
    async (complaint: string) => {
      const run = runId.current + 1;
      runId.current = run;
      dispatch({ type: "submit", complaint });
      try {
        const response = await call({ step: "category", complaint });
        if (runId.current !== run) return;
        dispatch({ type: "category", response });
        if (response.needsClarification) return;
        await startSubcategory(run, complaint, response.selected.id);
      } catch (error) {
        if (runId.current !== run) return;
        dispatch({ type: "error", message: error instanceof Error ? error.message : "Помилка запиту" });
      }
    },
    [call, startSubcategory],
  );

  const pickCandidate = useCallback(
    async (candidate: MatchCandidate) => {
      const current = stateRef.current;
      const run = runId.current;
      dispatch({ type: "pick", step: current.step, id: candidate.id, name: candidate.name });
      if (current.step === "category") {
        await startSubcategory(run, current.complaint, candidate.id);
      } else if (current.step === "subcategory") {
        await startDoctors(run, current.complaint, current.category?.id ?? "", candidate.id);
      }
    },
    [startDoctors, startSubcategory],
  );

  const chooseCategory = useCallback(
    async (point: FlowPoint) => {
      const current = stateRef.current;
      const run = runId.current;
      dispatch({ type: "pick", step: "category", id: point.id, name: point.name });
      await startSubcategory(run, current.complaint, point.id);
    },
    [startSubcategory],
  );

  const chooseSubcategory = useCallback(
    async (point: FlowPoint) => {
      const current = stateRef.current;
      const run = runId.current;
      if (!current.category) return;
      dispatch({ type: "pick", step: "subcategory", id: point.id, name: point.name });
      await startDoctors(run, current.complaint, current.category.id, point.id);
    },
    [startDoctors],
  );

  const retry = useCallback(async () => {
    const current = stateRef.current;
    const run = runId.current + 1;
    runId.current = run;
    if (!current.category) {
      await submit(current.complaint);
    } else if (!current.subcategory) {
      await startSubcategory(run, current.complaint, current.category.id);
    } else {
      await startDoctors(run, current.complaint, current.category.id, current.subcategory.id);
    }
  }, [startDoctors, startSubcategory, submit]);

  const reset = useCallback(() => {
    runId.current += 1;
    dispatch({ type: "reset" });
  }, []);

  const openManual = useCallback((open: boolean) => dispatch({ type: "manual", open }), []);

  return { state, submit, pickCandidate, chooseCategory, chooseSubcategory, retry, reset, openManual };
}
