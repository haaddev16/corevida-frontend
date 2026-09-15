"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/animated-background";
import { SceneSides } from "@/components/scene-sides";
import { PlanShareActions } from "@/components/plan-share-actions";
import { SiteNav } from "@/components/site-nav";
import {
  CheckIcon,
  CountUp,
  ErrorBanner,
  GlassCard,
  LoadingDots,
  PrimaryButton,
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

export function ResultsView({
  planIdFromRoute,
  publicView = false,
}: {
  planIdFromRoute?: string;
  publicView?: boolean;
}) {
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
    const requestedId = (planIdFromRoute || "").trim();

    if (publicView) {
      if (!requestedId) {
        setError("That plan could not be opened.");
        return;
      }
      let cancelled = false;
      setPlan(null);
      setError("");
      api
        .getPlan(requestedId)
        .then((loaded) => {
          if (cancelled) return;
          if (loaded.plan_id && loaded.plan_id !== requestedId) {
            setError("That plan could not be opened.");
            return;
          }
          setPlan(loaded);
        })
        .catch((err) => {
          if (!cancelled) setError(friendlyPlanError(err));
        });
      return () => {
        cancelled = true;
      };
    }

    if (!session.ready) return;

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
  }, [publicView, session.ready, session.planId, session.userId, planIdFromRoute, router]);

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
          <PrimaryButton className="w-full" onClick={() => router.push(publicView ? "/" : session.userId ? "/home" : "/auth")}>
            {publicView ? "Back to Corevida" : "Go home"}
          </PrimaryButton>
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
      <SiteNav
        userName={session.userName}
        planId={publicView ? session.planId : plan.plan_id}
      />
      <div
        className="mx-auto max-w-[900px] px-4 py-8 pb-20 sm:px-6 sm:py-10"
        style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }}
      >
        <GlassCard hover className="fx-rise mb-6 p-6 sm:p-9">
          <div className="flex flex-col gap-7 lg:flex-row">
            <div className="min-w-0 flex-1">
              <div className="type-kicker mb-4 inline-flex items-center gap-1.5 rounded-full border border-energy/30 bg-energy/12 px-3 py-1 text-energy">
                {publicView ? "Shared plan" : "✨ Your plan is ready"}
              </div>
              <h1 className="type-h1 fx-flutter-in mb-3.5 text-forest">
                {publicView
                  ? "A Corevida wellness program"
                  : `Hey ${firstName(session.userName)}, here is your personalized program.`}
              </h1>
              {publicView && (
                <p className="type-caption fx-fade-in mb-4 text-sage">
                  This is a public view. The owner can still edit and track habits in their own account.
                </p>
              )}
              <p className="type-body-lg fx-fade-in mb-6 max-w-[620px] text-ink">
                {displayText(plan.final_plan.summary)}
              </p>
              <div className="flex flex-col gap-3">
                {plan.final_plan.key_recommendations.map((rec, i) => (
                  <div key={rec} className="fx-rec flex items-start gap-3" style={{ animationDelay: `${0.08 * i}s` }}>
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal/10 type-stat text-[0.72rem] text-teal-light">
                      {i + 1}
                    </span>
                    <span className="type-body leading-7 text-ink">{displayText(rec)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-3">
              <div className="fx-ring-halo relative flex items-center justify-center">
                <ProgressRing pct={72} />
                <div className="absolute text-center">
                  <div className="type-stat text-[1.35rem] text-forest">
                    <CountUp target={calories} />
                  </div>
                  <div className="type-meta mt-0.5 font-semibold text-sage">kcal a day</div>
                </div>
              </div>
              <div className="text-center">
                <div className="type-title text-ink">Daily target</div>
                <div className="type-caption text-sage">Based on your profile</div>
              </div>
            </div>
          </div>
        </GlassCard>

        <PlanShareActions plan={plan} showShare={!publicView} showLink={publicView} />

        {(plan.final_plan.nutrition_highlights ||
          plan.final_plan.fitness_highlights ||
          plan.final_plan.habit_highlights) && (
          <div className="fx-stagger mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { title: "Nutrition", text: plan.final_plan.nutrition_highlights, icon: "🥗" },
              { title: "Fitness", text: plan.final_plan.fitness_highlights, icon: "🏋️" },
              { title: "Habits", text: plan.final_plan.habit_highlights, icon: "✅" },
            ]
              .filter((card) => card.text)
              .map((card) => (
                <GlassCard key={card.title} hover className="p-6">
                  <div className="mb-2.5 text-xl">{card.icon}</div>
                  <div className="mb-1.5 type-h3 text-forest">{card.title}</div>
                  <p className="type-body text-ink">{displayText(card.text)}</p>
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
                  "fx-tab type-button rounded-full border-[1.5px] px-5 py-2.5 text-[0.92rem] backdrop-blur-sm transition-all",
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
              readOnly={publicView}
            />
          )}
          {tab === "habits" && <HabitsTab habits={plan.habit_checklist.habits} readOnly={publicView} />}
        </div>

        {publicView ? (
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryButton onClick={() => router.push("/auth")}>Build my plan →</PrimaryButton>
          </div>
        ) : (
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="type-button rounded-full bg-[linear-gradient(135deg,#1e7a6e,#2a9d8f)] px-6 py-3 text-white shadow-[0_4px_16px_rgba(30,122,110,0.28)]"
          >
            Track habits →
          </button>
          <button
            onClick={() => router.push("/intake")}
            className="type-button rounded-full bg-sage/12 px-6 py-3 text-ink"
          >
            Regenerate
          </button>
          <button onClick={loadTrace} className="type-button rounded-full px-6 py-3 text-teal-light">
            {showTrace ? "Hide agent trace" : "How it was built"}
          </button>
        </div>
        )}

        {showTrace && !publicView && (
          <GlassCard className="mt-5 p-5">
            <div className="mb-3 type-h3 text-forest">Agent handoffs</div>
            {runs && runs.length > 0 ? (
              <div className="flex flex-col gap-2">
                {runs.map((run) => (
                  <details key={run.id} className="rounded-xl bg-white/5 px-4 py-3">
                    <summary className="type-nav cursor-pointer capitalize text-teal-light">
                      {displayText(run.agent_name)}
                    </summary>
                    <pre className="type-stat mt-2 overflow-x-auto text-[0.72rem] font-normal leading-relaxed tracking-normal text-muted">
                      {JSON.stringify(run.output, null, 2)}
                    </pre>
                  </details>
                ))}
              </div>
            ) : (
              <p className="type-caption text-muted">No agent trace is stored for this plan yet.</p>
            )}
          </GlassCard>
        )}
      </div>
    </PageShell>
  );
}

function NutritionTab({ meals, notes, target }: { meals: Meal[]; notes: string; target: number }) {
  const colors = ["#2a9d8f", "#7fad8b", "#e8856a", "#a8ceb0", "#f5c95e", "#a8ceb0"];
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
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="type-title text-forest">{displayText(meal.name)}</span>
              <span
                className="type-stat shrink-0 rounded-full px-2.5 py-0.5 text-[1.05rem]"
                style={{ color: colors[i % colors.length], background: `${colors[i % colors.length]}12` }}
              >
                {meal.estimated_calories} kcal
              </span>
            </div>
            <p className="type-body text-ink">{displayText(meal.description)}</p>
          </div>
        </GlassCard>
      ))}
      <GlassCard className="border-teal-mid/18 bg-teal-mid/6 px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="type-title text-teal-mid">Total daily target</span>
          <span className="type-stat text-[1.05rem] text-teal-light">{target.toLocaleString()} kcal</span>
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
  readOnly = false,
}: {
  planId: string;
  schedule: DayPlan[];
  notes: string;
  expandedDay: string | null;
  setExpandedDay: (day: string | null) => void;
  readOnly?: boolean;
}) {
  const colors: Record<string, string> = {
    Monday: "#2a9d8f",
    Tuesday: "#7fad8b",
    Wednesday: "#e8856a",
    Thursday: "#a8ceb0",
    Friday: "#1e7a6e",
    Saturday: "#f5c95e",
    Sunday: "#a8ceb0",
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
              <div className="type-kicker mb-1" style={{ color }}>
                {displayText(day.day).slice(0, 3)}
              </div>
              <div className="type-caption leading-snug text-ink">{displayText(day.focus)}</div>
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
                  <div className="type-title text-forest">{displayText(day.day)}</div>
                  <div className="type-caption font-medium" style={{ color }}>
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
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </GlassCard>
          );
        })()}
      {!expandedDay && (
        <p className="type-caption py-2 text-center text-sage">Tap a day to see your exercises</p>
      )}
      {notes && <CoachNote notes={notes} />}
    </div>
  );
}

