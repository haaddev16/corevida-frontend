"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/animated-background";
import { SceneSides } from "@/components/scene-sides";
import { SiteNav } from "@/components/site-nav";
import { PlanHistoryList } from "@/components/plan-history";
import { CheckIcon, ErrorBanner, GlassCard, LoadingDots } from "@/components/ui";
import { ApiError, api, dateKey, friendlyPlanError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { clearSession, firstName, readPlan, useSession } from "@/lib/storage";
import { displayText } from "@/lib/text";
import type { Habit, HabitLog, PastPlan, Plan } from "@/lib/types";

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function last30Days() {
  const days: string[] = [];
  for (let i = 29; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    days.push(`${date.getFullYear()}-${month}-${day}`);
  }
  return days;
}

function formatDay(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function timeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function latestCompleted(logs: HabitLog[], dateStr: string) {
  const map = new Map<string, boolean>();
  [...logs]
    .reverse()
    .forEach((log) => {
      if (dateKey(log.log_date) === dateStr) map.set(log.habit_name, log.completed);
    });
  return map;
}

export default function DashboardPage() {
  const router = useRouter();
  const session = useSession();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [todayChecked, setTodayChecked] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<PastPlan[]>([]);
  const [latestPlan, setLatestPlan] = useState<Plan | null>(null);
  const today = todayKey();
  const days30 = useMemo(() => last30Days(), []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function load(planId: string) {
    setLoading(true);
    setError("");
    try {
      const data = await api.getHabits(planId);
      const list = data.habits.length > 0 ? data.habits : readPlan()?.habit_checklist.habits ?? [];
      setHabits(list);
      setLogs(data.logs);
      const checked = latestCompleted(data.logs, today);
      setTodayChecked(new Set([...checked.entries()].filter(([, done]) => done).map(([name]) => name)));
    } catch (err) {
      const cached = readPlan()?.habit_checklist.habits ?? [];
      if (cached.length) {
        setHabits(cached);
        setError("Could not refresh habit history. Today's checks will still be saved if the backend is reachable.");
      } else {
        setError(friendlyPlanError(err));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session.ready) return;
    if (!session.userId) {
      router.replace("/auth");
      return;
    }
    const cached = readPlan();
    const planId = session.planId || cached?.plan_id;
    if (!planId) {
      router.replace("/home");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch habits after session is ready
    setLatestPlan(cached);
    void load(planId);
    api.listPlans(session.userId).then(setHistory).catch(() => undefined);
    if (!cached && planId) {
      api.getPlan(planId).then((loaded) => setLatestPlan(loaded)).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.ready, session.userId, session.planId]);

  async function toggleHabit(habitName: string) {
    const wasChecked = todayChecked.has(habitName);
    setTodayChecked((prev) => {
      const next = new Set(prev);
      if (wasChecked) next.delete(habitName);
      else next.add(habitName);
      return next;
    });

    const nextSize = todayChecked.size + (wasChecked ? -1 : 1);
    if (!wasChecked && nextSize === habits.length && habits.length > 0) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2800);
    }

    const planId = session.planId || readPlan()?.plan_id;
    if (!planId) return;
    try {
      const log = await api.logHabit({
        plan_id: planId,
        habit_name: habitName,
        log_date: today,
        completed: !wasChecked,
      });
      setLogs((prev) => [...prev, { ...log, log_date: dateKey(String(log.log_date)) }]);
    } catch (err) {
      setTodayChecked((prev) => {
        const next = new Set(prev);
        if (wasChecked) next.add(habitName);
        else next.delete(habitName);
        return next;
      });
      setError(err instanceof ApiError ? err.detail : err instanceof Error ? err.message : "Could not save that check in.");
    }
  }

  function dayRatio(dateStr: string) {
    if (habits.length === 0) return 0;
    if (dateStr === today) return todayChecked.size / habits.length;
    const completed = [...latestCompleted(logs, dateStr).values()].filter(Boolean).length;
    return Math.min(completed / habits.length, 1);
  }

  function currentStreak() {
    let streak = 0;
    for (const day of [...days30].reverse()) {
      if (dayRatio(day) >= 0.5) streak += 1;
      else break;
    }
    return streak;
  }

  const streak = currentStreak();
  const pct = habits.length ? Math.round((todayChecked.size / habits.length) * 100) : 0;

  return (
    <PageShell image="/loading-plan-bg.png">
      <SceneSides left="Healthier Mindset Stronger You" right="Discipline Builds Freedom" />
      <SiteNav userName={session.userName} planId={session.planId} />
      <div
        className="mx-auto max-w-[860px] px-4 py-8 pb-20 sm:px-6"
        style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }}
      >
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="fx-jump-right mb-1 font-display text-[clamp(1.6rem,3.5vw,2.2rem)] leading-tight font-bold tracking-[-0.02em] text-forest">
              Good {timeOfDay()}, {firstName(session.userName)}.
            </h1>
            <p className="fx-fade-in text-[0.9rem] text-muted">
              {formatDay(today)} · Habit check in
            </p>
          </div>
          <div
            className="flex items-center gap-2.5 rounded-full border-[1.5px] px-5 py-3 backdrop-blur-sm"
            style={{
              background: streak >= 3 ? "rgba(232,133,106,0.12)" : "rgba(255,255,255,0.06)",
              borderColor: streak >= 3 ? "rgba(232,133,106,0.35)" : "rgba(127,173,139,0.25)",
            }}
          >
            <span
              className="text-2xl"
              style={{ animation: streak >= 3 ? "streak-fire 1.2s ease-in-out infinite" : undefined }}
            >
              {streak >= 5 ? "🔥" : streak >= 3 ? "⚡" : "✨"}
            </span>
            <div>
              <div className={cn("font-mono text-[1.1rem] leading-none font-bold", streak >= 3 ? "text-[#c0614a]" : "text-teal-light")}>
                {streak} day
              </div>
              <div className="text-[0.68rem] font-medium text-sage">streak</div>
            </div>
          </div>
        </div>

        {error && <div className="mb-5"><ErrorBanner message={error} /></div>}

        {celebrate && (
          <div className="animate-in mb-5 flex items-center gap-3 rounded-[14px] border-[1.5px] border-energy/35 bg-[linear-gradient(135deg,rgba(168,230,61,0.15),rgba(42,157,143,0.1))] px-5 py-3.5">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="text-[0.9rem] font-bold text-energy">All habits complete!</div>
              <div className="text-[0.8rem] text-sage-light">Come back tomorrow to keep the streak going.</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16 text-sage">
            <LoadingDots className="bg-sage" />
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_minmax(220px,280px)]">
            <div>
              {latestPlan && (
                <GlassCard hover className="fx-rise mb-4 px-6 py-5">
                  <div className="mb-2 text-[0.72rem] font-semibold tracking-[0.12em] text-sage uppercase">
                    Saved plan
                  </div>
                  <p className="mb-4 text-[0.88rem] leading-relaxed text-ink">
                    {displayText(latestPlan.final_plan.summary)}
                  </p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {[
                      `${latestPlan.nutrition_plan.meals?.length ?? 0} meals`,
                      `${latestPlan.fitness_plan.weekly_schedule?.length ?? 0} workout days`,
                      `${latestPlan.habit_checklist.habits?.length ?? 0} habits`,
                    ].map((label) => (
                      <span
                        key={label}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.72rem] text-sage"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/results")}
                    className="rounded-full bg-[linear-gradient(135deg,#1e7a6e,#2a9d8f)] px-4 py-2 text-[0.82rem] font-semibold text-white"
                  >
                    Open full plan →
                  </button>
                </GlassCard>
              )}
              <GlassCard hover className="fx-rise mb-4 px-6 py-5 [--enter-delay:0.08s]">
                <div className="mb-3.5 flex items-center justify-between">
                  <span className="text-[0.9rem] font-semibold text-forest">Today&apos;s progress</span>
                  <span className={cn("font-mono text-[0.88rem] font-bold", pct === 100 ? "text-energy" : "text-teal-light")}>
                    {todayChecked.size}/{habits.length}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-sage/18">
                  <div
                    className={cn(
                      "h-full rounded-full shadow-[0_0_10px_rgba(42,157,143,0.35)] transition-all duration-500",
                      pct > 0 && "fx-bar-sheen",
                      pct === 100 && "fx-bar-sheen-done",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-2 text-[0.78rem] text-sage">
                  {pct === 100 ? "All done for today! 🎉" : pct === 0 ? "Tap a habit below to check it off" : `${100 - pct}% left, you're doing great`}
                </div>
              </GlassCard>

              <div className="fx-stagger flex flex-col gap-2.5">
                {habits.map((habit) => {
                  const done = todayChecked.has(habit.name);
                  return (
                    <GlassCard
                      key={habit.name}
                      hover
                      onClick={() => toggleHabit(habit.name)}
                      className={cn(
                        "flex items-center gap-3.5 px-5 py-4 transition-all",
                        done ? "border-sage/32 bg-sage/11" : "",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg border-2 transition-all",
                          done ? "animate-check border-sage bg-sage" : "border-sage/38",
                        )}
                      >
                        {done && <CheckIcon />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={cn("text-[0.9rem] font-medium", done ? "text-sage line-through" : "text-forest")}>
                          {displayText(habit.name)}
                        </div>
                        <div className="mt-0.5 text-[0.73rem] text-sage">
                          {displayText(habit.frequency)}
                          {habit.reason ? ` · ${displayText(habit.reason)}` : ""}
                        </div>
                      </div>
                      {done && <div className="text-xs font-semibold text-sage">Done ✓</div>}
                    </GlassCard>
                  );
                })}
              </div>
            </div>

            <div className="fx-stagger flex flex-col gap-4">
              <GlassCard hover className="px-5 py-5">
                <div className="mb-3.5 text-[0.88rem] font-semibold text-forest">30 day history</div>
                <div className="grid grid-cols-7 gap-1">
                  {days30.map((day, i) => {
                    const ratio = dayRatio(day);
                    let bg = "rgba(127,173,139,0.1)";
                    if (ratio >= 0.8) bg = "#2a9d8f";
                    else if (ratio >= 0.5) bg = "rgba(42,157,143,0.5)";
                    else if (ratio > 0) bg = "rgba(42,157,143,0.22)";
                    return (
                      <div
                        key={day}
                        title={`${formatDay(day)}, ${Math.round(ratio * 100)}% complete`}
                        className="fx-cell-in aspect-square w-full rounded-[4px] transition-transform hover:scale-125"
                        style={{
                          animationDelay: `${i * 0.012}s`,
                          background: bg,
                          border: day === today ? "1.5px solid #1e7a6e" : "1px solid transparent",
                        }}
                      />
                    );
                  })}
                </div>
                <div className="mt-2.5 flex items-center justify-end gap-1.5">
                  <span className="text-[0.65rem] text-sage">Less</span>
                  {["rgba(127,173,139,0.1)", "rgba(42,157,143,0.22)", "rgba(42,157,143,0.5)", "#2a9d8f"].map((color) => (
                    <div key={color} className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
                  ))}
                  <span className="text-[0.65rem] text-sage">More</span>
                </div>
              </GlassCard>

              <GlassCard hover className="px-5 py-4">
                <div className="mb-3.5 text-[0.88rem] font-semibold text-forest">Stats</div>
                {[
                  { label: "Current streak", value: `${streak} days`, icon: streak >= 3 ? "🔥" : "✨" },
                  { label: "Completed today", value: `${todayChecked.size}/${habits.length}`, icon: pct === 100 ? "🎉" : "📋" },
                  {
                    label: "30 day avg",
                    value: `${Math.round((days30.reduce((sum, day) => sum + dayRatio(day), 0) / 30) * 100)}%`,
                    icon: "📊",
                  },
                ].map((stat) => (
                  <div key={stat.label} className="mb-2 flex items-center justify-between rounded-[10px] bg-sage/6 px-3 py-2.5 last:mb-0">
                    <div className="flex items-center gap-2">
                      <span>{stat.icon}</span>
                      <span className="text-[0.8rem] text-muted">{stat.label}</span>
                    </div>
                    <span className="font-mono text-[0.82rem] font-bold text-teal-light">{stat.value}</span>
                  </div>
                ))}
              </GlassCard>

              {history.length > 0 && session.userId && (
                <GlassCard hover className="px-5 py-4">
                  <div className="mb-3 text-[0.88rem] font-semibold text-forest">Plan history</div>
                  <PlanHistoryList history={history} limit={5} />
                </GlassCard>
              )}

              <GlassCard hover className="px-5 py-4">
                <div className="mb-3 text-[0.88rem] font-semibold text-forest">Quick actions</div>
                {[
                  { label: "View full plan", action: () => router.push("/results"), icon: "📋" },
                  { label: "Update goals", action: () => router.push("/intake"), icon: "🎯" },
                  {
                    label: "Log out",
                    action: () => {
                      clearSession();
                      router.push("/");
                    },
                    icon: "👋",
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="mb-2 flex w-full items-center gap-2.5 rounded-[10px] border border-sage/20 px-3 py-2.5 text-left text-[0.82rem] text-ink last:mb-0 hover:bg-sage/8"
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </GlassCard>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
