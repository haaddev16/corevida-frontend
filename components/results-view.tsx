"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/animated-background";
import { SceneSides } from "@/components/scene-sides";
import { SiteNav } from "@/components/site-nav";
import {
  CheckIcon,
  CountUp,
  ErrorBanner,
  GlassCard,
  LoadingDots,
  ProgressRing,
} from "@/components/ui";
import { api, friendlyPlanError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { hasSetsPicker, hasWeightedGear, hasWeightPicker, LOAD_OPTIONS, SET_OPTIONS, weightChoices } from "@/lib/equipment";
import {
  firstName,
  readEquipmentAvailable,
  readEquipmentLoads,
  readExercisePicks,
  readPlan,
  saveExercisePicks,
  savePlan,
  useSession,
  type ExercisePick,
} from "@/lib/storage";
import { displayText } from "@/lib/text";
import type { AgentRun, DayPlan, Habit, Meal, Plan } from "@/lib/types";

type Tab = "nutrition" | "fitness" | "habits";

export function ResultsView({ planIdFromRoute }: { planIdFromRoute?: string }) {
  const router = useRouter();
  const session = useSession();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [tab, setTab] = useState<Tab>("nutrition");
  const [mounted, setMounted] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [runs, setRuns] = useState<AgentRun[] | null>(null);
  const [showTrace, setShowTrace] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!session.ready) return;

    const requestedId = (planIdFromRoute || "").trim();
    const cached = readPlan();
    const planId = requestedId || session.planId || cached?.plan_id || "";

    if (!planId) {
      router.replace(session.userId ? "/home" : "/auth");
      return;
    }

    let cancelled = false;

    if (cached?.plan_id === planId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate matching cache only
      setPlan(cached);
    } else {
      setPlan(null);
      setError("");
    }

    api
      .getPlan(planId)
      .then((loaded) => {
        if (cancelled) return;
        if (requestedId && loaded.plan_id && loaded.plan_id !== requestedId) {
          setError("That plan could not be opened.");
          return;
        }
        setPlan(loaded);
        if (!requestedId) savePlan(loaded);
      })
      .catch((err) => {
        if (!cancelled) setError(friendlyPlanError(err));
      });

    return () => {
      cancelled = true;
    };
  }, [session.ready, session.planId, session.userId, planIdFromRoute, router]);

  async function loadTrace() {
    if (!plan?.plan_id || runs) {
      setShowTrace((v) => !v);
      return;
    }
    try {
      setRuns(await api.getAgentRuns(plan.plan_id));
      setShowTrace(true);
    } catch {
      setShowTrace(true);
    }
  }

  if (error) {
    return (
      <PageShell image="/loading-plan-bg.png" className="flex min-h-dvh items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4">
          <ErrorBanner message={error} />
        </div>
      </PageShell>
    );
  }

  if (!plan) {
    return (
      <PageShell image="/loading-plan-bg.png" className="flex min-h-dvh items-center justify-center text-sage">
        <LoadingDots className="bg-sage" />
      </PageShell>
    );
  }

  const calories = plan.nutrition_plan.daily_calorie_target;

  return (
    <PageShell image="/loading-plan-bg.png">
      <SceneSides left="Better Health Bigger Goals" right="Small Steps Big Results" />
      <SiteNav userName={session.userName} planId={plan.plan_id} />
      <div
        className="mx-auto max-w-[900px] px-4 py-8 pb-20 sm:px-6 sm:py-10"
        style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }}
      >
        <GlassCard hover className="fx-rise mb-6 p-6 sm:p-9">
          <div className="flex flex-col gap-7 lg:flex-row">
            <div className="min-w-0 flex-1">
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-energy/30 bg-energy/12 px-3 py-1 text-[0.75rem] font-semibold tracking-[0.05em] text-energy uppercase">
                ✨ Your plan is ready
              </div>
              <h1 className="fx-flutter-in mb-3.5 font-display text-[clamp(1.5rem,3vw,2rem)] leading-snug font-bold tracking-[-0.02em] text-forest">
                Hey {firstName(session.userName)}, here&apos;s your personalized program.
              </h1>
              <p className="fx-fade-in mb-5 max-w-[480px] text-[0.9rem] leading-relaxed text-ink">
                {displayText(plan.final_plan.summary)}
              </p>
              <div className="flex flex-col gap-2">
                {plan.final_plan.key_recommendations.map((rec, i) => (
                  <div key={rec} className="fx-rec flex items-start gap-2.5" style={{ animationDelay: `${0.08 * i}s` }}>
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-teal/10 text-[0.65rem] font-bold text-teal-light">
                      {i + 1}
                    </span>
                    <span className="text-[0.85rem] leading-relaxed text-ink">{displayText(rec)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-3">
              <div className="fx-ring-halo relative flex items-center justify-center">
                <ProgressRing pct={72} />
                <div className="absolute text-center">
                  <div className="font-mono text-[1.3rem] font-bold text-forest">
                    <CountUp target={calories} />
                  </div>
                  <div className="mt-0.5 text-[0.6rem] font-semibold text-sage">kcal a day</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-[0.78rem] font-semibold text-ink">Daily target</div>
                <div className="text-[0.72rem] text-sage">Based on your profile</div>
              </div>
            </div>
          </div>
        </GlassCard>

        {(plan.final_plan.nutrition_highlights ||
          plan.final_plan.fitness_highlights ||
          plan.final_plan.habit_highlights) && (
          <div className="fx-stagger mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { title: "Nutrition", text: plan.final_plan.nutrition_highlights, icon: "🥗" },
              { title: "Fitness", text: plan.final_plan.fitness_highlights, icon: "🏋️" },
              { title: "Habits", text: plan.final_plan.habit_highlights, icon: "✅" },
            ]
              .filter((card) => card.text)
              .map((card) => (
                <GlassCard key={card.title} hover className="p-5">
                  <div className="mb-2 text-lg">{card.icon}</div>
                  <div className="mb-1 text-sm font-semibold text-forest">{card.title}</div>
                  <p className="text-[0.82rem] leading-relaxed text-muted">{displayText(card.text)}</p>
                </GlassCard>
              ))}
          </div>
        )}

        <div className="mb-5 flex flex-wrap gap-2">
          {(["nutrition", "fitness", "habits"] as Tab[]).map((item, i) => {
            const labels = { nutrition: "🥗 Nutrition", fitness: "🏋️ Fitness", habits: "✅ Habits" };
            const active = tab === item;
            return (
              <button
                key={item}
                onClick={() => setTab(item)}
                style={{ animationDelay: `${0.06 * i}s` }}
                className={cn(
                  "fx-tab rounded-full border-[1.5px] px-5 py-2.5 text-[0.88rem] backdrop-blur-sm transition-all",
                  active
                    ? "border-teal bg-[linear-gradient(135deg,#1e7a6e,#2a9d8f)] font-semibold text-white shadow-[0_3px_14px_rgba(30,122,110,0.25)]"
                    : "border-white/12 bg-white/6 text-muted",
                )}
              >
                {labels[item]}
              </button>
            );
          })}
        </div>

        <div key={tab} className="animate-tab">
          {tab === "nutrition" && (
            <NutritionTab meals={plan.nutrition_plan.meals} notes={plan.nutrition_plan.notes} target={calories} />
          )}
          {tab === "fitness" && (
            <FitnessTab
              planId={plan.plan_id}
              schedule={plan.fitness_plan.weekly_schedule}
              notes={plan.fitness_plan.notes}
              expandedDay={expandedDay}
              setExpandedDay={setExpandedDay}
            />
          )}
          {tab === "habits" && <HabitsTab habits={plan.habit_checklist.habits} />}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-full bg-[linear-gradient(135deg,#1e7a6e,#2a9d8f)] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(30,122,110,0.28)]"
          >
            Track habits →
          </button>
          <button
            onClick={() => router.push("/intake")}
            className="rounded-full bg-sage/12 px-6 py-3 text-sm font-medium text-ink"
          >
            Regenerate
          </button>
          <button onClick={loadTrace} className="rounded-full px-6 py-3 text-sm font-medium text-teal-light">
            {showTrace ? "Hide agent trace" : "How it was built"}
          </button>
        </div>

        {showTrace && (
          <GlassCard className="mt-5 p-5">
            <div className="mb-3 text-sm font-semibold text-forest">Agent handoffs</div>
            {runs && runs.length > 0 ? (
              <div className="flex flex-col gap-2">
                {runs.map((run) => (
                  <details key={run.id} className="rounded-xl bg-white/5 px-4 py-3">
                    <summary className="cursor-pointer text-sm font-medium capitalize text-teal-light">
                      {run.agent_name}
                    </summary>
                    <pre className="mt-2 overflow-x-auto text-[0.72rem] leading-relaxed text-muted">
                      {JSON.stringify(run.output, null, 2)}
                    </pre>
                  </details>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No agent trace is stored for this plan yet.</p>
            )}
          </GlassCard>
        )}
      </div>
    </PageShell>
  );
}

function NutritionTab({ meals, notes, target }: { meals: Meal[]; notes: string; target: number }) {
  const colors = ["#2a9d8f", "#7fad8b", "#e8856a", "#a8ceb0", "#f5c95e", "#b0d4ce"];
  const icons = ["🌅", "☀️", "🥗", "🍎", "🌙", "🌛"];
  return (
    <div className="fx-stagger flex flex-col gap-3.5">
      {meals.map((meal, i) => (
        <GlassCard key={`${meal.name}-${i}`} hover className="flex items-center gap-4 px-5 py-5 sm:px-6">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
            style={{ background: `${colors[i % colors.length]}18`, border: `1.5px solid ${colors[i % colors.length]}30` }}
          >
            {icons[i] || "🍽️"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="text-[0.92rem] font-semibold text-forest">{displayText(meal.name)}</span>
              <span
                className="shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[0.82rem] font-bold"
                style={{ color: colors[i % colors.length], background: `${colors[i % colors.length]}12` }}
              >
                {meal.estimated_calories} kcal
              </span>
            </div>
            <p className="text-[0.85rem] leading-relaxed text-muted">{displayText(meal.description)}</p>
          </div>
        </GlassCard>
      ))}
      <GlassCard className="border-teal-mid/18 bg-teal-mid/6 px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="text-[0.88rem] font-semibold text-teal-mid">Total daily target</span>
          <span className="font-mono text-base font-bold text-teal-light">{target.toLocaleString()} kcal</span>
        </div>
      </GlassCard>
      {notes && <CoachNote notes={notes} />}
    </div>
  );
}

function FitnessTab({
  planId,
  schedule,
  notes,
  expandedDay,
  setExpandedDay,
}: {
  planId: string;
  schedule: DayPlan[];
  notes: string;
  expandedDay: string | null;
  setExpandedDay: (day: string | null) => void;
}) {
  const colors: Record<string, string> = {
    Monday: "#2a9d8f",
    Tuesday: "#7fad8b",
    Wednesday: "#e8856a",
    Thursday: "#a8ceb0",
    Friday: "#1e7a6e",
    Saturday: "#f5c95e",
    Sunday: "#b0d4ce",
  };
  const icons = ["💪", "🚶", "🏋️", "🧘", "⚡", "🚴", "😴"];

  return (
    <div className="flex flex-col gap-2.5">
      <div className="mb-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
        {schedule.map((day) => {
          const color = colors[day.day] || "#7fad8b";
          const open = expandedDay === day.day;
          return (
            <button
              key={day.day}
              onClick={() => setExpandedDay(open ? null : day.day)}
              className="rounded-[14px] border-[1.5px] px-2 py-3.5 text-center backdrop-blur-sm transition-all"
              style={{
                borderColor: open ? color : "rgba(127,173,139,0.22)",
                background: open ? `${color}22` : "rgba(255,255,255,0.06)",
                transform: open ? "scale(1.03)" : "scale(1)",
              }}
            >
              <div className="mb-1 text-[0.68rem] font-bold tracking-[0.05em] uppercase" style={{ color }}>
                {day.day.slice(0, 3)}
              </div>
              <div className="text-[0.72rem] leading-snug text-ink">{displayText(day.focus)}</div>
            </button>
          );
        })}
      </div>
      {expandedDay &&
        (() => {
          const day = schedule.find((item) => item.day === expandedDay);
          if (!day) return null;
          const color = colors[day.day] || "#7fad8b";
          const icon = icons[schedule.findIndex((item) => item.day === expandedDay)] || "🏋️";
          return (
            <GlassCard hover className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[10px] text-lg"
                  style={{ background: `${color}18`, border: `1.5px solid ${color}35` }}
                >
                  {icon}
                </div>
                <div>
                  <div className="font-display text-[1.05rem] font-semibold text-forest">{day.day}</div>
                  <div className="text-[0.82rem] font-medium" style={{ color }}>
                    {displayText(day.focus)}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                {day.exercises.map((exercise) => (
                  <ExerciseRow
                    key={exercise.name}
                    planId={planId}
                    day={day.day}
                    exercise={exercise}
                    color={color}
                  />
                ))}
              </div>
            </GlassCard>
          );
        })()}
      {!expandedDay && (
        <p className="py-2 text-center text-[0.82rem] text-sage">Tap a day to see your exercises</p>
      )}
      {notes && <CoachNote notes={notes} />}
    </div>
  );
}

function HabitsTab({ habits }: { habits: Habit[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  return (
    <div className="fx-stagger flex flex-col gap-3">
      <div className="rounded-xl border border-energy/22 bg-energy/8 px-4 py-3 text-[0.84rem] font-medium text-energy">
        These are your starting habits. Head to the Dashboard to track them daily.
      </div>
      {habits.map((habit, i) => {
        const done = checked.has(i);
        return (
          <GlassCard
            key={habit.name}
            hover
            onClick={() =>
              setChecked((prev) => {
                const next = new Set(prev);
                if (next.has(i)) next.delete(i);
                else next.add(i);
                return next;
              })
            }
            className={cn(
              "flex items-center gap-4 px-5 py-4 transition-all",
              done ? "border-sage/30 bg-sage/10" : "",
            )}
          >
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border-2 transition-all",
                done ? "animate-check border-sage bg-sage" : "border-sage/35",
              )}
            >
              {done && <CheckIcon />}
            </div>
            <div>
              <div className={cn("text-[0.9rem] font-medium", done ? "text-sage line-through" : "text-forest")}>
                {displayText(habit.name)}
              </div>
              <div className="mt-0.5 text-xs text-sage">
                {displayText(habit.frequency)}
                {habit.reason ? ` · ${displayText(habit.reason)}` : ""}
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

function ExerciseRow({
  planId,
  day,
  exercise,
  color,
}: {
  planId: string;
  day: string;
  exercise: { name: string; sets: number; reps: string };
  color: string;
}) {
  const pickKey = `${planId}::${day}::${exercise.name}`;
  const [showWeight, setShowWeight] = useState(false);
  const showSets = hasSetsPicker(exercise.name, exercise.sets);
  const [weights, setWeights] = useState(LOAD_OPTIONS.dumbbells);
  const setChoices = [...new Set([...SET_OPTIONS, exercise.sets].filter((n) => n > 1))].sort((a, b) => a - b);

  const [pick, setPick] = useState<ExercisePick>({
    sets: showSets ? exercise.sets : undefined,
  });

  useEffect(() => {
    const loads = readEquipmentLoads();
    const equipment = readEquipmentAvailable();
    const allowWeight = hasWeightPicker(exercise.name) && hasWeightedGear(equipment, loads);
    const available = weightChoices(loads);
    setShowWeight(allowWeight);
    setWeights(available);
    const saved = readExercisePicks()[pickKey];
    setPick({
      weight: saved?.weight ?? (allowWeight ? available[0] : undefined),
      sets: saved?.sets ?? (showSets ? exercise.sets : undefined),
    });
  }, [pickKey, showSets, exercise.name, exercise.sets]);

  function update(next: ExercisePick) {
    setPick(next);
    const all = readExercisePicks();
    all[pickKey] = next;
    saveExercisePicks(all);
  }

  const sets = pick.sets ?? exercise.sets;
  const badge = showWeight && pick.weight
    ? `${sets > 1 ? `${sets}×${displayText(exercise.reps)}` : displayText(exercise.reps)} · ${pick.weight}`
    : sets > 1
      ? `${sets}×${displayText(exercise.reps)}`
      : displayText(exercise.reps);

  return (
    <div className="rounded-[10px] border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.88rem] font-medium text-forest">{displayText(exercise.name)}</span>
        <span
          className="shrink-0 rounded-md px-2.5 py-0.5 font-mono text-[0.78rem] font-semibold"
          style={{ color, background: `${color}10` }}
        >
          {badge}
        </span>
      </div>
      {(showWeight || showSets) && (
        <div className="mt-3 flex flex-col gap-2.5">
          {showWeight && (
            <PickerRow label="Weight">
              {weights.map((kg) => (
                <MiniChip
                  key={kg}
                  label={kg}
                  selected={pick.weight === kg}
                  color={color}
                  onClick={() => update({ ...pick, weight: kg })}
                />
              ))}
            </PickerRow>
          )}
          {showSets && (
            <PickerRow label="Sets">
              {setChoices.map((n) => (
                <MiniChip
                  key={n}
                  label={`${n}`}
                  selected={sets === n}
                  color={color}
                  onClick={() => update({ ...pick, sets: n })}
                />
              ))}
            </PickerRow>
          )}
        </div>
      )}
    </div>
  );
}

function PickerRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-14 shrink-0 text-[0.68rem] font-semibold tracking-[0.08em] text-sage uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

function MiniChip({
  label,
  selected,
  color,
  onClick,
}: {
  label: string;
  selected: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-2.5 py-1 text-[0.74rem] font-medium transition-all"
      style={{
        borderColor: selected ? color : "rgba(255,255,255,0.12)",
        background: selected ? `${color}22` : "rgba(255,255,255,0.04)",
        color: selected ? "#e8f5f2" : "#9bb8b0",
      }}
    >
      {label}
    </button>
  );
}

function CoachNote({ notes }: { notes: string }) {
  return (
    <div className="rounded-xl border border-sage/20 bg-sage/8 px-4 py-3.5 text-[0.84rem] leading-relaxed text-ink">
      <span className="font-semibold text-teal-light">Coach note: </span>
      {displayText(notes)}
    </div>
  );
}
