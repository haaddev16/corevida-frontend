import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import AnimatedBackground from "../components/AnimatedBackground";

const API = "http://127.0.0.1:8000";

const AGENTS = [
  {
    icon: "🥗",
    name: "Nutrition Agent",
    task: "Analyzing your goals and calculating your optimal calorie & macro targets…",
    color: "#2a9d8f",
    duration: 3200,
  },
  {
    icon: "🏋️",
    name: "Fitness Agent",
    task: "Designing your personalized workout program with your equipment and schedule…",
    color: "#7fad8b",
    duration: 3000,
  },
  {
    icon: "✅",
    name: "Habits Agent",
    task: "Building a set of sustainable daily habits that fit your lifestyle…",
    color: "#e8856a",
    duration: 2800,
  },
  {
    icon: "🧠",
    name: "Supervisor Agent",
    task: "Reviewing all three plans for coherence and bringing everything together…",
    color: "#1e7a6e",
    duration: 3500,
  },
];

const MOCK_PLAN = {
  plan_id: "demo-plan-001",
  nutrition_plan: {
    daily_calorie_target: 2150,
    meals: [
      { name: "Breakfast", description: "Greek yogurt bowl with berries, granola, and a drizzle of honey", estimated_calories: 420 },
      { name: "Morning Snack", description: "Apple with 2 tbsp almond butter", estimated_calories: 195 },
      { name: "Lunch", description: "Grilled chicken over mixed greens with quinoa, cucumber, avocado, and lemon vinaigrette", estimated_calories: 540 },
      { name: "Afternoon Snack", description: "Handful of mixed nuts and a protein shake", estimated_calories: 280 },
      { name: "Dinner", description: "Baked salmon with roasted sweet potato and steamed broccoli", estimated_calories: 580 },
      { name: "Evening", description: "Cottage cheese with sliced banana — optional based on hunger", estimated_calories: 135 },
    ],
    notes: "Prioritize protein at every meal to support muscle retention and satiety. Meal times are flexible — align with your natural schedule.",
  },
  fitness_plan: {
    weekly_schedule: [
      { day: "Monday", focus: "Upper Body Strength", exercises: [{ name: "Push-ups", sets: 4, reps: "12" }, { name: "Dumbbell rows", sets: 3, reps: "10 each" }, { name: "Shoulder press", sets: 3, reps: "10" }] },
      { day: "Tuesday", focus: "Cardio & Mobility", exercises: [{ name: "Brisk walk / jog", sets: 1, reps: "30 min" }, { name: "Hip flexor stretch", sets: 3, reps: "45s hold" }] },
      { day: "Wednesday", focus: "Lower Body Strength", exercises: [{ name: "Goblet squats", sets: 4, reps: "12" }, { name: "Romanian deadlift", sets: 3, reps: "10" }, { name: "Glute bridges", sets: 3, reps: "15" }] },
      { day: "Thursday", focus: "Active Recovery", exercises: [{ name: "Yoga flow", sets: 1, reps: "20 min" }, { name: "Foam rolling", sets: 1, reps: "10 min" }] },
      { day: "Friday", focus: "Full Body Circuit", exercises: [{ name: "Burpees", sets: 3, reps: "10" }, { name: "Dumbbell lunges", sets: 3, reps: "10 each" }, { name: "Plank hold", sets: 3, reps: "45s" }] },
      { day: "Saturday", focus: "Cardio of choice", exercises: [{ name: "Cycling / swimming / hiking", sets: 1, reps: "45 min" }] },
      { day: "Sunday", focus: "Rest & Reflect", exercises: [{ name: "Gentle walk", sets: 1, reps: "20 min" }, { name: "Breathwork / meditation", sets: 1, reps: "10 min" }] },
    ],
    notes: "Progressive overload: increase weights by 5% every 2 weeks. Listen to your body — swapping a hard day for rest is always valid.",
  },
  habit_checklist: {
    habits: [
      { name: "Drink 2.5L of water", frequency: "Daily", reminder_time: "07:00" },
      { name: "10 minutes of morning movement", frequency: "Daily", reminder_time: "07:30" },
      { name: "Log meals in journal", frequency: "Daily", reminder_time: "20:00" },
      { name: "7–9 hours of sleep", frequency: "Daily", reminder_time: "22:00" },
      { name: "5-minute breathing exercise", frequency: "Daily", reminder_time: "12:00" },
      { name: "No screens 1 hour before bed", frequency: "Daily", reminder_time: "21:00" },
    ],
  },
  final_plan: {
    summary: "Your plan balances progressive strength training with sustainable nutrition and mindful recovery habits. Based on your goals and lifestyle, we've created a calorie-controlled, protein-forward eating plan and a 5-day training program that builds both strength and cardiovascular fitness. The habit layer ties everything together with small, evidence-backed daily behaviors.",
    nutrition_highlights: "2,150 kcal/day with 40% carbs, 30% protein, 30% fat. Meal timing is flexible.",
    fitness_highlights: "4 strength sessions + 2 cardio + 1 full rest. Progressive overload every 2 weeks.",
    habit_highlights: "6 core daily habits focused on hydration, sleep quality, and stress reduction.",
    key_recommendations: [
      "Hit your protein target (160g/day) before worrying about anything else.",
      "Sleep is your #1 recovery tool — treat 8 hours as non-negotiable.",
      "Week 3 is typically the hardest — plan for it, don't quit before it.",
      "Track one metric per week — weight, lifts, or energy — not all at once.",
    ],
  },
};

