"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AboutSection from "@/components/about-section";
import { PageShell } from "@/components/animated-background";
import { Logo } from "@/components/site-nav";
import { CountUp, GlassCard, PrimaryButton, SecondaryButton } from "@/components/ui";
import { UserBadge } from "@/components/user-badge";
import { firstName, useSession } from "@/lib/storage";

const FEATURES = [
  {
    icon: "🥗",
    title: "Personalized nutrition",
    desc: "Calorie targets and meals built around your body, restrictions, and goals, not a generic template.",
    accent: "#f97316",
  },
  {
    icon: "🏋️",
    title: "Smart fitness plans",
    desc: "Workouts designed for your equipment, schedule, and starting point. Progressive, not punishing.",
    accent: "#c4784a",
  },
  {
    icon: "✅",
    title: "Habit architecture",
    desc: "Small daily habits that compound. Your coach builds the ladder, you climb it.",
    accent: "#e8856a",
  },
  {
    icon: "🧠",
    title: "AI synthesis",
    desc: "A supervisor agent reviews every plan for coherence so nutrition, fitness, and habits work together.",
    accent: "#ea580c",
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
  const primaryLabel = !loggedIn ? "Start for free →" : hasPlan ? "Continue to dashboard →" : "Continue intake →";

  return (
    <PageShell scene="landing">
      <nav className="nav-glass fixed top-0 right-0 left-0 z-50 flex items-center justify-between px-4 py-4 sm:px-10">
        <Logo />
        <div className="hidden items-center gap-3 sm:flex">
          {loggedIn ? (
            <>
              <a
                href="#about"
                className="fx-nav rounded-full px-4 py-2 text-sm font-medium text-ink transition-colors hover:text-teal-light"
              >
                About
              </a>
              {hasPlan && (
                <button
                  onClick={() => router.push("/results")}
                  className="fx-nav rounded-full px-4 py-2 text-sm font-medium text-ink transition-colors hover:text-teal-light"
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
                className="fx-nav rounded-full px-4 py-2 text-sm font-medium text-ink transition-colors hover:text-teal-light"
              >
                About
              </a>
              <button
                onClick={() => router.push("/auth")}
                className="fx-nav rounded-full px-4 py-2 text-sm font-medium text-ink transition-colors hover:text-teal-light"
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
            className="rounded-xl border border-sage/25 px-3 py-2 text-sm text-ink"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            Menu
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="glass fixed top-[68px] right-4 z-50 flex w-48 flex-col gap-2 rounded-2xl p-3 sm:hidden">
          <a
            href="#about"
            className="rounded-xl px-3 py-2 text-left text-sm text-ink"
            onClick={() => setMenuOpen(false)}
          >
            About
          </a>
          <button className="rounded-xl px-3 py-2 text-left text-sm text-ink" onClick={() => router.push("/auth")}>
            Log in
          </button>
          <PrimaryButton className="w-full" onClick={() => router.push(primaryHref)}>
            Get started
          </PrimaryButton>
        </div>
      )}

      <section className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-5 pt-28 pb-20 text-center sm:px-6">
        {loggedIn && session.ready && (
          <div
            className="page-fade mb-6 max-w-xl rounded-2xl border border-teal-light/25 bg-white/6 px-5 py-3 text-sm text-ink backdrop-blur-md"
            style={{ animationDelay: "0.05s" }}
          >
            Welcome back, {firstName(session.userName)}.{" "}
            {hasPlan
              ? "Your latest plan is ready whenever you are."
              : "Pick up your intake and we will generate a fresh plan."}
          </div>
        )}

        <h1 className="mb-6 max-w-[860px] font-display text-[clamp(2.4rem,6.5vw,5.1rem)] leading-[1.08] font-bold tracking-[-0.02em] [perspective:800px]">
          {"Your AI wellness coach,".split(" ").map((word, i) => (
            <span
              key={`a-${word}`}
              className="title-flow-word fx-reveal-right mr-[0.28em] inline-block"
              style={{ animationDelay: `${0.22 + i * 0.08}s, 0.8s` }}
            >
              {word}
            </span>
          ))}
          <br />
          <em className="title-flow-word mr-[0.28em] inline-block italic" style={{ animationDelay: "0.58s, 0.8s" }}>
            built
          </em>
          {"around you.".split(" ").map((word, i) => (
            <span
              key={`b-${word}`}
              className="title-flow-word fx-jump-right mr-[0.28em] inline-block"
              style={{ animationDelay: `${0.72 + i * 0.1}s, 0.8s` }}
            >
              {word}
            </span>
          ))}
          <span
            className="fx-spark-line mx-auto mt-5 block h-px w-[min(220px,40%)] origin-center bg-[linear-gradient(90deg,transparent,#ffb020,transparent)]"
            style={{ animationDelay: "0.96s" }}
          />
        </h1>

        <p
          className="fx-fade-in mx-auto mb-12 max-w-[540px] text-[clamp(1rem,2.2vw,1.2rem)] leading-relaxed text-ink"
          style={{ animationDelay: "1s" }}
        >
          Nutrition, fitness, and habit plans generated together by a multi agent AI, then synthesized into one
          coherent program built around your actual life.
        </p>

        <div
          className="flex flex-wrap justify-center gap-3.5"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s ease 0.28s",
          }}
        >
          <PrimaryButton large className="fx-cta-pulse" onClick={() => router.push(primaryHref)}>
            {primaryLabel}
          </PrimaryButton>
          <SecondaryButton onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>
            See how it works
          </SecondaryButton>
        </div>

        <div
          className="mt-16 flex flex-wrap justify-center gap-10 sm:gap-14"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s ease 0.4s",
          }}
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className={`mb-1.5 font-display text-[2rem] leading-none font-bold text-teal-light ${countStart ? "stat-count" : ""}`}
              >
                <CountUp
                  target={stat.target}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  duration={stat.target >= 20 ? 550 : 420}
                  start={countStart}
                />
              </div>
              <div className="text-[0.82rem] font-medium text-sage">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="relative z-10 mx-auto max-w-[960px] px-5 py-16 sm:px-6 sm:py-20">
        <div className="mb-12 text-center">
          <h2 className="fx-reveal-right mb-3 font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold tracking-[-0.02em] text-forest">
            Five agents, one plan
          </h2>
          <p className="fx-fade-in mx-auto max-w-xl text-[1.05rem] leading-relaxed text-muted">
            Parallel AI agents build your nutrition, fitness, and habit plans, then a supervisor synthesizes them
            into one coherent program.
          </p>
        </div>

        <GlassCard hover className="fx-rise px-5 py-10 sm:px-10">
          <div className="flex flex-col items-center justify-center gap-5 md:flex-row md:gap-0">
            <AgentNode icon="📋" label="Your goals" sub="Intake" color="#c4784a" />
            <Arrow />
            <div className="flex flex-row gap-3 md:flex-col">
              <AgentNode icon="🥗" label="Nutrition" sub="Agent 1" color="#f97316" small />
              <AgentNode icon="🏋️" label="Fitness" sub="Agent 2" color="#f97316" small />
              <AgentNode icon="✅" label="Habits" sub="Agent 3" color="#f97316" small />
            </div>
            <Arrow />
            <AgentNode icon="🧠" label="Supervisor" sub="Synthesis" color="#ea580c" />
            <Arrow />
            <AgentNode icon="✨" label="Your plan" sub="Complete" color="#e8856a" />
          </div>
        </GlassCard>
      </section>

      <section className="relative z-10 mx-auto max-w-[1100px] px-5 pt-6 pb-28 sm:px-6">
        <h2 className="fx-jump-right mb-12 text-center font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold tracking-[-0.02em] text-forest">
          Everything you need to thrive
        </h2>
        <div className="fx-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <GlassCard key={feature.title} hover className="p-7">
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] text-2xl"
                style={{
                  background: `${feature.accent}18`,
                  border: `1px solid ${feature.accent}30`,
                  animation: `icon-float 3.6s ease-in-out ${i * 0.35}s infinite`,
                }}
              >
                {feature.icon}
              </div>
              <h3 className="fx-flutter-in mb-2.5 font-display text-[1.15rem] font-semibold tracking-[-0.01em] text-forest">
                {feature.title}
              </h3>
              <p className="fx-fade-in text-[0.88rem] leading-relaxed text-muted">{feature.desc}</p>
            </GlassCard>
          ))}
        </div>

        <AboutSection />

        <div className="mt-16 flex justify-center">
          <GlassCard hover className="fx-rise w-full max-w-[560px] px-8 py-12 text-center sm:px-16">
            <h3 className="fx-reveal-right mb-3 font-display text-[1.8rem] font-bold tracking-[-0.02em] text-forest">
              Ready to meet your coach?
            </h3>
            <p className="fx-fade-in mb-7 text-[0.95rem] leading-relaxed text-muted">
              Three minutes to set up. Your personalized plan is generated by four specialist agents plus a supervisor.
            </p>
            <PrimaryButton large className="fx-cta-pulse" onClick={() => router.push(primaryHref)}>
              Build my plan →
            </PrimaryButton>
          </GlassCard>
        </div>
      </section>

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-sage/18 px-6 py-7 sm:px-10">
        <span className="font-display text-xl font-semibold text-teal-light">Corevida</span>
        <a href="#about" className="text-[0.82rem] text-sage transition-colors hover:text-teal-light">
          About us
        </a>
        <span className="text-[0.82rem] text-sage">Built with 5 AI agents. © 2026 Corevida.</span>
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
  icon: string;
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
          width: small ? 58 : 70,
          height: small ? 58 : 70,
          background: `${color}22`,
          border: `1.5px solid ${color}50`,
          fontSize: small ? "1.3rem" : "1.55rem",
          animation: `agent-pulse 3.2s ease-in-out ${small ? 0.4 : 0}s infinite`,
        }}
      >
        {icon}
      </div>
      <div className="text-center">
        <div className={small ? "text-[0.72rem] font-semibold text-forest" : "text-[0.8rem] font-semibold text-forest"}>
          {label}
        </div>
        <div className="text-[0.68rem] font-medium" style={{ color }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

function Arrow() {
  return <div className="hidden shrink-0 self-center px-2 text-[1.1rem] font-light text-sage-light md:block">→</div>;
}
