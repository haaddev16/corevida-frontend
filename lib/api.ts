import type { AgentRun, Habit, HabitLog, PastPlan, Plan, UserRecord } from "./types";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

const DEFAULT_TIMEOUT_MS = 25_000;
const LONG_TIMEOUT_MS = 55_000;
const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isLongRunning(path: string) {
  return path.startsWith("/api/plan");
}

function isRetryableStatus(status: number) {
  return status === 0 || status === 408 || status === 429 || status === 502 || status === 503 || status === 504;
}

function shouldRetry(path: string, error: unknown, status?: number) {
  if (path.startsWith("/api/plan")) return false;
  if (status && [400, 401, 403, 404, 422, 500].includes(status)) return false;
  if (status === 429 && isLongRunning(path)) return false;
  if (status && isRetryableStatus(status)) return true;
  if (error instanceof DOMException && error.name === "AbortError") {
    return !isLongRunning(path);
  }
  return true;
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(message: string, status: number, detail: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function extractDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: string }).msg);
        }
        return JSON.stringify(item);
      })
      .join(" ");
  }
  if (detail && typeof detail === "object") return JSON.stringify(detail);
  return "Request failed";
}

export function isQuotaOrServerError(error: unknown) {
  if (error instanceof ApiError && error.status >= 500) return true;
  const text = error instanceof Error ? error.message : String(error);
  return /quota|resource_exhausted|429|rate.?limit|busy/i.test(text);
}

export function friendlyPlanError(error: unknown) {
  if (isQuotaOrServerError(error)) {
    return "Our AI coach is a bit busy, please try again in a moment.";
  }
  if (error instanceof ApiError && error.status === 0) {
    return "The coach is waking up or briefly unreachable. Please try again in a moment.";
  }
  if (error instanceof ApiError) return error.detail;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

const UNREACHABLE =
  "The coach is waking up or briefly unreachable. Please try again in a moment.";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const timeoutMs = isLongRunning(path) ? LONG_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(options?.headers ?? {}),
        },
      });
      clearTimeout(timer);

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = extractDetail((data as { detail?: unknown }).detail);
        const err = new ApiError(detail || res.statusText, res.status, detail || res.statusText);
        if (shouldRetry(path, err, res.status) && attempt < MAX_RETRIES) {
          await sleep(400 * 2 ** (attempt - 1));
          lastError = err;
          continue;
        }
        throw err;
      }
      return data as T;
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof ApiError && !shouldRetry(path, error, error.status)) {
        throw error;
      }
      lastError = error;
      if (shouldRetry(path, error, error instanceof ApiError ? error.status : undefined) && attempt < MAX_RETRIES) {
        await sleep(400 * 2 ** (attempt - 1));
        continue;
      }
    }
  }

  if (lastError instanceof ApiError && lastError.status > 0) throw lastError;
  throw new ApiError(UNREACHABLE, 0, UNREACHABLE);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function normalizeMeals(raw: unknown): Plan["nutrition_plan"]["meals"] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const meal = asRecord(item);
    return {
      name: String(meal.meal_name ?? meal.name ?? "Meal"),
      description: String(meal.description ?? ""),
      estimated_calories: Number(meal.estimated_calories ?? 0),
    };
  });
}

export function normalizeHabits(raw: unknown): Habit[] {
  const obj = asRecord(raw);
  const list = Array.isArray(obj.daily_habits)
    ? obj.daily_habits
    : Array.isArray(obj.habits)
      ? obj.habits
      : Array.isArray(raw)
        ? raw
        : [];

  return list.map((item) => {
    const habit = asRecord(item);
    return {
      name: String(habit.habit_name ?? habit.name ?? ""),
      frequency: String(habit.frequency ?? "Daily"),
      reminder_time: habit.reminder_time ? String(habit.reminder_time) : undefined,
      reason: habit.reason ? String(habit.reason) : undefined,
    };
  });
}

