"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/animated-background";
import { SceneSides } from "@/components/scene-sides";
import { SiteNav } from "@/components/site-nav";
import { PlanHistoryList } from "@/components/plan-history";
import { ErrorBanner, GlassCard, LoadingDots, PrimaryButton } from "@/components/ui";
import { friendlyPlanError } from "@/lib/api";
import { hydrateUserPlan } from "@/lib/plans";
import { firstName, readPlan, useSession } from "@/lib/storage";
import { displayText } from "@/lib/text";
import type { PastPlan, Plan } from "@/lib/types";

function timeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export default function HomePage() {
  const router = useRouter();
  const session = useSession();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [latestPlan, setLatestPlan] = useState<Plan | null>(null);
  const [history, setHistory] = useState<PastPlan[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!session.ready) return;
    if (!session.userId) {
      router.replace("/auth");
      return;
    }

    const cached = readPlan();
    if (cached) setLatestPlan(cached);

    setLoading(true);
    setError("");
    hydrateUserPlan(session.userId)
      .then(({ history: rows, plan }) => {
        setHistory(rows);
        setLatestPlan(plan);
      })
      .catch((err) => {
        if (!readPlan()) setError(friendlyPlanError(err));
      })
      .finally(() => setLoading(false));
  }, [session.ready, session.userId, router]);

  return (
    <PageShell image="/loading-plan-bg.png">
      <SceneSides left="Healthier Mindset Stronger You" right="Discipline Builds Freedom" />
      <SiteNav userName={session.userName} planId={latestPlan?.plan_id ?? session.planId} />
      <div
        className="mx-auto max-w-[860px] px-4 py-8 pb-20 sm:px-6"
        style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }}
      >
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="type-h1 fx-jump-right mb-1 text-forest">
              Good {timeOfDay()}, {firstName(session.userName)}.
            </h1>
            <p className="type-caption fx-fade-in text-muted">
              {latestPlan ? "Your saved plan" : "Start a new plan whenever you are ready."}
            </p>
          </div>
          <PrimaryButton onClick={() => router.push("/intake")}>Make a new plan</PrimaryButton>
        </div>

        {error && (
          <div className="mb-5">
            <ErrorBanner message={error} />
          </div>
        )}

        {loading && !latestPlan ? (
          <div className="flex justify-center py-16 text-sage">
            <LoadingDots className="bg-sage" />
          </div>
        ) : latestPlan ? (
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_minmax(220px,280px)]">
            <GlassCard hover className="fx-rise px-6 py-5">
              <div className="type-kicker mb-2 text-sage">
                Saved plan
              </div>
              <p className="type-body mb-4 text-ink">{displayText(latestPlan.final_plan.summary)}</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {[
                  `${latestPlan.nutrition_plan.meals?.length ?? 0} meals`,
                  `${latestPlan.fitness_plan.weekly_schedule?.length ?? 0} workout days`,
                  `${latestPlan.habit_checklist.habits?.length ?? 0} habits`,
                ].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 type-meta text-sage"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => router.push("/results")}
                className="type-button rounded-full bg-[linear-gradient(135deg,#1e7a6e,#2a9d8f)] px-4 py-2 text-[0.88rem] text-white"
              >
                Open full plan →
              </button>
            </GlassCard>

            {history.length > 0 && session.userId && (
              <GlassCard hover className="fx-rise px-5 py-4 [--enter-delay:0.12s]">
                <div className="type-title mb-3 text-forest">Plan history</div>
                <PlanHistoryList history={history} />
              </GlassCard>
            )}
          </div>
        ) : (
          <GlassCard hover className="fx-rise px-6 py-8">
            <div className="type-kicker mb-2 text-sage">
              Saved plan
            </div>
            <p className="type-body mb-5 text-ink">
              You do not have a saved plan yet. Make a new one and it will show up here.
            </p>
            <PrimaryButton onClick={() => router.push("/intake")}>Make a new plan</PrimaryButton>
          </GlassCard>
        )}
      </div>
    </PageShell>
  );
}