function HabitsTab({ habits, readOnly = false }: { habits: Habit[]; readOnly?: boolean }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  return (
    <div className="fx-stagger flex flex-col gap-3">
      <div className="type-caption rounded-xl border border-energy/22 bg-energy/8 px-4 py-3 font-medium text-energy">
        {readOnly
          ? "Daily habits included in this plan."
          : "These are your starting habits. Head to the Dashboard to track them daily."}
      </div>
      {habits.map((habit, i) => {
        const done = !readOnly && checked.has(i);
        return (
          <GlassCard
            key={habit.name}
            hover={!readOnly}
            onClick={
              readOnly
                ? undefined
                : () =>
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
            {!readOnly && (
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border-2 transition-all",
                done ? "animate-check border-sage bg-sage" : "border-sage/35",
              )}
            >
              {done && <CheckIcon />}
            </div>
            )}
            <div>
              <div className={cn("type-body text-[1rem] font-medium", done ? "text-sage line-through" : "text-forest")}>
                {displayText(habit.name)}
              </div>
              <div className="type-caption mt-0.5 text-sage">
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
  readOnly = false,
}: {
  planId: string;
  day: string;
  exercise: { name: string; sets: number; reps: string };
  color: string;
  readOnly?: boolean;
}) {
  const pickKey = `${planId}::${day}::${exercise.name}`;
  const [showWeight, setShowWeight] = useState(false);
  const showSets = !readOnly && hasSetsPicker(exercise.name, exercise.sets);
  const [weights, setWeights] = useState(LOAD_OPTIONS.dumbbells);
  const setChoices = [...new Set([...SET_OPTIONS, exercise.sets].filter((n) => n > 1))].sort((a, b) => a - b);

  const [pick, setPick] = useState<ExercisePick>({
    sets: showSets ? exercise.sets : undefined,
  });

  useEffect(() => {
    if (readOnly) return;
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
  }, [pickKey, showSets, exercise.name, exercise.sets, readOnly]);

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
        <span className="type-body text-[0.95rem] font-medium text-forest">{displayText(exercise.name)}</span>
        <span
          className="type-stat shrink-0 rounded-md px-2.5 py-0.5 text-[0.8rem]"
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
      <span className="type-label w-14 shrink-0 text-sage">
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
      className="type-caption rounded-full border px-2.5 py-1 font-medium transition-all"
      style={{
        borderColor: selected ? color : "rgba(255,255,255,0.12)",
        background: selected ? `${color}22` : "rgba(255,255,255,0.04)",
        color: selected ? "#e8f5f2" : "#8fb3aa",
      }}
    >
      {label}
    </button>
  );
}

function CoachNote({ notes }: { notes: string }) {
  return (
    <div className="type-body rounded-xl border border-sage/20 bg-sage/8 px-4 py-3.5 text-ink">
      <span className="font-semibold text-teal-light">Coach note: </span>
      {displayText(notes)}
    </div>
  );
}