export function normalizePlan(raw: unknown, fallbackId?: string): Plan {
  const data = asRecord(raw);
  const nutrition = asRecord(data.nutrition_plan);
  const fitness = asRecord(data.fitness_plan);
  const habits = asRecord(data.habit_checklist);
  const finalPlan = asRecord(data.final_plan);
  const schedule = Array.isArray(fitness.weekly_schedule) ? fitness.weekly_schedule : [];

  return {
    plan_id: String(data.plan_id ?? fallbackId ?? ""),
    user_id: data.user_id ? String(data.user_id) : undefined,
    profile_id: data.profile_id ? String(data.profile_id) : undefined,
    created_at: data.created_at ? String(data.created_at) : undefined,
    plan_date: data.plan_date ? String(data.plan_date) : null,
    nutrition_plan: {
      daily_calorie_target: Number(nutrition.daily_calorie_target ?? 0),
      meals: normalizeMeals(nutrition.meals),
      notes: String(nutrition.notes ?? ""),
    },
    fitness_plan: {
      weekly_schedule: schedule.map((item) => {
        const day = asRecord(item);
        const exercises = Array.isArray(day.exercises) ? day.exercises : [];
        return {
          day: String(day.day ?? "Day"),
          focus: String(day.focus ?? ""),
          exercises: exercises.map((ex) => {
            const exercise = asRecord(ex);
            return {
              name: String(exercise.name ?? ""),
              sets: Number(exercise.sets ?? 1),
              reps: String(exercise.reps ?? ""),
            };
          }),
        };
      }),
      notes: String(fitness.notes ?? ""),
    },
    habit_checklist: {
      habits: normalizeHabits(habits),
      notes: habits.notes ? String(habits.notes) : undefined,
    },
    final_plan: {
      summary: String(finalPlan.summary ?? ""),
      nutrition_highlights: finalPlan.nutrition_highlights
        ? String(finalPlan.nutrition_highlights)
        : undefined,
      fitness_highlights: finalPlan.fitness_highlights
        ? String(finalPlan.fitness_highlights)
        : undefined,
      habit_highlights: finalPlan.habit_highlights ? String(finalPlan.habit_highlights) : undefined,
      key_recommendations: Array.isArray(finalPlan.key_recommendations)
        ? finalPlan.key_recommendations.map(String)
        : [],
    },
  };
}

export function dateKey(value: string) {
  return String(value).slice(0, 10);
}

export const api = {
  signup(body: { name: string; email: string; password: string }) {
    return request<UserRecord>("/api/signup", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  login(body: { email: string; password: string }) {
    return request<UserRecord>("/api/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  createProfile(body: {
    user_id: string;
    intake: {
      goals: string[];
      age: number;
      weight_kg: number;
      height_cm: number;
      sex: string;
      activity_level: string;
      dietary_restrictions: string[];
      equipment_available: string[];
      time_availability_minutes: number;
    };
  }) {
    return request<{ profile_id: string; user_id: string; profile: unknown }>("/api/profile", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async createPlan(profile_id: string) {
    const raw = await request<unknown>("/api/plan", {
      method: "POST",
      body: JSON.stringify({ profile_id }),
    });
    return normalizePlan(raw);
  },

  async getPlan(planId: string) {
    const raw = await request<unknown>(`/api/plan/${planId}`);
    return normalizePlan(raw, planId);
  },

  async listPlans(userId: string) {
    const raw = await request<unknown[]>(`/api/plan/user/${userId}`);
    return (Array.isArray(raw) ? raw : []).map((item) => {
      const row = asRecord(item);
      return {
        plan_id: String(row.plan_id ?? row.id ?? ""),
        profile_id: String(row.profile_id ?? ""),
        plan_date: row.plan_date ? String(row.plan_date) : null,
        created_at: String(row.created_at ?? ""),
      } satisfies PastPlan;
    }).filter((item) => item.plan_id);
  },

  updatePlanDate(planId: string, body: { user_id: string; plan_date: string }) {
    return request<{ plan_id: string; plan_date: string; created_at: string }>(`/api/plan/${planId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  async getHabits(planId: string) {
    const raw = await request<{ habits: unknown; logs: HabitLog[] }>(`/api/habits/${planId}`);
    return {
      habits: normalizeHabits(raw.habits),
      logs: (raw.logs ?? []).map((log) => ({
        ...log,
        log_date: dateKey(String(log.log_date)),
      })),
    };
  },

  logHabit(body: { plan_id: string; habit_name: string; log_date: string; completed: boolean }) {
    return request<HabitLog>("/api/habits/log", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  getAgentRuns(planId: string) {
    return request<AgentRun[]>(`/api/agent-runs/${planId}`);
  },
};
