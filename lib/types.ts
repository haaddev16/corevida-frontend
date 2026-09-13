export interface Meal {
  name: string;
  description: string;
  estimated_calories: number;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
}

export interface DayPlan {
  day: string;
  focus: string;
  exercises: Exercise[];
}

export interface Habit {
  name: string;
  frequency: string;
  reminder_time?: string;
  reason?: string;
}

export interface FinalPlan {
  summary: string;
  nutrition_highlights?: string;
  fitness_highlights?: string;
  habit_highlights?: string;
  key_recommendations: string[];
}

export interface Plan {
  plan_id: string;
  user_id?: string;
  profile_id?: string;
  nutrition_plan: {
    daily_calorie_target: number;
    meals: Meal[];
    notes: string;
  };
  fitness_plan: {
    weekly_schedule: DayPlan[];
    notes: string;
  };
  habit_checklist: {
    habits: Habit[];
    notes?: string;
  };
  final_plan: FinalPlan;
  plan_date?: string | null;
  created_at?: string;
}

export interface HabitLog {
  id: string;
  habit_name: string;
  log_date: string;
  completed: boolean;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  created_at?: string;
}

export interface AgentRun {
  id: string;
  agent_name: string;
  input: unknown;
  output: unknown;
  created_at: string;
}

export interface PastPlan {
  plan_id: string;
  profile_id: string;
  plan_date?: string | null;
  created_at: string;
}
