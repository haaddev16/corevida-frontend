import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import AnimatedBackground from "../components/AnimatedBackground";

type Tab = "nutrition" | "fitness" | "habits";

interface Meal { name: string; description: string; estimated_calories: number }
interface Exercise { name: string; sets: number; reps: string }
interface DayPlan { day: string; focus: string; exercises: Exercise[] }
interface Habit { name: string; frequency: string; reminder_time: string }

interface Plan {
  plan_id: string;
  nutrition_plan: { daily_calorie_target: number; meals: Meal[]; notes: string };
  fitness_plan: { weekly_schedule: DayPlan[]; notes: string };
  habit_checklist: { habits: Habit[] };
  final_plan: { summary: string; key_recommendations: string[] };
}

// ─── Animated counter ──────────────────────────────────────

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const duration = 1600;
    const steps = 48;
    const step = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        setValue(target);
        clearInterval(interval);
      } else {
        setValue(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <span>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Progress ring ─────────────────────────────────────────

function ProgressRing({ pct, size = 100, stroke = 8, color = "#2a9d8f" }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const [drawn, setDrawn] = useState(circ);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(offset), 100);
    return () => clearTimeout(t);
  }, [offset]);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(127,173,139,0.18)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={drawn}
        style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

// ─── Glass Card ────────────────────────────────────────────

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.58)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.72)",
        borderRadius: "20px",
        boxShadow: "0 4px 24px rgba(30,122,110,0.07)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────

export default function Results() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [tab, setTab] = useState<Tab>("nutrition");
  const [mounted, setMounted] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("plan_data");
    if (raw) {
      try {
        setPlan(JSON.parse(raw));
      } catch {
        navigate("/");
      }
    } else {
      navigate("/");
    }
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, [navigate]);

  if (!plan) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <AnimatedBackground />
        <div style={{ color: "#7fad8b", fontFamily: "'Outfit', sans-serif" }}>Loading your plan…</div>
      </div>
    );
  }

  const calorieTarget = plan.nutrition_plan.daily_calorie_target;
  const name = localStorage.getItem("user_name") || "there";

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <AnimatedBackground />

      {/* Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          background: "rgba(250,249,245,0.78)",
          borderBottom: "1px solid rgba(127,173,139,0.15)",
        }}
      >
        <span
          style={{ fontFamily: "'Fraunces', serif", fontSize: "1.3rem", fontWeight: 600, color: "#1e7a6e", cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          Corevida
        </span>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "9px 20px",
              borderRadius: "10px",
              border: "1.5px solid rgba(30,122,110,0.3)",
              background: "transparent",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 500,
              fontSize: "0.85rem",
              color: "#1e7a6e",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(30,122,110,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Track habits →
          </button>
          <button
            onClick={() => { localStorage.removeItem("plan_data"); navigate("/intake"); }}
            style={{
              padding: "9px 20px",
              borderRadius: "10px",
              border: "none",
              background: "rgba(127,173,139,0.12)",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 500,
              fontSize: "0.85rem",
              color: "#4a6560",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Regenerate
          </button>
        </div>
      </nav>

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 24px 80px",
          position: "relative",
          zIndex: 1,
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        {/* Summary hero card */}
        <Card
          style={{
            padding: "36px",
            marginBottom: "24px",
            animation: "fade-slide-up 0.6s ease both",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "28px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "240px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  borderRadius: "50px",
                  background: "rgba(168,230,61,0.12)",
                  border: "1px solid rgba(168,230,61,0.3)",
                  marginBottom: "16px",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#5a9a10",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                ✨ Your Plan is Ready
              </div>
              <h1
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontWeight: 700,
                  color: "#1a2420",
                  marginBottom: "14px",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.25,
                }}
              >
                Hey {name.split(" ")[0]}, here's your personalized program.
              </h1>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#4a6560",
                  lineHeight: 1.72,
                  marginBottom: "20px",
                  maxWidth: "480px",
                }}
              >
                {plan.final_plan.summary}
              </p>

              {/* Key recommendations */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {plan.final_plan.key_recommendations.map((rec, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      animation: `fade-slide-up 0.5s ease ${0.1 + i * 0.07}s both`,
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "6px",
                        background: "rgba(30,122,110,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "1px",
                        fontSize: "0.65rem",
                        color: "#1e7a6e",
                        fontWeight: 700,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "#4a6560", lineHeight: 1.55 }}>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calorie stat */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", flexShrink: 0 }}>
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <ProgressRing pct={72} size={120} stroke={9} color="#2a9d8f" />
                <div style={{ position: "absolute", textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: "1.3rem",
                      color: "#1a2420",
                      lineHeight: 1,
                    }}
                  >
                    <CountUp target={calorieTarget} />
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "#7fad8b", fontWeight: 600, marginTop: "2px" }}>kcal/day</div>
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#4a6560" }}>Daily target</div>
                <div style={{ fontSize: "0.72rem", color: "#7fad8b", marginTop: "2px" }}>Based on your profile</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
            animation: "fade-slide-up 0.5s ease 0.15s both",
          }}
        >
          {(["nutrition", "fitness", "habits"] as Tab[]).map((t) => {
            const labels = { nutrition: "🥗 Nutrition", fitness: "🏋️ Fitness", habits: "✅ Habits" };
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "50px",
                  border: `1.5px solid ${active ? "#1e7a6e" : "rgba(127,173,139,0.25)"}`,
                  background: active
                    ? "linear-gradient(135deg, #1e7a6e, #2a9d8f)"
                    : "rgba(255,255,255,0.5)",
                  color: active ? "white" : "#6b8c85",
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: active ? 600 : 400,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  transition: "all 0.22s ease",
                  backdropFilter: "blur(8px)",
                  boxShadow: active ? "0 3px 14px rgba(30,122,110,0.25)" : "none",
                }}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div key={tab} style={{ animation: "tab-slide 0.32s ease" }}>
          {tab === "nutrition" && (
            <NutritionTab meals={plan.nutrition_plan.meals} notes={plan.nutrition_plan.notes} target={calorieTarget} />
          )}
          {tab === "fitness" && (
            <FitnessTab schedule={plan.fitness_plan.weekly_schedule} notes={plan.fitness_plan.notes} expandedDay={expandedDay} setExpandedDay={setExpandedDay} />
          )}
          {tab === "habits" && <HabitsTab habits={plan.habit_checklist.habits} />}
        </div>
      </div>
    </div>
  );
}

