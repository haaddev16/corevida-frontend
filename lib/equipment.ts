import type { EquipmentLoads } from "./storage";

export const LOAD_OPTIONS: Record<keyof EquipmentLoads, string[]> = {
  dumbbells: ["10kg", "15kg", "20kg", "25kg", "30kg", "35kg", "40kg", "45kg", "50kg"],
  kettlebells: ["8kg", "12kg", "16kg", "20kg", "24kg"],
  barbell: ["10kg", "15kg", "20kg", "25kg", "40kg"],
};

export const SET_OPTIONS = [2, 3, 4, 5];

export function showsLoadPicker(equipment: string[], kind: keyof EquipmentLoads) {
  if (equipment.includes("none")) return false;
  if (equipment.includes("full gym")) return true;
  return equipment.includes(kind);
}

export function uniqueLoads(loads: EquipmentLoads) {
  return [...new Set([...loads.dumbbells, ...loads.kettlebells, ...loads.barbell])];
}

export function weightChoices(loads: EquipmentLoads) {
  const chosen = uniqueLoads(loads);
  return chosen.length ? chosen : LOAD_OPTIONS.dumbbells;
}

const NON_WEIGHTED =
  /walk|jog|run|plank|stretch|mobility|yoga|rest|stroll|cardio|breath|foam|meditat|swim|cycl|hik|cool.?down|warm.?up/;
const STRENGTH =
  /squat|press|row|curl|deadlift|lunge|bench|fly|raise|dumbbell|barbell|kettle|pull|push|hinge|extension|dip|thruster|snatch|clean|swing|goblet|hip thrust|split squat|rdl|romanian/;

export function hasSetsPicker(name: string, sets: number) {
  if (sets > 1) return true;
  return STRENGTH.test(name.toLowerCase());
}

export function hasWeightedGear(equipment: string[] | null, loads: EquipmentLoads) {
  if (equipment?.includes("none")) return false;
  if (equipment?.some((item) => ["dumbbells", "kettlebells", "barbell", "full gym"].includes(item))) {
    return true;
  }
  if (uniqueLoads(loads).length > 0) return true;
  return equipment === null;
}

export function hasWeightPicker(name: string) {
  const n = name.toLowerCase();
  if (NON_WEIGHTED.test(n)) return false;
  if (/bodyweight|push-up|push up|sit-up|burpee/.test(n) && !/dumbbell|barbell|weight|kettle/.test(n)) {
    return false;
  }
  return STRENGTH.test(n) || /weight/.test(n);
}
