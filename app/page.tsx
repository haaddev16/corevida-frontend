"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AboutSection from "@/components/about-section";
import { AppIcon, type AppIconName } from "@/components/app-icon";
import { PageShell } from "@/components/animated-background";
import { Logo } from "@/components/site-nav";
import { CountUp, GlassCard, PrimaryButton, SecondaryButton } from "@/components/ui";
import { UserBadge } from "@/components/user-badge";
import { firstName, useSession } from "@/lib/storage";

const FEATURES: { icon: AppIconName; title: string; desc: string; accent: string }[] = [
  {
    icon: "nutrition",
    title: "Personalized nutrition",
    desc: "Calorie targets and meals built around your body, restrictions, and goals, not a generic template.",
    accent: "#2a9d8f",
  },
  {
    icon: "fitness",
    title: "Smart fitness plans",
    desc: "Workouts designed for your equipment, schedule, and starting point. Progressive, not punishing.",
    accent: "#7fad8b",
  },
  {
    icon: "habits",
    title: "Habit architecture",
    desc: "Small daily habits that compound. Your coach builds the ladder, you climb it.",
    accent: "#e8856a",
  },
  {
    icon: "brain",
    title: "AI synthesis",
    desc: "A supervisor agent reviews every plan for coherence so nutrition, fitness, and habits work together.",
    accent: "#1e7a6e",
  },
];

const STATS = [
  { target: 5, prefix: "", suffix: "", label: "AI agents working for you" },
  { target: 60, prefix: "< ", suffix: "s", label: "To generate your full plan" },
  { target: 3, prefix: "", suffix: " plans", label: "Nutrition · Fitness · Habits" },
];

