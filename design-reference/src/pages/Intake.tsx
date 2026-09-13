import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AnimatedBackground from "../components/AnimatedBackground";

const API = "http://127.0.0.1:8000";

// ─── Data ──────────────────────────────────────────────────

const GOALS = [
  "Lose weight", "Build strength", "Improve energy", "Better sleep",
  "Reduce stress", "Improve flexibility", "Run a 5K", "Eat healthier",
];

const DIETARY = [
  "Vegetarian", "Vegan", "Gluten-free", "Dairy-free",
  "Keto", "Paleo", "Halal", "No restrictions",
];

const EQUIPMENT = [
  "No equipment", "Dumbbells", "Barbell & plates", "Pull-up bar",
  "Resistance bands", "Kettlebells", "Full gym", "Cardio machines",
];

const ACTIVITY_LEVELS = [
  { key: "sedentary", icon: "🪑", label: "Sedentary", desc: "Mostly desk work, little exercise" },
  { key: "lightly active", icon: "🚶", label: "Lightly active", desc: "Light exercise 1–3 days/week" },
  { key: "active", icon: "🏃", label: "Active", desc: "Moderate exercise 3–5 days/week" },
  { key: "very active", icon: "⚡", label: "Very active", desc: "Intense exercise 6–7 days/week" },
];

const STEPS = ["Goals", "About you", "Activity", "Diet", "Schedule"];

// ─── Types ─────────────────────────────────────────────────

interface IntakeData {
  goals: string[];
  age: string;
  weight: string;
  height: string;
  weightUnit: "kg" | "lbs";
  heightUnit: "cm" | "ft";
  sex: string;
  activity_level: string;
  dietary_restrictions: string[];
  equipment_available: string[];
  time_availability_minutes: number;
}

// ─── Helpers ───────────────────────────────────────────────

function Chip({
  label,
  selected,
  onClick,
  color = "#2a9d8f",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "9px 18px",
        borderRadius: "50px",
        border: `1.5px solid ${selected ? color : "rgba(127,173,139,0.3)"}`,
        background: selected ? `${color}18` : "rgba(255,255,255,0.5)",
        color: selected ? color : "#6b8c85",
        fontFamily: "'Outfit', sans-serif",
        fontWeight: selected ? 600 : 400,
        fontSize: "0.88rem",
        cursor: "pointer",
        transition: "all 0.2s ease",
        backdropFilter: "blur(6px)",
        transform: selected ? "scale(1.03)" : "scale(1)",
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.borderColor = `${color}60`;
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.borderColor = "rgba(127,173,139,0.3)";
      }}
    >
      {selected && <span style={{ marginRight: 5 }}>✓</span>}
      {label}
    </button>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  unit,
  onUnitToggle,
  unitOptions,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  unit?: string;
  onUnitToggle?: () => void;
  unitOptions?: string[];
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ flex: 1, minWidth: "130px" }}>
      <label
        style={{
          display: "block",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "#4a6560",
          marginBottom: "6px",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative", display: "flex" }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            padding: unit ? "13px 70px 13px 16px" : "13px 16px",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.6)",
            border: `1.5px solid ${focused ? "#2a9d8f" : "rgba(127,173,139,0.28)"}`,
            fontFamily: "'Outfit', sans-serif",
            fontSize: "0.95rem",
            color: "#1a2420",
            outline: "none",
            transition: "all 0.2s ease",
            boxShadow: focused ? "0 0 0 3px rgba(42,157,143,0.1)" : "none",
            width: "100%",
          }}
        />
        {unit && (
          <button
            type="button"
            onClick={onUnitToggle}
            title={unitOptions ? `Switch to ${unitOptions.find((u) => u !== unit)}` : undefined}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              padding: "3px 8px",
              borderRadius: "6px",
              background: "rgba(42,157,143,0.12)",
              border: "1px solid rgba(42,157,143,0.25)",
              color: "#2a9d8f",
              fontFamily: "'Outfit', sans-serif",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: onUnitToggle ? "pointer" : "default",
              transition: "all 0.15s",
            }}
          >
            {unit}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────

