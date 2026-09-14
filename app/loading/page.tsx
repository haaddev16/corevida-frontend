"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/animated-background";
import { ErrorBanner, PrimaryButton } from "@/components/ui";
import { api, friendlyPlanError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { UserBadge } from "@/components/user-badge";
import { savePlan, useSession } from "@/lib/storage";

const AGENTS = [
  {
    icon: "🥗",
    name: "Nutrition Agent",
    task: "Calculating calorie and meal targets around your goals…",
    color: "#f97316",
    duration: 3500,
  },
  {
    icon: "🏋️",
    name: "Fitness Agent",
    task: "Designing workouts for your equipment and schedule…",
    color: "#c4784a",
    duration: 3300,
  },
  {
    icon: "✅",
    name: "Habits Agent",
    task: "Building daily habits that fit your lifestyle…",
    color: "#e8856a",
    duration: 3000,
  },
  {
    icon: "🧠",
    name: "Supervisor Agent",
    task: "Reviewing all three plans and synthesizing one program…",
    color: "#ea580c",
    duration: 3600,
  },
];

function LoadingDecor() {
  return (
    <>
      <div className="pointer-events-none fixed top-28 right-8 hidden flex-col gap-5 lg:flex">
        {[
          { icon: "🏋️", label: "Personalized workouts" },
          { icon: "🥗", label: "Smart nutrition" },
          { icon: "📊", label: "Healthy habits" },
          { icon: "🌙", label: "Better sleep" },
        ].map((item, i) => (
          <div
            key={item.label}
            className="rail-in flex items-center justify-end gap-2.5 text-sage/70"
            style={{ animationDelay: `${0.12 * i}s` }}
          >
            <span className="text-right text-[0.68rem] leading-tight tracking-[0.12em] uppercase">{item.label}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/4 text-sm">
              {item.icon}
            </span>
          </div>
        ))}
      </div>
      <p className="intake-quote quote-live pointer-events-none fixed right-8 bottom-3 hidden text-right text-[1.55rem] lg:block">
        Stronger
        <br />
        Healthier
        <br />
        You
      </p>
    </>
  );
}

export default function LoadingPage() {
  const router = useRouter();
  const session = useSession();
  const [activeAgent, setActiveAgent] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const fetched = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!session.ready) return;
    if (!session.userId) {
      router.replace("/auth");
      return;
    }
    if (!session.profileId) {
      router.replace("/intake");
      return;
    }
    if (fetched.current) return;
    fetched.current = true;
    startSequence();
    generate(session.profileId);
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.ready, session.userId, session.profileId]);

  function startSequence() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setActiveAgent(0);
    setCompleted([]);
    setReady(false);

    let elapsed = 0;
    AGENTS.forEach((agent, index) => {
      const startAt = elapsed;
      timers.current.push(
        window.setTimeout(() => setActiveAgent(index), startAt),
        window.setTimeout(() => {
          setCompleted((prev) => (prev.includes(index) ? prev : [...prev, index]));
        }, startAt + agent.duration - 200),
      );
      elapsed += agent.duration;
    });
  }

  function completeAll() {
    timers.current.forEach((id) => window.clearTimeout(id));
    setCompleted([0, 1, 2, 3]);
    setActiveAgent(3);
    setReady(true);
  }

  async function generate(profileId: string) {
    setError("");
    try {
      const plan = await api.createPlan(profileId);
      if (!plan.plan_id) throw new Error("The coach returned an incomplete plan.");
      savePlan(plan);
      completeAll();
      window.setTimeout(() => router.push("/results"), 700);
    } catch (err) {
      timers.current.forEach((id) => window.clearTimeout(id));
      setReady(false);
      setError(friendlyPlanError(err));
    }
  }

  const doneCount = completed.length;

  return (
    <PageShell image="/loading-plan-bg.png" className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="fixed top-4 right-4 z-50 sm:top-6 sm:right-8">
        <UserBadge />
      </div>
      <LoadingDecor />
      <div
        className="relative z-10 w-full max-w-[520px] text-center"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.6s ease",
        }}
      >
        <h2 className="heading-glow mb-3 font-display text-[clamp(1.6rem,4vw,2.2rem)] leading-tight font-bold tracking-[-0.02em] text-[#f5f5f4]">
          {error ? "The coach hit a pause" : ready ? "Your plan is ready ✨" : "Building your plan…"}
        </h2>
        <p className="fx-fade-in mb-12 text-[0.9rem] leading-relaxed text-sage">
          {error
            ? "We could not finish this run. Try again. A backup plan is used if the coach is busy."
            : ready
              ? "All four agents have finished their work."
              : "Four AI agents are working together. This usually takes under a minute."}
        </p>

        <div className="flex flex-col gap-3.5">
          {AGENTS.map((agent, index) => {
            const isDone = completed.includes(index);
            const isActive = activeAgent === index && !isDone && !error;
            return (
              <div
                key={agent.name}
                className="fx-agent-row flex items-center gap-4 rounded-[18px] border px-[22px] py-[16px] text-left backdrop-blur-md transition-all duration-400"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  background: isDone
                    ? "rgba(196,120,74,0.12)"
                    : isActive
                      ? "rgba(249,115,22,0.12)"
                      : "rgba(255,255,255,0.04)",
                  borderColor: isDone
                    ? "rgba(196,120,74,0.28)"
                    : isActive
                      ? "rgba(249,115,22,0.35)"
                      : "rgba(255,255,255,0.08)",
                  boxShadow: isActive ? "0 0 28px rgba(249,115,22,0.2)" : "none",
                }}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-lg",
                    isActive && "animate-[agent-pulse_1.4s_ease-in-out_infinite]",
                  )}
                  style={{
                    background: isDone ? "rgba(196,120,74,0.2)" : isActive ? `${agent.color}25` : "rgba(255,255,255,0.05)",
                    borderColor: isDone ? "rgba(196,120,74,0.3)" : isActive ? `${agent.color}40` : "rgba(255,255,255,0.08)",
                  }}
                >
                  {isDone ? "✓" : agent.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="mb-0.5 text-[0.88rem] font-semibold"
                    style={{ color: isDone ? "#c4784a" : isActive ? "#f5f5f4" : "rgba(214,211,209,0.35)" }}
                  >
                    {agent.name}
                  </div>
                  <div
                    className="text-[0.78rem] leading-relaxed"
                    style={{
                      color: isDone
                        ? "rgba(196,120,74,0.7)"
                        : isActive
                          ? "rgba(245,245,244,0.7)"
                          : "rgba(214,211,209,0.2)",
                    }}
                  >
                    {isDone ? "Complete" : isActive ? agent.task : "Waiting…"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-9">
          <div className="mb-2 h-1 overflow-hidden rounded bg-white/10">
            <div
              className={cn(
                "h-full rounded shadow-[0_0_10px_rgba(255,176,32,0.4)] transition-all duration-500",
                (ready || doneCount > 0) && "fx-bar-sheen",
                ready && "fx-bar-sheen-done",
              )}
              style={{ width: `${ready ? 100 : (doneCount / AGENTS.length) * 100}%` }}
            />
          </div>
          <div className="text-[0.78rem] text-sage/70">
            {error
              ? "Generation paused"
              : ready
                ? "Complete, opening your plan…"
                : doneCount === AGENTS.length
                  ? "Sequence finished, waiting on the live plan response…"
                  : `${doneCount} of ${AGENTS.length} agents complete`}
          </div>
        </div>

        {error && (
          <div className="mt-8 space-y-4">
            <ErrorBanner message={error} />
            <div className="flex flex-wrap justify-center gap-3">
              <PrimaryButton
                onClick={() => {
                  if (!session.profileId) return;
                  setError("");
                  fetched.current = true;
                  startSequence();
                  generate(session.profileId);
                }}
              >
                Try again
              </PrimaryButton>
              <button
                onClick={() => router.push("/intake")}
                className="rounded-full border border-white/20 px-6 py-3 text-sm text-[#f5f5f4]"
              >
                Edit intake
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