export default function LandingPage() {
  const router = useRouter();
  const session = useSession();
  const [mounted, setMounted] = useState(false);
  const [countStart, setCountStart] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setMounted(true), 40);
    const count = setTimeout(() => setCountStart(true), 520);
    return () => {
      clearTimeout(show);
      clearTimeout(count);
    };
  }, []);

  const loggedIn = Boolean(session.userId);
  const hasPlan = Boolean(session.planId);
  const primaryHref = !loggedIn ? "/auth" : hasPlan ? "/dashboard" : "/intake";
  const primaryLabel = !loggedIn
    ? "Start for free"
    : hasPlan
      ? "Continue to dashboard"
      : "Continue intake";

  return (
    <PageShell scene="landing">
      <nav className="nav-glass fixed top-0 right-0 left-0 z-50 flex items-center justify-between gap-2 px-3 py-3 sm:px-10 sm:py-4">
        <Logo className="text-[1.2rem] sm:text-[1.4rem]" />
        <div className="hidden items-center gap-3 sm:flex">
          {loggedIn ? (
            <>
              <a
                href="#about"
                className="type-nav fx-nav min-h-11 rounded-full px-4 py-2 text-ink transition-colors hover:text-teal-light"
              >
                About
              </a>
              {hasPlan && (
                <button
                  onClick={() => router.push("/results")}
                  className="type-nav fx-nav min-h-11 rounded-full px-4 py-2 text-ink transition-colors hover:text-teal-light"
                >
                  My plan
                </button>
              )}
              <UserBadge />
              <PrimaryButton onClick={() => router.push(primaryHref)}>
                {hasPlan ? "Dashboard" : "Continue"}
              </PrimaryButton>
            </>
          ) : (
            <>
              <a
                href="#about"
                className="type-nav fx-nav min-h-11 rounded-full px-4 py-2 text-ink transition-colors hover:text-teal-light"
              >
                About
              </a>
              <button
                onClick={() => router.push("/auth")}
                className="type-nav fx-nav min-h-11 rounded-full px-4 py-2 text-ink transition-colors hover:text-teal-light"
              >
                Log in
              </button>
              <PrimaryButton className="fx-cta-pulse" onClick={() => router.push("/auth")}>
                Get started
              </PrimaryButton>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          <UserBadge />
          <button
            className="type-nav min-h-11 rounded-xl border border-sage/25 px-3 py-2 text-ink"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            Menu
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="glass fixed top-[68px] right-3 left-3 z-50 flex flex-col gap-2 rounded-2xl p-3 sm:hidden">
          <a
            href="#about"
            className="type-nav min-h-11 rounded-xl px-3 py-3 text-left text-ink"
            onClick={() => setMenuOpen(false)}
          >
            About
          </a>
          <button
            className="type-nav min-h-11 rounded-xl px-3 py-3 text-left text-ink"
            onClick={() => router.push("/auth")}
          >
            Log in
          </button>
          <PrimaryButton className="w-full" onClick={() => router.push(primaryHref)}>
            Get started
          </PrimaryButton>
        </div>
      )}

      <section className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 pt-24 pb-16 text-center sm:px-6 sm:pt-28 sm:pb-20">
        {loggedIn && session.ready && (
          <div
            className="page-fade mb-6 max-w-xl rounded-2xl border border-teal-light/25 bg-white/6 px-4 py-3 type-caption text-ink backdrop-blur-md sm:px-5"
            style={{ animationDelay: "0.05s" }}
          >
            Welcome back, {firstName(session.userName)}.{" "}
            {hasPlan
              ? "Your latest plan is ready whenever you are."
              : "Pick up your intake and we will generate a fresh plan."}
          </div>
        )}

        <h1 className="type-display mb-6 max-w-[860px] overflow-visible px-1 [perspective:800px]">
          {"Your AI wellness coach,".split(" ").map((word, i) => (
            <span
              key={`a-${word}`}
              className="title-flow-word fx-reveal-right mr-[0.28em] inline-block overflow-visible"
              style={{ animationDelay: `${0.22 + i * 0.08}s, 0.8s` }}
            >
              {word}
            </span>
          ))}
          <br />
          <em
            className="title-flow-word mr-[0.28em] inline-block overflow-visible italic"
            style={{ animationDelay: "0.58s, 0.8s" }}
          >
            built
          </em>
          {"around you.".split(" ").map((word, i) => (
            <span
              key={`b-${word}`}
              className="title-flow-word fx-jump-right mr-[0.28em] inline-block overflow-visible"
              style={{ animationDelay: `${0.72 + i * 0.1}s, 0.8s` }}
            >
              {word}
            </span>
          ))}
          <span
            className="page-fade mx-auto mt-5 block h-px w-[min(220px,40%)] origin-center bg-[linear-gradient(90deg,transparent,#f3d16a,transparent)]"
            style={{ animationDelay: "0.96s" }}
          />
        </h1>

        <p
          className="type-body-lg fx-fade-in mx-auto mb-10 max-w-[560px] px-1 text-ink sm:mb-12"
          style={{ animationDelay: "1s" }}
        >
          Nutrition, fitness, and habit plans generated together by a multi agent AI, then synthesized into one
          coherent program built around your actual life.
        </p>

        <div
          className="flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-3.5"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s ease 0.28s",
          }}
        >
          <PrimaryButton large className="fx-cta-pulse w-full sm:w-auto" onClick={() => router.push(primaryHref)}>
            {primaryLabel}
            <AppIcon name="arrowRight" size={18} className="ml-1" />
          </PrimaryButton>
          <SecondaryButton
            className="w-full sm:w-auto"
            onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
          >
            See how it works
          </SecondaryButton>
        </div>

        <div
          className="mt-12 flex w-full max-w-lg flex-col gap-8 sm:mt-16 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-10 md:gap-14"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s ease 0.4s",
          }}
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className={`type-stat mb-1.5 text-[1.85rem] leading-none text-teal-light sm:text-[2.15rem] ${countStart ? "stat-count" : ""}`}
              >
                <CountUp
                  target={stat.target}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  duration={stat.target >= 20 ? 550 : 420}
                  start={countStart}
                />
              </div>
              <div className="type-caption px-2 text-sage">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="relative z-10 mx-auto max-w-[960px] px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="type-h2 fx-reveal-right mb-3 text-forest">Five agents, one plan</h2>
          <p className="type-body fx-fade-in mx-auto max-w-xl text-muted">
            Parallel AI agents build your nutrition, fitness, and habit plans, then a supervisor synthesizes them
            into one coherent program.
          </p>
        </div>

        <GlassCard hover className="fx-rise px-4 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col items-center justify-center gap-5 md:flex-row md:gap-0">
            <AgentNode icon="clipboard" label="Your goals" sub="Intake" color="#7fad8b" />
            <Arrow />
            <div className="flex flex-row flex-wrap justify-center gap-3 md:flex-col">
              <AgentNode icon="nutrition" label="Nutrition" sub="Agent 1" color="#2a9d8f" small />
              <AgentNode icon="fitness" label="Fitness" sub="Agent 2" color="#2a9d8f" small />
              <AgentNode icon="habits" label="Habits" sub="Agent 3" color="#2a9d8f" small />
            </div>
            <Arrow />
            <AgentNode icon="brain" label="Supervisor" sub="Synthesis" color="#1e7a6e" />
            <Arrow />
            <AgentNode icon="sparkles" label="Your plan" sub="Complete" color="#e8856a" />
          </div>
        </GlassCard>
      </section>

      <section className="relative z-10 mx-auto max-w-[1100px] px-4 pt-6 pb-20 sm:px-6 sm:pb-28">
        <h2 className="type-h2 fx-jump-right mb-8 text-center text-forest sm:mb-12">
          Everything you need to thrive
        </h2>
        <div className="fx-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <GlassCard key={feature.title} hover className="p-5 sm:p-7">
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px]"
                style={{
                  background: `${feature.accent}18`,
                  border: `1px solid ${feature.accent}30`,
                  color: feature.accent,
                  animation: `icon-float 3.6s ease-in-out ${i * 0.35}s infinite`,
                }}
              >
                <AppIcon name={feature.icon} size={22} />
              </div>
              <h3 className="type-h3 fx-flutter-in mb-2.5 text-forest">{feature.title}</h3>
              <p className="type-body fx-fade-in text-[0.98rem] text-muted">{feature.desc}</p>
            </GlassCard>
          ))}
        </div>

        <AboutSection />

        <div className="mt-12 flex justify-center sm:mt-16">
          <GlassCard hover className="fx-rise w-full max-w-[560px] px-5 py-10 text-center sm:px-16 sm:py-12">
            <h3 className="type-h2 fx-reveal-right mb-3 text-forest">Ready to meet your coach?</h3>
            <p className="type-body fx-fade-in mb-7 text-muted">
              Three minutes to set up. Your personalized plan is generated by four specialist agents plus a supervisor.
            </p>
            <PrimaryButton large className="fx-cta-pulse w-full sm:w-auto" onClick={() => router.push(primaryHref)}>
              Build my plan
              <AppIcon name="arrowRight" size={18} className="ml-1" />
            </PrimaryButton>
          </GlassCard>
        </div>
      </section>

      <footer className="relative z-10 flex flex-col items-start gap-3 border-t border-sage/18 px-4 py-7 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-10">
        <span className="type-logo text-xl text-teal-light">Corevida</span>
        <a href="#about" className="type-caption text-sage transition-colors hover:text-teal-light">
          About us
        </a>
        <span className="type-caption text-sage">Built with 5 AI agents. © 2026 Corevida.</span>
      </footer>
    </PageShell>
  );
}

function AgentNode({
  icon,
  label,
  sub,
  color,
  small = false,
}: {
  icon: AppIconName;
  label: string;
  sub: string;
  color: string;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{
          width: small ? 52 : 64,
          height: small ? 52 : 64,
          background: `${color}22`,
          border: `1.5px solid ${color}50`,
          color,
          animation: `agent-pulse 3.2s ease-in-out ${small ? 0.4 : 0}s infinite`,
        }}
      >
        <AppIcon name={icon} size={small ? 20 : 24} />
      </div>
      <div className="text-center">
        <div className={small ? "type-title text-[0.9rem] text-forest" : "type-title text-forest"}>{label}</div>
        <div className="type-meta" style={{ color }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="hidden shrink-0 self-center px-2 text-sage-light md:block">
      <AppIcon name="arrowRight" size={18} />
    </div>
  );
}