export default function Intake() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animKey, setAnimKey] = useState(0);

  const [data, setData] = useState<IntakeData>({
    goals: [],
    age: "",
    weight: "",
    height: "",
    weightUnit: "kg",
    heightUnit: "cm",
    sex: "",
    activity_level: "",
    dietary_restrictions: [],
    equipment_available: [],
    time_availability_minutes: 45,
  });

  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  function goNext() {
    setDirection("forward");
    setAnimKey((k) => k + 1);
    setStep((s) => s + 1);
  }
  function goBack() {
    setDirection("back");
    setAnimKey((k) => k + 1);
    setStep((s) => s - 1);
  }

  async function submit() {
    const user_id = localStorage.getItem("user_id") || "guest";
    setLoading(true);

    const toKg = data.weightUnit === "lbs" ? parseFloat(data.weight) * 0.453592 : parseFloat(data.weight);
    const toCm = data.heightUnit === "ft" ? parseFloat(data.height) * 30.48 : parseFloat(data.height);

    const intake = {
      goals: data.goals,
      age: parseInt(data.age),
      weight_kg: Math.round(toKg * 10) / 10,
      height_cm: Math.round(toCm),
      sex: data.sex || "other",
      activity_level: data.activity_level || "lightly active",
      dietary_restrictions: data.dietary_restrictions,
      equipment_available: data.equipment_available,
      time_availability_minutes: data.time_availability_minutes,
    };

    try {
      const profileRes = await fetch(`${API}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, intake }),
      });

      if (!profileRes.ok) throw new Error("Profile creation failed");
      const profileData = await profileRes.json();
      localStorage.setItem("profile_id", profileData.profile_id);
      navigate("/loading");
    } catch {
      // Demo fallback
      localStorage.setItem("profile_id", "demo-profile-" + Date.now());
      localStorage.setItem("intake_data", JSON.stringify(intake));
      navigate("/loading");
    } finally {
      setLoading(false);
    }
  }

  const stepAnim: React.CSSProperties = {
    animation: `${direction === "forward" ? "fade-slide-left" : "fade-slide-right"} 0.35s ease`,
  };

  const canContinue = [
    data.goals.length > 0,
    data.age && data.weight && data.height && data.sex,
    !!data.activity_level,
    true,
    true,
  ][step];

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <AnimatedBackground />

      {/* Progress header */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "18px 32px",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          background: "rgba(250,249,245,0.75)",
          borderBottom: "1px solid rgba(127,173,139,0.15)",
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <span
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "1.2rem",
              fontWeight: 600,
              color: "#1e7a6e",
              cursor: "pointer",
              flexShrink: 0,
            }}
            onClick={() => navigate("/")}
          >
            Corevida
          </span>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#7fad8b" }}
            >
              <span style={{ fontWeight: 600 }}>{STEPS[step]}</span>
              <span>
                {step + 1} of {STEPS.length}
              </span>
            </div>
            <div
              style={{ height: "5px", borderRadius: "5px", background: "rgba(127,173,139,0.2)", overflow: "hidden" }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: "5px",
                  background: "linear-gradient(90deg, #1e7a6e, #2a9d8f)",
                  width: `${((step + 1) / STEPS.length) * 100}%`,
                  transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: "0 0 8px rgba(42,157,143,0.4)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "100px 24px 40px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            background: "rgba(255,255,255,0.58)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(255,255,255,0.72)",
            borderRadius: "24px",
            padding: "clamp(28px, 5vw, 44px)",
            boxShadow: "0 8px 40px rgba(30,122,110,0.1)",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "scale(1)" : "scale(0.97)",
            transition: "opacity 0.55s ease, transform 0.55s ease",
          }}
        >
          <div key={animKey} style={stepAnim}>
            <StepContent step={step} data={data} setData={setData} toggle={toggle} />
          </div>

          {/* Navigation */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "32px",
              paddingTop: "24px",
              borderTop: "1px solid rgba(127,173,139,0.15)",
            }}
          >
            <button
              onClick={goBack}
              disabled={step === 0}
              style={{
                padding: "12px 24px",
                borderRadius: "10px",
                border: "1.5px solid rgba(127,173,139,0.3)",
                background: "transparent",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 500,
                fontSize: "0.9rem",
                color: step === 0 ? "rgba(107,140,133,0.3)" : "#6b8c85",
                cursor: step === 0 ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (step > 0) e.currentTarget.style.background = "rgba(127,173,139,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              ← Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={goNext}
                disabled={!canContinue}
                style={{
                  padding: "12px 32px",
                  borderRadius: "10px",
                  background: canContinue
                    ? "linear-gradient(135deg, #1e7a6e, #2a9d8f)"
                    : "rgba(127,173,139,0.25)",
                  color: canContinue ? "white" : "rgba(107,140,133,0.5)",
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  border: "none",
                  cursor: canContinue ? "pointer" : "not-allowed",
                  transition: "all 0.22s ease",
                  boxShadow: canContinue ? "0 4px 16px rgba(30,122,110,0.28)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (canContinue) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 24px rgba(30,122,110,0.38)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = canContinue ? "0 4px 16px rgba(30,122,110,0.28)" : "none";
                }}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={loading}
                style={{
                  padding: "14px 36px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #1e7a6e, #2a9d8f)",
                  color: "white",
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  border: "none",
                  cursor: loading ? "wait" : "pointer",
                  boxShadow: "0 6px 24px rgba(30,122,110,0.35)",
                  transition: "all 0.22s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 10px 32px rgba(30,122,110,0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 6px 24px rgba(30,122,110,0.35)";
                }}
              >
                {loading ? "Submitting…" : "✨ Generate my plan"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step renderer ─────────────────────────────────────────

function StepContent({
  step,
  data,
  setData,
  toggle,
}: {
  step: number;
  data: IntakeData;
  setData: React.Dispatch<React.SetStateAction<IntakeData>>;
  toggle: <T>(arr: T[], val: T) => T[];
}) {
  const heading: React.CSSProperties = {
    fontFamily: "'Fraunces', serif",
    fontSize: "1.7rem",
    fontWeight: 700,
    color: "#1a2420",
    marginBottom: "8px",
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
  };
  const sub: React.CSSProperties = {
    fontSize: "0.9rem",
    color: "#6b8c85",
    marginBottom: "28px",
    lineHeight: 1.6,
  };

  if (step === 0) {
    return (
      <div>
        <h2 style={heading}>What are your goals?</h2>
        <p style={sub}>Select all that apply — your plan will balance all of them.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {GOALS.map((g) => (
            <Chip
              key={g}
              label={g}
              selected={data.goals.includes(g)}
              onClick={() => setData((d) => ({ ...d, goals: toggle(d.goals, g) }))}
            />
          ))}
        </div>
        {data.goals.length === 0 && (
          <p style={{ marginTop: "16px", fontSize: "0.8rem", color: "#c0a090" }}>
            Select at least one goal to continue.
          </p>
        )}
      </div>
    );
  }

  if (step === 1) {
    return (
      <div>
        <h2 style={heading}>Tell us about yourself</h2>
        <p style={sub}>Your AI coach needs this to personalize your plan accurately.</p>
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "14px" }}>
          <InputField
            label="Age"
            type="number"
            value={data.age}
            onChange={(v) => setData((d) => ({ ...d, age: v }))}
            placeholder="28"
            unit="years"
          />
          <InputField
            label={`Weight (${data.weightUnit})`}
            type="number"
            value={data.weight}
            onChange={(v) => setData((d) => ({ ...d, weight: v }))}
            placeholder={data.weightUnit === "kg" ? "72" : "158"}
            unit={data.weightUnit}
            onUnitToggle={() =>
              setData((d) => ({
                ...d,
                weightUnit: d.weightUnit === "kg" ? "lbs" : "kg",
                weight: "",
              }))
            }
            unitOptions={["kg", "lbs"]}
          />
          <InputField
            label={`Height (${data.heightUnit})`}
            type="number"
            value={data.height}
            onChange={(v) => setData((d) => ({ ...d, height: v }))}
            placeholder={data.heightUnit === "cm" ? "175" : "5.9"}
            unit={data.heightUnit}
            onUnitToggle={() =>
              setData((d) => ({
                ...d,
                heightUnit: d.heightUnit === "cm" ? "ft" : "cm",
                height: "",
              }))
            }
            unitOptions={["cm", "ft"]}
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#4a6560",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Sex
          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            {["male", "female", "other"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setData((d) => ({ ...d, sex: s }))}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: "10px",
                  border: `1.5px solid ${data.sex === s ? "#2a9d8f" : "rgba(127,173,139,0.28)"}`,
                  background: data.sex === s ? "rgba(42,157,143,0.12)" : "rgba(255,255,255,0.5)",
                  color: data.sex === s ? "#1e7a6e" : "#6b8c85",
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: data.sex === s ? 600 : 400,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textTransform: "capitalize",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <h2 style={heading}>How active are you?</h2>
        <p style={sub}>Be honest — your fitness plan works best when calibrated to your real starting point.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {ACTIVITY_LEVELS.map((a) => {
            const sel = data.activity_level === a.key;
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => setData((d) => ({ ...d, activity_level: a.key }))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "18px 20px",
                  borderRadius: "14px",
                  border: `1.5px solid ${sel ? "#1e7a6e" : "rgba(127,173,139,0.25)"}`,
                  background: sel
                    ? "linear-gradient(135deg, rgba(30,122,110,0.1), rgba(42,157,143,0.06))"
                    : "rgba(255,255,255,0.48)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.22s ease",
                  transform: sel ? "scale(1.01)" : "scale(1)",
                  boxShadow: sel ? "0 4px 20px rgba(30,122,110,0.14)" : "none",
                }}
              >
                <span style={{ fontSize: "1.8rem", flexShrink: 0 }}>{a.icon}</span>
                <div>
                  <div
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 600,
                      color: sel ? "#1e7a6e" : "#1a2420",
                      fontSize: "0.95rem",
                      marginBottom: "2px",
                    }}
                  >
                    {a.label}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#7fad8b" }}>{a.desc}</div>
                </div>
                <div
                  style={{
                    marginLeft: "auto",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: `2px solid ${sel ? "#1e7a6e" : "rgba(127,173,139,0.35)"}`,
                    background: sel ? "#1e7a6e" : "transparent",
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {sel && <span style={{ color: "white", fontSize: "0.65rem" }}>✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div>
        <h2 style={heading}>Any dietary restrictions?</h2>
        <p style={sub}>Optional — skip if none apply. Your nutrition plan will respect these.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {DIETARY.map((d) => (
            <Chip
              key={d}
              label={d}
              selected={data.dietary_restrictions.includes(d)}
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  dietary_restrictions: toggle(prev.dietary_restrictions, d),
                }))
              }
              color="#e8856a"
            />
          ))}
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div>
        <h2 style={heading}>Equipment & time</h2>
        <p style={sub}>What do you have to work with? Your fitness plan will be designed around this.</p>
        <div style={{ marginBottom: "28px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#4a6560",
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Equipment available
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {EQUIPMENT.map((eq) => (
              <Chip
                key={eq}
                label={eq}
                selected={data.equipment_available.includes(eq)}
                onClick={() =>
                  setData((prev) => ({
                    ...prev,
                    equipment_available: toggle(prev.equipment_available, eq),
                  }))
                }
                color="#7fad8b"
              />
            ))}
          </div>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#4a6560",
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Daily workout time: {data.time_availability_minutes} minutes
          </label>
          <input
            type="range"
            min={15}
            max={120}
            step={5}
            value={data.time_availability_minutes}
            onChange={(e) =>
              setData((d) => ({ ...d, time_availability_minutes: parseInt(e.target.value) }))
            }
            style={{
              width: "100%",
              accentColor: "#1e7a6e",
              height: "6px",
              cursor: "pointer",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.75rem",
              color: "#7fad8b",
              marginTop: "6px",
            }}
          >
            <span>15 min</span>
            <span>120 min</span>
          </div>
          <div
            style={{
              marginTop: "12px",
              padding: "10px 16px",
              borderRadius: "10px",
              background: "rgba(42,157,143,0.08)",
              border: "1px solid rgba(42,157,143,0.2)",
              fontSize: "0.85rem",
              color: "#2a9d8f",
              fontWeight: 500,
            }}
          >
            {data.time_availability_minutes <= 30
              ? "⚡ Perfect for quick, high-efficiency sessions"
              : data.time_availability_minutes <= 60
              ? "🏃 Great balance of volume and recovery"
              : "💪 Plenty of time for comprehensive training"}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