// ─── Nutrition tab ─────────────────────────────────────────

function NutritionTab({ meals, notes, target }: { meals: Meal[]; notes: string; target: number }) {
  const mealColors = ["#2a9d8f", "#7fad8b", "#e8856a", "#a8ceb0", "#f5c95e", "#b0d4ce"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {meals.map((meal, i) => (
        <Card
          key={i}
          style={{
            padding: "22px 24px",
            display: "flex",
            alignItems: "center",
            gap: "18px",
            animation: `fade-slide-up 0.45s ease ${i * 0.06}s both`,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: `${mealColors[i % mealColors.length]}18`,
              border: `1.5px solid ${mealColors[i % mealColors.length]}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: "1.1rem",
            }}
          >
            {["🌅", "☀️", "🥗", "🍎", "🌙", "🌛"][i] || "🍽️"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span
                style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.92rem", color: "#1a2420" }}
              >
                {meal.name}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: mealColors[i % mealColors.length],
                  background: `${mealColors[i % mealColors.length]}12`,
                  padding: "3px 10px",
                  borderRadius: "20px",
                }}
              >
                {meal.estimated_calories} kcal
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#6b8c85", lineHeight: 1.55, margin: 0 }}>{meal.description}</p>
          </div>
        </Card>
      ))}

      {/* Total */}
      <Card style={{ padding: "18px 24px", background: "rgba(42,157,143,0.06)", border: "1.5px solid rgba(42,157,143,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, color: "#2a9d8f", fontSize: "0.88rem" }}>
            Total daily target
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "1rem",
              color: "#1e7a6e",
            }}
          >
            {target.toLocaleString()} kcal
          </span>
        </div>
      </Card>

      {notes && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "12px",
            background: "rgba(127,173,139,0.08)",
            border: "1px solid rgba(127,173,139,0.2)",
            fontSize: "0.84rem",
            color: "#4a6560",
            lineHeight: 1.6,
          }}
        >
          <span style={{ fontWeight: 600, color: "#1e7a6e" }}>Coach note: </span>
          {notes}
        </div>
      )}
    </div>
  );
}

// ─── Fitness tab ───────────────────────────────────────────

function FitnessTab({ schedule, notes, expandedDay, setExpandedDay }: {
  schedule: DayPlan[];
  notes: string;
  expandedDay: string | null;
  setExpandedDay: (d: string | null) => void;
}) {
  const dayColors: Record<string, string> = {
    Monday: "#2a9d8f", Tuesday: "#7fad8b", Wednesday: "#e8856a",
    Thursday: "#a8ceb0", Friday: "#1e7a6e", Saturday: "#f5c95e", Sunday: "#b0d4ce",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Horizontal scroll on mobile, grid on desktop */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        {schedule.map((day, i) => {
          const color = dayColors[day.day] || "#7fad8b";
          const isExpanded = expandedDay === day.day;
          return (
            <button
              key={i}
              onClick={() => setExpandedDay(isExpanded ? null : day.day)}
              style={{
                padding: "14px 10px",
                borderRadius: "14px",
                border: `1.5px solid ${isExpanded ? color : "rgba(127,173,139,0.22)"}`,
                background: isExpanded ? `${color}14` : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.22s ease",
                backdropFilter: "blur(8px)",
                transform: isExpanded ? "scale(1.03)" : "scale(1)",
                animation: `fade-slide-up 0.4s ease ${i * 0.05}s both`,
              }}
            >
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                {day.day.slice(0, 3)}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#4a6560", lineHeight: 1.4 }}>{day.focus.split(" ").slice(0, 2).join(" ")}</div>
            </button>
          );
        })}
      </div>

      {/* Expanded day */}
      {expandedDay && (() => {
        const day = schedule.find((d) => d.day === expandedDay)!;
        const color = dayColors[day.day] || "#7fad8b";
        return (
          <Card style={{ padding: "24px", animation: "scale-in 0.28s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div
                style={{
                  width: 40, height: 40, borderRadius: "10px",
                  background: `${color}18`, border: `1.5px solid ${color}35`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.1rem",
                }}
              >
                {["💪","🚶","🏋️","🧘","⚡","🚴","😴"][schedule.findIndex((d) => d.day === expandedDay)]}
              </div>
              <div>
                <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, color: "#1a2420", fontSize: "1.05rem" }}>
                  {day.day}
                </div>
                <div style={{ fontSize: "0.82rem", color: color, fontWeight: 500 }}>{day.focus}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {day.exercises.map((ex, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: "rgba(250,249,245,0.6)",
                    border: "1px solid rgba(127,173,139,0.15)",
                    animation: `fade-slide-up 0.3s ease ${i * 0.05}s both`,
                  }}
                >
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: "0.88rem", color: "#1a2420" }}>
                    {ex.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.78rem",
                      color: color,
                      fontWeight: 600,
                      background: `${color}10`,
                      padding: "3px 10px",
                      borderRadius: "6px",
                    }}
                  >
                    {ex.sets > 1 ? `${ex.sets}×${ex.reps}` : ex.reps}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}

      {!expandedDay && (
        <p style={{ fontSize: "0.82rem", color: "#7fad8b", textAlign: "center", padding: "8px 0" }}>
          Tap a day to see your exercises
        </p>
      )}

      {notes && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "12px",
            background: "rgba(127,173,139,0.08)",
            border: "1px solid rgba(127,173,139,0.2)",
            fontSize: "0.84rem",
            color: "#4a6560",
            lineHeight: 1.6,
          }}
        >
          <span style={{ fontWeight: 600, color: "#1e7a6e" }}>Coach note: </span>
          {notes}
        </div>
      )}
    </div>
  );
}

// ─── Habits tab ────────────────────────────────────────────

function HabitsTab({ habits }: { habits: Habit[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div
        style={{
          padding: "12px 18px",
          borderRadius: "12px",
          background: "rgba(168,230,61,0.08)",
          border: "1px solid rgba(168,230,61,0.22)",
          fontSize: "0.84rem",
          color: "#5a9a10",
          marginBottom: "4px",
          fontWeight: 500,
        }}
      >
        These are your starting habits. Head to the Dashboard to track them daily.
      </div>
      {habits.map((habit, i) => {
        const done = checked.has(i);
        return (
          <Card
            key={i}
            style={{
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              cursor: "pointer",
              transition: "all 0.22s ease",
              animation: `fade-slide-up 0.4s ease ${i * 0.06}s both`,
              background: done ? "rgba(127,173,139,0.1)" : "rgba(255,255,255,0.58)",
              border: `1.5px solid ${done ? "rgba(127,173,139,0.3)" : "rgba(255,255,255,0.72)"}`,
            }}
            onClick={() => toggle(i)}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "7px",
                border: `2px solid ${done ? "#7fad8b" : "rgba(127,173,139,0.35)"}`,
                background: done ? "#7fad8b" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.22s ease",
                animation: done ? "bounce-check 0.35s ease" : undefined,
              }}
            >
              {done && (
                <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                  <path
                    d="M1.5 5L5 8.5L11.5 1.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ animation: "check-draw 0.25s ease" }}
                  />
                </svg>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  color: done ? "#7fad8b" : "#1a2420",
                  textDecoration: done ? "line-through" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {habit.name}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#7fad8b", marginTop: "2px" }}>
                {habit.frequency} · {habit.reminder_time}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
