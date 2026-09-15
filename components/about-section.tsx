"use client";

import { GlassCard } from "@/components/ui";

const CARDS = [
  {
    icon: "🎯",
    title: "Why we exist",
    text: "Most plans fail because they ignore your life. We start from your intake and build around it: equipment, diet, time, and the goal you chose.",
    accent: "#4db8aa",
  },
  {
    icon: "🤝",
    title: "How we coach",
    text: "Nutrition, fitness, and habit agents work in parallel. A supervisor reviews the three drafts so the advice does not fight itself.",
    accent: "#f3d16a",
  },
  {
    icon: "🌿",
    title: "What we believe",
    text: "Discipline builds freedom. Small habits, honest targets, and a plan you can repeat beat a perfect week you abandon on day four.",
    accent: "#7fad8b",
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="mt-20 mb-4 scroll-mt-24 [perspective:1200px]">
      <div className="mb-10 text-center">
        <p className="type-kicker fx-light-flow mb-3 text-sage">About us</p>
        <h2 className="type-h2 fx-reveal-right mb-4 text-forest">
          Built for real lives, not gym posters
        </h2>
        <p className="type-body fx-fade-in mx-auto max-w-[640px] text-muted">
          Corevida is an AI wellness coach. Five specialist agents read your goals, schedule, and limits, then
          write one program: meals, training, and daily habits that fit the week you actually have.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {CARDS.map((item, i) => (
          <GlassCard
            key={item.title}
            className="about-card p-7 sm:p-8"
            style={{
              animation: `about-tilt-in 0.95s cubic-bezier(0.22,1,0.36,1) ${0.18 + i * 0.16}s both`,
            }}
          >
            <span
              className="about-bloom"
              style={{
                animationDelay: `${i * 0.8}s`,
                background: `radial-gradient(circle, ${item.accent}48, transparent 70%)`,
              }}
            />
            <div className="mb-5 flex items-center justify-between">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                style={{
                  background: `${item.accent}18`,
                  border: `1px solid ${item.accent}40`,
                  animation: `about-icon-pulse 3.4s ease-in-out ${i * 0.45}s infinite`,
                }}
              >
                {item.icon}
              </div>
              <span className="type-stat text-[0.78rem] tracking-[0.16em] text-sage/70">0{i + 1}</span>
            </div>
            <h3 className="type-h3 fx-jump-right mb-2 text-forest">{item.title}</h3>
            <p className="type-body fx-fade-in text-[0.98rem] text-muted">{item.text}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
