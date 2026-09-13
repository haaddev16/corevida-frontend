"use client";

import { useEffect, useState } from "react";
import type { Plan } from "./types";

export const STORAGE = {
  userId: "user_id",
  userName: "user_name",
  userEmail: "user_email",
  profileId: "profile_id",
  planId: "plan_id",
  planData: "plan_data",
  equipmentLoads: "equipment_loads",
  equipmentAvailable: "equipment_available",
  exercisePicks: "exercise_picks",
} as const;

export type EquipmentLoads = {
  dumbbells: string[];
  kettlebells: string[];
  barbell: string[];
};

export const EMPTY_LOADS: EquipmentLoads = { dumbbells: [], kettlebells: [], barbell: [] };

export function saveEquipmentLoads(loads: EquipmentLoads) {
  localStorage.setItem(STORAGE.equipmentLoads, JSON.stringify(loads));
}

export function readEquipmentLoads(): EquipmentLoads {
  if (typeof window === "undefined") return EMPTY_LOADS;
  const raw = localStorage.getItem(STORAGE.equipmentLoads);
  if (!raw) return EMPTY_LOADS;
  try {
    const parsed = JSON.parse(raw) as Partial<EquipmentLoads>;
    return {
      dumbbells: parsed.dumbbells ?? [],
      kettlebells: parsed.kettlebells ?? [],
      barbell: parsed.barbell ?? [],
    };
  } catch {
    return EMPTY_LOADS;
  }
}

export function saveEquipmentAvailable(items: string[]) {
  localStorage.setItem(STORAGE.equipmentAvailable, JSON.stringify(items));
}

export function readEquipmentAvailable(): string[] | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE.equipmentAvailable);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return null;
  }
}

export function allLoadLabels(loads: EquipmentLoads) {
  return [...loads.dumbbells, ...loads.kettlebells, ...loads.barbell];
}

export type ExercisePick = { weight?: string; sets?: number };

export function readExercisePicks(): Record<string, ExercisePick> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(STORAGE.exercisePicks);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, ExercisePick>;
  } catch {
    return {};
  }
}

export function saveExercisePicks(picks: Record<string, ExercisePick>) {
  localStorage.setItem(STORAGE.exercisePicks, JSON.stringify(picks));
}

export interface Session {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  profileId: string | null;
  planId: string | null;
}

export function readSession(): Session {
  if (typeof window === "undefined") {
    return { userId: null, userName: null, userEmail: null, profileId: null, planId: null };
  }
  return {
    userId: localStorage.getItem(STORAGE.userId),
    userName: localStorage.getItem(STORAGE.userName),
    userEmail: localStorage.getItem(STORAGE.userEmail),
    profileId: localStorage.getItem(STORAGE.profileId),
    planId: localStorage.getItem(STORAGE.planId),
  };
}

export function saveSession(user: { id: string; name?: string | null; email?: string }) {
  localStorage.setItem(STORAGE.userId, user.id);
  if (user.name) localStorage.setItem(STORAGE.userName, user.name);
  if (user.email) localStorage.setItem(STORAGE.userEmail, user.email);
}

export function saveProfileId(profileId: string) {
  localStorage.setItem(STORAGE.profileId, profileId);
}

export function savePlan(plan: Plan) {
  localStorage.setItem(STORAGE.planId, plan.plan_id);
  localStorage.setItem(STORAGE.planData, JSON.stringify(plan));
}

export function readPlan(): Plan | null {
  const raw = localStorage.getItem(STORAGE.planData);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Plan;
  } catch {
    return null;
  }
}

export function clearPlanCache() {
  localStorage.removeItem(STORAGE.profileId);
  localStorage.removeItem(STORAGE.planId);
  localStorage.removeItem(STORAGE.planData);
}

export function clearSession() {
  Object.values(STORAGE).forEach((key) => localStorage.removeItem(key));
}

export function useSession() {
  const [session, setSession] = useState<Session>({
    userId: null,
    userName: null,
    userEmail: null,
    profileId: null,
    planId: null,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // localStorage is client-only; seed after mount to avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- session bootstrap
    setSession(readSession());
    setReady(true);
  }, []);

  return { ...session, ready };
}

export function firstName(name: string | null | undefined) {
  if (!name) return "there";
  return name.split(" ")[0];
}
