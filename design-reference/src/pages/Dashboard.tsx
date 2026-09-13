import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AnimatedBackground from "../components/AnimatedBackground";

const API = "http://127.0.0.1:8000";

interface Habit {
  name: string;
  frequency: string;
  reminder_time: string;
}

interface HabitLog {
  id: string;
  habit_name: string;
  log_date: string;
  completed: boolean;
}

// ─── Helpers ───────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function last30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function shortDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.getDate().toString();
}

// ─── Mock data generator ───────────────────────────────────

function getMockLogs(habits: Habit[]): HabitLog[] {
  const logs: HabitLog[] = [];
  const days = last30Days();
  days.forEach((day) => {
    habits.forEach((habit, hi) => {
      const seed = (day.charCodeAt(8) + hi * 7) % 10;
      const completed = seed > 3;
      if (completed || Math.random() > 0.3) {
        logs.push({
          id: `${day}-${hi}`,
          habit_name: habit.name,
          log_date: day,
          completed: completed,
        });
      }
    });
  });
  return logs;
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [todayChecked, setTodayChecked] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [celebrateStreak, setCelebrateStreak] = useState(false);
  const userName = localStorage.getItem("user_name") || "there";

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    loadData();
    return () => clearTimeout(t);
  }, []);

  async function loadData() {
    const planId = localStorage.getItem("plan_id");
    if (!planId) {
      // Use data from plan
      const raw = localStorage.getItem("plan_data");
      if (raw) {
        try {
          const plan = JSON.parse(raw);
          const h: Habit[] = plan.habit_checklist?.habits || [];
          setHabits(h);
          setLogs(getMockLogs(h));
          return;
        } catch { /* empty */ }
      }
      navigate("/");
      return;
    }

    try {
      const res = await fetch(`${API}/api/habits/${planId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const h: Habit[] = data.habits?.habits || [];
      setHabits(h);
      setLogs(data.logs || []);

      // Load today's checks
      const todayStr = today();
      const todayLogs = (data.logs || []).filter(
        (l: HabitLog) => l.log_date === todayStr && l.completed
      );
      setTodayChecked(new Set(todayLogs.map((l: HabitLog) => l.habit_name)));
    } catch {
      const raw = localStorage.getItem("plan_data");
      if (raw) {
        try {
          const plan = JSON.parse(raw);
          const h: Habit[] = plan.habit_checklist?.habits || [];
          setHabits(h);
          setLogs(getMockLogs(h));
        } catch { /* empty */ }
      }
    }
  }

  async function toggleHabit(habitName: string) {
    const nowChecked = todayChecked.has(habitName);
    // Optimistic update
    setTodayChecked((prev) => {
      const next = new Set(prev);
      nowChecked ? next.delete(habitName) : next.add(habitName);
      return next;
    });

    const planId = localStorage.getItem("plan_id") || "demo";
    const todayStr = today();

    try {
      await fetch(`${API}/api/habits/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId,
          habit_name: habitName,
          log_date: todayStr,
          completed: !nowChecked,
        }),
      });
    } catch {
      // Optimistic update stays
    }

    // Check streak celebration
    const newChecked = new Set(todayChecked);
    nowChecked ? newChecked.delete(habitName) : newChecked.add(habitName);
    if (newChecked.size === habits.length && habits.length > 0) {
      setCelebrateStreak(true);
      setTimeout(() => setCelebrateStreak(false), 3000);
    }
  }

  // ─── Streak calculation ──────────────────────────────────

  const days30 = last30Days();
  const todayStr = today();

  function dayCompletionRatio(dateStr: string): number {
    if (habits.length === 0) return 0;
    if (dateStr === todayStr) {
      return todayChecked.size / habits.length;
    }
    const dayLogs = logs.filter((l) => l.log_date === dateStr && l.completed);
    return Math.min(dayLogs.length / habits.length, 1);
  }

  function currentStreak(): number {
    let streak = 0;
    const daysCopy = [...days30].reverse();
    for (const day of daysCopy) {
      const ratio = dayCompletionRatio(day);
      if (ratio >= 0.5) streak++;
      else break;
    }
    return streak;
  }

  const streak = currentStreak();
  const todayDone = todayChecked.size;
  const totalHabits = habits.length;
  const pct = totalHabits > 0 ? Math.round((todayDone / totalHabits) * 100) : 0;

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
            onClick={() => navigate("/results")}
            style={{
              padding: "9px 20px",
              borderRadius: "10px",
              border: "1.5px solid rgba(30,122,110,0.28)",
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
            ← My plan
          </button>
        </div>
      </nav>

      <div
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          padding: "36px 24px 80px",
          position: "relative",
          zIndex: 1,
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "28px", animation: "fade-slide-up 0.5s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
                  fontWeight: 700,
                  color: "#1a2420",
                  letterSpacing: "-0.02em",
                  marginBottom: "4px",
                  lineHeight: 1.2,
                }}
              >
                Good {timeOfDay()}, {userName.split(" ")[0]}.
              </h1>
              <p style={{ fontSize: "0.9rem", color: "#6b8c85" }}>{formatDay(todayStr)} · Habit check-in</p>
            </div>

            {/* Streak badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 20px",
                borderRadius: "50px",
                background: streak >= 3 ? "rgba(232,133,106,0.1)" : "rgba(255,255,255,0.55)",
                border: `1.5px solid ${streak >= 3 ? "rgba(232,133,106,0.35)" : "rgba(127,173,139,0.25)"}`,
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                style={{
                  fontSize: "1.5rem",
                  animation: streak >= 3 ? "streak-fire 1.2s ease-in-out infinite" : undefined,
                  display: "inline-block",
                }}
              >
                {streak >= 5 ? "🔥" : streak >= 3 ? "⚡" : "✨"}
              </span>
              <div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: streak >= 3 ? "#c0614a" : "#1e7a6e",
                    lineHeight: 1,
                  }}
                >
                  {streak}-day
                </div>
                <div style={{ fontSize: "0.68rem", color: "#7fad8b", fontWeight: 500 }}>streak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Celebration banner */}
        {celebrateStreak && (
          <div
            style={{
              padding: "14px 20px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(168,230,61,0.15), rgba(42,157,143,0.1))",
              border: "1.5px solid rgba(168,230,61,0.35)",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              animation: "scale-in 0.35s ease",
            }}
          >
            <span style={{ fontSize: "1.5rem", animation: "bounce-check 0.4s ease" }}>🎉</span>
            <div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: "#3a8a1e", fontSize: "0.9rem" }}>
                All habits complete!
              </div>
              <div style={{ fontSize: "0.8rem", color: "#5aaa35" }}>You crushed it today. Come back tomorrow to keep the streak going.</div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(220px, 280px)", gap: "20px", alignItems: "start" }}>

          {/* Main habit checklist */}
          <div>
            {/* Today progress bar */}
            <Card style={{ padding: "22px 24px", marginBottom: "16px", animation: "fade-slide-up 0.5s ease 0.08s both" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#1a2420" }}>
                  Today's progress
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    color: pct === 100 ? "#5a9a10" : "#1e7a6e",
                  }}
                >
                  {todayDone}/{totalHabits}
                </span>
              </div>
              <div style={{ height: "8px", borderRadius: "8px", background: "rgba(127,173,139,0.18)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: "8px",
                    background: pct === 100
                      ? "linear-gradient(90deg, #7fad8b, #a8e63d)"
                      : "linear-gradient(90deg, #1e7a6e, #2a9d8f)",
                    width: `${pct}%`,
                    transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
                    boxShadow: "0 0 10px rgba(42,157,143,0.35)",
                  }}
                />
              </div>
              <div style={{ fontSize: "0.78rem", color: "#7fad8b", marginTop: "8px" }}>
                {pct === 100
                  ? "All done for today! 🎉"
                  : pct === 0
                  ? "Tap a habit below to check it off"
                  : `${100 - pct}% left — you're doing great`}
              </div>
            </Card>

            {/* Habit list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {habits.map((habit, i) => {
                const done = todayChecked.has(habit.name);
                return (
                  <Card
                    key={i}
                    style={{
                      padding: "18px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      cursor: "pointer",
                      background: done ? "rgba(127,173,139,0.11)" : "rgba(255,255,255,0.58)",
                      border: `1.5px solid ${done ? "rgba(127,173,139,0.32)" : "rgba(255,255,255,0.72)"}`,
                      transition: "all 0.25s ease",
                      animation: `fade-slide-up 0.4s ease ${0.12 + i * 0.06}s both`,
                    }}
                    onClick={() => toggleHabit(habit.name)}
                  >
                    {/* Checkbox */}
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "8px",
                        border: `2px solid ${done ? "#7fad8b" : "rgba(127,173,139,0.38)"}`,
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
                        <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                          <path
                            d="M1.5 5.5L5.5 9.5L12.5 1.5"
                            stroke="white"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
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
                          textDecorationColor: "rgba(127,173,139,0.6)",
                        }}
                      >
                        {habit.name}
                      </div>
                      <div style={{ fontSize: "0.73rem", color: "#7fad8b", marginTop: "2px" }}>
                        {habit.frequency} · {habit.reminder_time}
                      </div>
                    </div>

                    {done && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#7fad8b",
                          fontWeight: 600,
                          animation: "fade-in 0.3s ease",
                        }}
                      >
                        Done ✓
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* 30-day calendar heatmap */}
            <Card style={{ padding: "22px 20px", animation: "fade-slide-up 0.5s ease 0.1s both" }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.88rem", color: "#1a2420", marginBottom: "14px" }}>
                30-day history
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "4px",
                }}
              >
                {days30.map((day) => {
                  const ratio = dayCompletionRatio(day);
                  const isToday = day === todayStr;
                  let bg = "rgba(127,173,139,0.1)";
                  if (ratio >= 0.8) bg = "#2a9d8f";
                  else if (ratio >= 0.5) bg = "rgba(42,157,143,0.5)";
                  else if (ratio > 0) bg = "rgba(42,157,143,0.22)";

                  return (
                    <div
                      key={day}
                      title={`${formatDay(day)} — ${Math.round(ratio * 100)}% complete`}
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        borderRadius: "4px",
                        background: bg,
                        border: isToday ? "1.5px solid #1e7a6e" : "1px solid transparent",
                        transition: "transform 0.15s ease",
                        cursor: "default",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.3)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", justifyContent: "flex-end" }}>
                <span style={{ fontSize: "0.65rem", color: "#7fad8b" }}>Less</span>
                {["rgba(127,173,139,0.1)", "rgba(42,157,143,0.22)", "rgba(42,157,143,0.5)", "#2a9d8f"].map((c, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: "2px", background: c }} />
                ))}
                <span style={{ fontSize: "0.65rem", color: "#7fad8b" }}>More</span>
              </div>
            </Card>

            {/* Stats cards */}
            <Card style={{ padding: "18px 20px", animation: "fade-slide-up 0.5s ease 0.16s both" }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.88rem", color: "#1a2420", marginBottom: "14px" }}>
                Stats
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { label: "Current streak", value: `${streak} days`, icon: streak >= 3 ? "🔥" : "✨" },
                  {
                    label: "Completed today",
                    value: `${todayDone}/${totalHabits}`,
                    icon: pct === 100 ? "🎉" : "📋",
                  },
                  {
                    label: "30-day avg",
                    value: (() => {
                      const total = days30.reduce((sum, d) => sum + dayCompletionRatio(d), 0);
                      return `${Math.round((total / 30) * 100)}%`;
                    })(),
                    icon: "📊",
                  },
                ].map(({ label, value, icon }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: "rgba(127,173,139,0.06)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.95rem" }}>{icon}</span>
                      <span style={{ fontSize: "0.8rem", color: "#6b8c85" }}>{label}</span>
                    </div>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        color: "#1e7a6e",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick actions */}
            <Card style={{ padding: "18px 20px", animation: "fade-slide-up 0.5s ease 0.22s both" }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.88rem", color: "#1a2420", marginBottom: "12px" }}>
                Quick actions
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { label: "View full plan", action: () => navigate("/results"), icon: "📋" },
                  { label: "Update goals", action: () => navigate("/intake"), icon: "🎯" },
                  {
                    label: "Log out",
                    action: () => {
                      localStorage.clear();
                      navigate("/");
                    },
                    icon: "👋",
                  },
                ].map(({ label, action, icon }) => (
                  <button
                    key={label}
                    onClick={action}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid rgba(127,173,139,0.2)",
                      background: "transparent",
                      cursor: "pointer",
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: "0.82rem",
                      color: "#4a6560",
                      textAlign: "left",
                      transition: "all 0.18s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(127,173,139,0.08)";
                      e.currentTarget.style.borderColor = "rgba(127,173,139,0.35)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = "rgba(127,173,139,0.2)";
                    }}
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