export default function Loading() {
  const navigate = useNavigate();
  const [activeAgent, setActiveAgent] = useState(-1);
  const [completedAgents, setCompletedAgents] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 80);

    // Start agent animation sequence
    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    AGENTS.forEach((agent, i) => {
      const startTime = elapsed;
      timers.push(
        setTimeout(() => {
          setActiveAgent(i);
        }, startTime)
      );
      elapsed += agent.duration;
      timers.push(
        setTimeout(() => {
          setCompletedAgents((prev) => [...prev, i]);
        }, elapsed - 200)
      );
    });

    // Mark fully done
    timers.push(
      setTimeout(() => {
        setDone(true);
      }, elapsed + 600)
    );

    // Actual API call
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      const profileId = localStorage.getItem("profile_id") || "demo";

      fetch(`${API}/api/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId }),
      })
        .then((r) => r.json())
        .then((plan) => {
          localStorage.setItem("plan_id", plan.plan_id);
          localStorage.setItem("plan_data", JSON.stringify(plan));
        })
        .catch(() => {
          // Store mock plan for demo
          localStorage.setItem("plan_id", MOCK_PLAN.plan_id);
          localStorage.setItem("plan_data", JSON.stringify(MOCK_PLAN));
        });
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (done) {
      setTimeout(() => navigate("/results"), 800);
    }
  }, [done, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <AnimatedBackground variant="loading" />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          maxWidth: "520px",
          width: "100%",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s ease",
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "1.4rem",
            fontWeight: 600,
            color: "#4db8aa",
            marginBottom: "40px",
            letterSpacing: "-0.01em",
          }}
        >
          Corevida
        </div>

        {/* Main text */}
        <h2
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
            fontWeight: 700,
            color: "#e8f5f2",
            marginBottom: "12px",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          {done ? "Your plan is ready ✨" : "Building your plan…"}
        </h2>
        <p
          style={{
            fontSize: "0.9rem",
            color: "#7fad8b",
            marginBottom: "52px",
            lineHeight: 1.6,
          }}
        >
          {done
            ? "All four agents have completed their work."
            : "Four AI agents are working in parallel. This usually takes under 60 seconds."}
        </p>

        {/* Agent cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {AGENTS.map((agent, i) => {
            const isActive = activeAgent === i && !completedAgents.includes(i);
            const isDone = completedAgents.includes(i);
            const isPending = activeAgent < i;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "18px 22px",
                  borderRadius: "16px",
                  background: isDone
                    ? "rgba(127,173,139,0.12)"
                    : isActive
                    ? "rgba(42,157,143,0.12)"
                    : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${
                    isDone
                      ? "rgba(127,173,139,0.28)"
                      : isActive
                      ? "rgba(42,157,143,0.35)"
                      : "rgba(255,255,255,0.08)"
                  }`,
                  backdropFilter: "blur(12px)",
                  transition: "all 0.4s ease",
                  animation: isDone || isActive ? `agent-appear 0.4s ease` : undefined,
                  boxShadow: isActive ? `0 0 28px rgba(42,157,143,0.2)` : "none",
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    background: isDone
                      ? "rgba(127,173,139,0.2)"
                      : isActive
                      ? `${agent.color}25`
                      : "rgba(255,255,255,0.05)",
                    border: `1.5px solid ${isDone ? "rgba(127,173,139,0.3)" : isActive ? `${agent.color}40` : "rgba(255,255,255,0.08)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                    flexShrink: 0,
                    animation: isActive ? "agent-pulse 1.4s ease-in-out infinite" : undefined,
                    transition: "all 0.3s ease",
                  }}
                >
                  {isDone ? "✓" : agent.icon}
                </div>

                {/* Text */}
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 600,
                      fontSize: "0.88rem",
                      color: isDone ? "#7fad8b" : isActive ? "#e8f5f2" : "rgba(200,220,215,0.35)",
                      marginBottom: "3px",
                      transition: "color 0.3s ease",
                    }}
                  >
                    {agent.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: isDone
                        ? "rgba(127,173,139,0.7)"
                        : isActive
                        ? "rgba(200,230,220,0.7)"
                        : "rgba(200,220,215,0.2)",
                      lineHeight: 1.5,
                      transition: "color 0.3s ease",
                    }}
                  >
                    {isDone ? "Complete" : isActive ? agent.task : isPending ? "Waiting…" : ""}
                  </div>
                </div>

                {/* Status indicator */}
                <div style={{ flexShrink: 0 }}>
                  {isDone ? (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#7fad8b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: "bounce-check 0.4s ease",
                      }}
                    >
                      <span style={{ color: "white", fontSize: "0.7rem", fontWeight: 700 }}>✓</span>
                    </div>
                  ) : isActive ? (
                    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                      {[0, 0.18, 0.36].map((d, di) => (
                        <span
                          key={di}
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: agent.color,
                            display: "inline-block",
                            animation: `dot-bounce 0.8s ease ${d}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: "1.5px solid rgba(255,255,255,0.1)",
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall progress */}
        <div style={{ marginTop: "36px" }}>
          <div
            style={{
              height: "4px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.1)",
              overflow: "hidden",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: "4px",
                background: "linear-gradient(90deg, #2a9d8f, #a8e63d)",
                width: `${done ? 100 : (completedAgents.length / AGENTS.length) * 100}%`,
                transition: "width 0.5s ease",
                boxShadow: "0 0 10px rgba(168,230,61,0.4)",
              }}
            />
          </div>
          <div style={{ fontSize: "0.78rem", color: "rgba(127,173,139,0.6)" }}>
            {done
              ? "Complete — redirecting to your plan…"
              : `${completedAgents.length} of ${AGENTS.length} agents complete`}
          </div>
        </div>
      </div>
    </div>
  );
}
