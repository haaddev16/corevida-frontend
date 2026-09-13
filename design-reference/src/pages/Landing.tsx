import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import AnimatedBackground from "../components/AnimatedBackground";

const FEATURES = [
  {
    icon: "🥗",
    title: "Personalized Nutrition",
    desc: "Calorie targets, macro splits, and meal plans built around your body and goals — not a generic template.",
    accent: "#2a9d8f",
  },
  {
    icon: "🏋️",
    title: "Smart Fitness Plans",
    desc: "Workouts designed for your equipment, schedule, and fitness level. Progressive, not punishing.",
    accent: "#7fad8b",
  },
  {
    icon: "✅",
    title: "Habit Architecture",
    desc: "Small daily habits compound into lasting change. Your AI coach builds the ladder, you climb it.",
    accent: "#e8856a",
  },
  {
    icon: "🧠",
    title: "AI Synthesis",
    desc: "A supervisor agent reviews all plans for coherence — so nutrition, fitness, and habits always work together.",
    accent: "#1e7a6e",
  },
];

const STATS = [
  { value: "5", label: "AI agents working for you" },
  { value: "< 60s", label: "To generate your full plan" },
  { value: "3 plans", label: "Nutrition · Fitness · Habits" },
];

function GlassCard({
  children,
  style = {},
  hover = true,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  hover?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.72)",
        borderRadius: "20px",
        boxShadow: hovered
          ? "0 16px 48px rgba(30,122,110,0.16), 0 2px 8px rgba(30,122,110,0.08)"
          : "0 4px 24px rgba(30,122,110,0.07), 0 1px 4px rgba(30,122,110,0.04)",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        transition: "all 0.28s cubic-bezier(0.34,1.56,0.64,1)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  large = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  large?: boolean;
}) {
  const [active, setActive] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      onMouseLeave={() => setActive(false)}
      style={{
        padding: large ? "18px 48px" : "12px 28px",
        borderRadius: "50px",
        background: "linear-gradient(135deg, #1e7a6e 0%, #2a9d8f 100%)",
        color: "white",
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 600,
        fontSize: large ? "1.05rem" : "0.95rem",
        border: "none",
        cursor: "pointer",
        transition: "all 0.22s ease",
        transform: active ? "scale(0.96)" : "scale(1)",
        boxShadow: active
          ? "0 2px 12px rgba(30,122,110,0.25)"
          : "0 6px 28px rgba(30,122,110,0.32)",
        letterSpacing: "0.01em",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.transform = "scale(1.04) translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 10px 40px rgba(30,122,110,0.44)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 6px 28px rgba(30,122,110,0.32)";
      }}
    >
      {children}
    </button>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const anim = (delay: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(28px)",
    transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
  });

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <AnimatedBackground />

      {/* Nav */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 40px",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          background: "rgba(250,249,245,0.72)",
          borderBottom: "1px solid rgba(127,173,139,0.15)",
        }}
      >
        <span
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "1.45rem",
            fontWeight: 600,
            color: "#1e7a6e",
            letterSpacing: "-0.01em",
          }}
        >
          Corevida
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => navigate("/auth")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 500,
              fontSize: "0.9rem",
              color: "#4a6560",
              padding: "8px 16px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#1e7a6e")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#4a6560")}
          >
            Log in
          </button>
          <PrimaryButton onClick={() => navigate("/auth")}>Get started</PrimaryButton>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 24px 80px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Badge */}
        <div style={{ ...anim(0.05) }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 18px",
              borderRadius: "50px",
              background: "rgba(127,173,139,0.14)",
              border: "1px solid rgba(127,173,139,0.32)",
              marginBottom: "36px",
              fontFamily: "'Outfit', sans-serif",
              fontSize: "0.82rem",
              color: "#1e7a6e",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#a8e63d",
                display: "inline-block",
                animation: "pulse-ring 2s ease-in-out infinite",
              }}
            />
            5-Agent AI System
          </div>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(2.6rem, 6.5vw, 5.2rem)",
            fontWeight: 700,
            lineHeight: 1.08,
            color: "#1a2420",
            maxWidth: "820px",
            marginBottom: "24px",
            letterSpacing: "-0.02em",
            ...anim(0.12),
          }}
        >
          Your AI wellness coach,{" "}
          <em style={{ color: "#1e7a6e", fontStyle: "italic" }}>built</em>{" "}
          around you.
        </h1>

        {/* Subhead */}
        <p
          style={{
            fontSize: "clamp(1rem, 2.2vw, 1.2rem)",
            color: "#4a6560",
            maxWidth: "540px",
            lineHeight: 1.75,
            marginBottom: "48px",
            ...anim(0.2),
          }}
        >
          Nutrition, fitness, and habit plans generated together by a multi-agent AI — then synthesized into one
          coherent program built around your actual life.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            gap: "14px",
            flexWrap: "wrap",
            justifyContent: "center",
            ...anim(0.28),
          }}
        >
          <PrimaryButton onClick={() => navigate("/auth")} large>
            Start for free →
          </PrimaryButton>
          <button
            onClick={() => navigate("/intake")}
            style={{
              padding: "18px 40px",
              borderRadius: "50px",
              background: "rgba(255,255,255,0.52)",
              color: "#1e7a6e",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 500,
              fontSize: "1.05rem",
              border: "1.5px solid rgba(30,122,110,0.28)",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.22s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.72)";
              e.currentTarget.style.borderColor = "rgba(30,122,110,0.55)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.52)";
              e.currentTarget.style.borderColor = "rgba(30,122,110,0.28)";
            }}
          >
            Try demo
          </button>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "56px",
            marginTop: "76px",
            flexWrap: "wrap",
            justifyContent: "center",
            ...anim(0.4),
          }}
        >
          {STATS.map(({ value, label }) => (
            <div key={value} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#1e7a6e",
                  lineHeight: 1,
                  marginBottom: "6px",
                }}
              >
                {value}
              </div>
              <div style={{ fontSize: "0.82rem", color: "#7fad8b", fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        style={{
          padding: "80px 24px",
          maxWidth: "960px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <h2
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
              fontWeight: 700,
              color: "#1a2420",
              marginBottom: "12px",
              letterSpacing: "-0.02em",
            }}
          >
            Five agents, one plan
          </h2>
          <p style={{ color: "#6b8c85", fontSize: "1.05rem", lineHeight: 1.65 }}>
            Parallel AI agents build your nutrition, fitness, and habit plans simultaneously — then a supervisor
            synthesizes them into one coherent program.
          </p>
        </div>

        <GlassCard style={{ padding: "48px 40px" }} hover={false}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0",
              flexWrap: "wrap",
            }}
          >
            {/* Input node */}
            <AgentNode icon="📋" label="Your Goals" sub="Intake" color="#7fad8b" delay={0} />
            <Arrow />

            {/* Parallel agents */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <AgentNode icon="🥗" label="Nutrition" sub="Agent 1" color="#2a9d8f" delay={0.1} small />
              <AgentNode icon="🏋️" label="Fitness" sub="Agent 2" color="#2a9d8f" delay={0.2} small />
              <AgentNode icon="✅" label="Habits" sub="Agent 3" color="#2a9d8f" delay={0.3} small />
            </div>
            <Arrow />

            {/* Supervisor */}
            <AgentNode icon="🧠" label="Supervisor" sub="Synthesis" color="#1e7a6e" delay={0.4} />
            <Arrow />

            {/* Output */}
            <AgentNode icon="✨" label="Your Plan" sub="Complete" color="#e8856a" delay={0.5} />
          </div>
        </GlassCard>
      </section>

      {/* Features */}
      <section
        style={{
          padding: "40px 24px 120px",
          maxWidth: "1100px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h2
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
            fontWeight: 700,
            color: "#1a2420",
            textAlign: "center",
            marginBottom: "48px",
            letterSpacing: "-0.02em",
          }}
        >
          Everything you need to thrive
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "18px",
          }}
        >
          {FEATURES.map((f, i) => (
            <GlassCard
              key={i}
              style={{
                padding: "32px 28px",
                animation: `fade-slide-up 0.6s ease ${i * 0.08 + 0.1}s both`,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "14px",
                  background: `${f.accent}18`,
                  border: `1px solid ${f.accent}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  marginBottom: "18px",
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  color: "#1a2420",
                  marginBottom: "10px",
                  letterSpacing: "-0.01em",
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#6b8c85", lineHeight: 1.68 }}>{f.desc}</p>
            </GlassCard>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: "center", marginTop: "64px" }}>
          <GlassCard
            style={{
              display: "inline-block",
              padding: "48px 64px",
              textAlign: "center",
              maxWidth: "560px",
              width: "100%",
            }}
          >
            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "1.8rem",
                fontWeight: 700,
                color: "#1a2420",
                marginBottom: "12px",
                letterSpacing: "-0.02em",
              }}
            >
              Ready to meet your coach?
            </h3>
            <p style={{ color: "#6b8c85", marginBottom: "28px", fontSize: "0.95rem", lineHeight: 1.65 }}>
              Takes 3 minutes to set up. Your personalized plan is generated instantly.
            </p>
            <PrimaryButton onClick={() => navigate("/auth")} large>
              Build my plan →
            </PrimaryButton>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid rgba(127,173,139,0.18)",
          padding: "28px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <span
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "1.2rem",
            fontWeight: 600,
            color: "#1e7a6e",
          }}
        >
          Corevida
        </span>
        <span style={{ fontSize: "0.82rem", color: "#7fad8b" }}>
          Built with 5 AI agents. © 2026 Corevida.
        </span>
      </footer>
    </div>
  );
}

function AgentNode({
  icon,
  label,
  sub,
  color,
  delay,
  small = false,
}: {
  icon: string;
  label: string;
  sub: string;
  color: string;
  delay: number;
  small?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        animation: `fade-slide-up 0.5s ease ${delay}s both`,
      }}
    >
      <div
        style={{
          width: small ? 58 : 70,
          height: small ? 58 : 70,
          borderRadius: "16px",
          background: `${color}15`,
          border: `1.5px solid ${color}35`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: small ? "1.3rem" : "1.55rem",
          transition: "all 0.25s ease",
        }}
      >
        {icon}
      </div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: small ? "0.72rem" : "0.8rem",
            fontWeight: 600,
            color: "#1a2420",
            lineHeight: 1.3,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: "0.68rem", color: color, fontWeight: 500 }}>{sub}</div>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div
      style={{
        color: "#b8d4c4",
        fontSize: "1.1rem",
        padding: "0 8px",
        alignSelf: "center",
        fontWeight: 300,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      →
    </div>
  );
}
