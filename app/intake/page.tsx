"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/animated-background";
import { ErrorBanner, FieldLabel, LoadingDots, PrimaryButton } from "@/components/ui";
import { api, friendlyPlanError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { LOAD_OPTIONS, showsLoadPicker } from "@/lib/equipment";
import { UserBadge } from "@/components/user-badge";
import {
  saveEquipmentAvailable,
  saveEquipmentLoads,
  saveProfileId,
  useSession,
  type EquipmentLoads,
} from "@/lib/storage";

const GOALS = [
  { label: "lose weight", icon: "target" },
  { label: "build strength", icon: "dumbbell" },
  { label: "improve energy", icon: "bolt" },
  { label: "better sleep", icon: "moon" },
  { label: "reduce stress", icon: "lotus" },
  { label: "improve flexibility", icon: "stretch" },
  { label: "run a 5K", icon: "run" },
  { label: "eat healthier", icon: "apple" },
] as const;

const DIETARY = [
  { label: "Vegetarian", value: "vegetarian", hint: "no meat or fish; dairy and eggs still allowed" },
  { label: "Vegan", value: "vegan", hint: "no animal products at all, no meat, fish, dairy, eggs, or honey" },
  { label: "No dairy", value: "dairy-free", hint: "dairy allergy or intolerance, no milk, yogurt, cheese, or butter" },
  { label: "Gluten free", value: "gluten-free", hint: "no wheat, barley, or rye" },
  { label: "Halal", value: "halal", hint: "no pork or alcohol based ingredients" },
  { label: "Allergy", value: "allergy", hint: "specify nuts, seafood, etc." },
  { label: "Keto", value: "keto", hint: "very low carb, high fat, no bread, rice, or sugar" },
  { label: "Paleo", value: "paleo", hint: "no grains, dairy, or processed food, meat, veggies, fruits, and nuts only" },
];

const EQUIPMENT = [
  { label: "No equipment", value: "none" },
  { label: "Dumbbells", value: "dumbbells" },
  { label: "Barbell & plates", value: "barbell" },
  { label: "Pull up bar", value: "pull-up bar" },
  { label: "Resistance bands", value: "resistance bands" },
  { label: "Kettlebells", value: "kettlebells" },
  { label: "Full gym", value: "full gym" },
  { label: "Cardio machines", value: "cardio machines" },
];

const ACTIVITY_LEVELS = [
  { key: "sedentary", icon: "🪑", label: "Sedentary", desc: "Mostly desk work, little exercise" },
  { key: "walk only", icon: "👟", label: "Walk only", desc: "No workouts, just a 10 to 15 minute walk" },
  { key: "lightly active", icon: "🚶", label: "Lightly active", desc: "Light exercise 1 to 3 days a week" },
  { key: "active", icon: "🏃", label: "Active", desc: "Moderate exercise 3 to 5 days a week" },
  { key: "very active", icon: "⚡", label: "Very active", desc: "Intense exercise 6 to 7 days a week" },
];

const STEPS = ["Goals", "About you", "Activity", "Diet", "Schedule"];

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
  allergy_detail: string;
  equipment_available: string[];
  loads: EquipmentLoads;
  time_availability_minutes: number;
}

export default function IntakePage() {
  const router = useRouter();
  const session = useSession();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animKey, setAnimKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<IntakeData>({
    goals: [],
    age: "",
    weight: "",
    height: "",
    weightUnit: "kg",
    heightUnit: "ft",
    sex: "",
    activity_level: "",
    dietary_restrictions: [],
    allergy_detail: "",
    equipment_available: [],
    loads: { dumbbells: [], kettlebells: [], barbell: [] },
    time_availability_minutes: 45,
  });

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    ["/intake-about-bg.png", "/intake-about-female-bg.png"].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (session.ready && !session.userId) router.replace("/auth");
  }, [session.ready, session.userId, router]);

  const canContinue = [
    data.goals.length > 0,
    Boolean(data.age && data.weight && data.height && data.sex),
    Boolean(data.activity_level),
    true,
    true,
  ][step];

  function go(next: number, dir: "forward" | "back") {
    setDirection(dir);
    setAnimKey((k) => k + 1);
    setStep(next);
  }

  async function submit() {
    if (!session.userId) return router.replace("/auth");
    setLoading(true);
    setError("");

    const weightKg = data.weightUnit === "lbs" ? parseFloat(data.weight) * 0.453592 : parseFloat(data.weight);
    const heightCm = data.heightUnit === "ft" ? parseFloat(data.height) * 30.48 : parseFloat(data.height);
    const dietary = data.dietary_restrictions
      .filter((item) => item !== "allergy")
      .concat(
        data.dietary_restrictions.includes("allergy")
          ? [data.allergy_detail.trim() ? `allergy: ${data.allergy_detail.trim()}` : "allergy"]
          : [],
      );
    const equipment = data.equipment_available.filter((item) => item !== "none");
    if (data.loads.dumbbells.length) equipment.push(`dumbbell weights: ${data.loads.dumbbells.join(", ")}`);
    if (data.loads.kettlebells.length) equipment.push(`kettlebell weights: ${data.loads.kettlebells.join(", ")}`);
    if (data.loads.barbell.length) equipment.push(`barbell plates: ${data.loads.barbell.join(", ")}`);

    try {
      const profile = await api.createProfile({
        user_id: session.userId,
        intake: {
          goals: data.goals,
          age: parseInt(data.age, 10),
          weight_kg: Math.round(weightKg * 10) / 10,
          height_cm: Math.round(heightCm),
          sex: data.sex,
          activity_level: data.activity_level,
          dietary_restrictions: dietary,
          equipment_available: equipment,
          time_availability_minutes: data.time_availability_minutes,
        },
      });
      saveEquipmentAvailable(data.equipment_available);
      saveEquipmentLoads(data.loads);
      saveProfileId(profile.profile_id);
      router.push("/loading");
    } catch (err) {
      setError(friendlyPlanError(err));
    } finally {
      setLoading(false);
    }
  }

  const backdrop =
    step === 1
      ? data.sex === "female"
        ? "/intake-about-female-bg.png"
        : "/intake-about-bg.png"
      : "/intake-goals-bg.png";

  return (
    <PageShell scene="intake" image={backdrop}>
      <header className="fixed top-0 right-0 left-0 z-50 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1100px] items-center gap-3 sm:gap-5">
          <Link href="/home" className="fx-logo hidden shrink-0 items-center gap-2 text-teal-light md:flex">
            <LotusMark />
            <span className="font-display text-[1.15rem] font-semibold tracking-[-0.02em]">Corevida</span>
          </Link>
          <span className="hidden text-[0.82rem] font-medium text-sage sm:inline">{STEPS[step]}</span>
          <div className="h-[2px] min-w-8 flex-1 overflow-hidden rounded-full bg-white/12">
            <div
              className="fx-bar-sheen h-full shadow-[0_0_10px_rgba(77,184,170,0.7)] transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-[0.78rem] text-sage">
            {step + 1} of {STEPS.length}
          </span>
          <UserBadge />
        </div>
      </header>

      <SceneDecor step={step} />

      <div className="flex min-h-dvh items-center justify-center px-4 pt-24 pb-10">
        <div
          className="intake-card w-full max-w-[720px] rounded-[28px] px-5 py-7 sm:px-10 sm:py-10"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 0.55s ease, transform 0.55s ease",
          }}
        >
          <div className="overflow-hidden">
            <div
              key={animKey}
              className={direction === "forward" ? "intake-step-forward" : "intake-step-back"}
            >
              <StepContent data={data} setData={setData} step={step} />
            </div>
          </div>

          {error && (
            <div className="mt-5">
              <ErrorBanner message={error} />
            </div>
          )}

          <div className="mt-9 flex items-center justify-between gap-3">
            <button
              onClick={() => go(step - 1, "back")}
              disabled={step === 0}
              className="rounded-full border border-white/14 bg-white/4 px-6 py-3 text-[0.9rem] font-medium text-forest transition-colors hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-35"
            >
              ← Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => canContinue && go(step + 1, "forward")}
                disabled={!canContinue}
                className={cn(
                  "rounded-full px-8 py-3 text-[0.9rem] font-semibold transition-all",
                  canContinue
                    ? "bg-[#2a9d8f] text-white shadow-[0_8px_24px_rgba(42,157,143,0.35)] hover:-translate-y-0.5"
                    : "cursor-not-allowed bg-white/8 text-muted/50",
                )}
              >
                Continue →
              </button>
            ) : (
              <PrimaryButton onClick={submit} disabled={loading} className="rounded-full px-8">
                {loading ? (
                  <>
                    <LoadingDots /> Submitting…
                  </>
                ) : (
                  "✨ Generate my plan"
                )}
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function SceneDecor({ step }: { step: number }) {
  if (step === 1) {
    return (
      <>
        <div className="pointer-events-none absolute top-[22%] left-6 hidden flex-col gap-8 lg:flex">
          <p className="intake-quote quote-live text-[1.35rem]">
            Healthier
            <br />
            you
            <br />
            stronger
            <br />
            tomorrow
          </p>
          <Rail
            items={[
              { icon: "dumbbell", label: "Personalized workout plans" },
              { icon: "apple", label: "Nutrition guidance" },
              { icon: "lotus", label: "Wellness & mindset" },
            ]}
          />
        </div>
        <div className="pointer-events-none absolute top-[18%] right-8 hidden text-right lg:block">
          <p className="intake-quote quote-live text-[1.45rem]">
            Small steps
            <br />
            big results
          </p>
          <div className="mt-16 ml-auto flex items-center justify-end gap-2 text-[0.68rem] tracking-[0.16em] text-sage/70 uppercase">
            <LineIcon name="bars" />
            Track your progress
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="pointer-events-none absolute top-[28%] left-6 hidden lg:block">
        <Rail
          items={[
            { icon: "dumbbell", label: "Train harder" },
            { icon: "heart", label: "Live healthier" },
            { icon: "apple", label: "Feel stronger" },
          ]}
        />
      </div>
      <p className="intake-quote quote-live pointer-events-none absolute top-[22%] right-10 hidden rotate-[-6deg] text-[2.4rem] lg:block">
        Never
        <br />
        give up
      </p>
    </>
  );
}

function Rail({ items }: { items: { icon: IconName; label: string }[] }) {
  return (
    <div className="flex flex-col gap-5">
      {items.map((item, i) => (
        <div
          key={item.label}
          className="rail-in flex items-center gap-2.5 text-sage/75"
          style={{ animationDelay: `${0.12 * i}s` }}
        >
          <LineIcon name={item.icon} />
          <span className="max-w-[140px] text-[0.68rem] leading-tight tracking-[0.12em] uppercase">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function toggleEquipment(prev: IntakeData, value: string): IntakeData {
  if (value === "none") {
    const on = !prev.equipment_available.includes("none");
    return {
      ...prev,
      equipment_available: on ? ["none"] : [],
      loads: on ? { dumbbells: [], kettlebells: [], barbell: [] } : prev.loads,
    };
  }
  const next = prev.equipment_available.includes(value)
    ? prev.equipment_available.filter((item) => item !== value && item !== "none")
    : [...prev.equipment_available.filter((item) => item !== "none"), value];
  return {
    ...prev,
    equipment_available: next,
    loads: {
      dumbbells: showsLoadPicker(next, "dumbbells") ? prev.loads.dumbbells : [],
      kettlebells: showsLoadPicker(next, "kettlebells") ? prev.loads.kettlebells : [],
      barbell: showsLoadPicker(next, "barbell") ? prev.loads.barbell : [],
    },
  };
}

function LoadPickers({
  data,
  setData,
}: {
  data: IntakeData;
  setData: React.Dispatch<React.SetStateAction<IntakeData>>;
}) {
  const groups: { key: keyof EquipmentLoads; label: string }[] = [
    { key: "dumbbells", label: "Dumbbell weights you have" },
    { key: "kettlebells", label: "Kettlebell weights you have" },
    { key: "barbell", label: "Barbell plates you have" },
  ];
  const visible = groups.filter((group) => showsLoadPicker(data.equipment_available, group.key));
  if (!visible.length) return null;

  function toggleLoad(kind: keyof EquipmentLoads, kg: string) {
    setData((prev) => ({
      ...prev,
      loads: {
        ...prev.loads,
        [kind]: prev.loads[kind].includes(kg)
          ? prev.loads[kind].filter((item) => item !== kg)
          : [...prev.loads[kind], kg],
      },
    }));
  }

  return (
    <div className="mb-7 space-y-4">
      {visible.map((group) => (
        <div key={group.key}>
          <FieldLabel>{group.label}</FieldLabel>
          <p className="mb-2.5 text-[0.78rem] text-sage">Select every weight you can actually use.</p>
          <div className="flex flex-wrap gap-2">
            {LOAD_OPTIONS[group.key].map((kg) => (
              <Chip
                key={kg}
                compact
                label={kg}
                selected={data.loads[group.key].includes(kg)}
                onClick={() => toggleLoad(group.key, kg)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Chip({
  label,
  hint,
  selected,
  onClick,
  icon,
  compact,
  disabled,
  delay = 0,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onClick: () => void;
  icon?: IconName;
  compact?: boolean;
  disabled?: boolean;
  delay?: number;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "intake-chip chip-in",
        selected && "intake-chip-on",
        compact && "intake-chip-sm",
        hint && "intake-chip-hint",
        disabled && "pointer-events-none cursor-not-allowed opacity-35",
      )}
      style={{ animationDelay: `${0.18 + delay * 0.06}s` }}
    >
      {icon ? <LineIcon name={icon} /> : selected ? <span>✓</span> : null}
      <span className="min-w-0 text-left">
        <span className={cn("block", compact ? "" : "capitalize")}>{label}</span>
        {hint ? <span className="mt-0.5 block text-[0.72rem] font-normal normal-case leading-snug text-sage">{hint}</span> : null}
      </span>
    </button>
  );
}

function StepContent({
  step,
  data,
  setData,
}: {
  step: number;
  data: IntakeData;
  setData: React.Dispatch<React.SetStateAction<IntakeData>>;
}) {
  const heading = "fx-reveal-right mb-2 text-center font-display text-[clamp(1.7rem,3vw,2.15rem)] leading-tight font-semibold tracking-[-0.03em] text-forest";
  const sub = "fx-fade-in mb-8 text-center text-[0.92rem] leading-relaxed text-muted";

  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  if (step === 0) {
    return (
      <div>
        <h2 className={heading}>What are your goals?</h2>
        <p className={sub}>Select all that apply. Your plan will balance all of them.</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {GOALS.map((goal, i) => (
            <Chip
              key={goal.label}
              icon={goal.icon}
              label={goal.label}
              delay={i}
              selected={data.goals.includes(goal.label)}
              onClick={() => setData((prev) => ({ ...prev, goals: toggle(prev.goals, goal.label) }))}
            />
          ))}
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div>
        <h2 className={heading}>Tell us about yourself</h2>
        <p className={sub}>Your AI coach needs this to personalize your plan accurately.</p>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumberField label="Age" value={data.age} onChange={(age) => setData((d) => ({ ...d, age }))} unit="years" placeholder="28" />
          <NumberField
            label="Weight"
            value={data.weight}
            onChange={(weight) => setData((d) => ({ ...d, weight }))}
            unit={data.weightUnit}
            placeholder={data.weightUnit === "kg" ? "72" : "158"}
            onUnitToggle={() => setData((d) => ({ ...d, weightUnit: d.weightUnit === "kg" ? "lbs" : "kg", weight: "" }))}
          />
          <NumberField
            label="Height"
            value={data.height}
            onChange={(height) => setData((d) => ({ ...d, height }))}
            unit={data.heightUnit === "ft" ? "ft" : "cm"}
            placeholder={data.heightUnit === "ft" ? "5.7" : "175"}
            onUnitToggle={() => setData((d) => ({ ...d, heightUnit: d.heightUnit === "cm" ? "ft" : "cm", height: "" }))}
          />
        </div>
        <FieldLabel>Gender</FieldLabel>
        <div className="grid grid-cols-3 gap-2.5">
          {["male", "female", "other"].map((sex) => (
            <button
              key={sex}
              type="button"
              onClick={() => setData((d) => ({ ...d, sex }))}
              className={cn(
                "rounded-full border py-3 text-[0.88rem] capitalize transition-all",
                data.sex === sex
                  ? "border-[#4db8aa] bg-[#2a9d8f]/15 font-semibold text-teal-light"
                  : "border-white/10 bg-[#0d1a16]/70 text-muted",
              )}
            >
              {sex}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <h2 className={heading}>How active are you?</h2>
        <p className={sub}>Be honest. Your fitness plan works best when calibrated to your real starting point.</p>
        <div className="flex flex-col gap-3">
          {ACTIVITY_LEVELS.map((level, i) => {
            const selected = data.activity_level === level.key;
            return (
              <button
                key={level.key}
                type="button"
                onClick={() => setData((d) => ({ ...d, activity_level: level.key }))}
                className={cn(
                  "chip-in flex items-center gap-4 rounded-[14px] border-[1.5px] px-5 py-4 text-left transition-all",
                  selected
                    ? "scale-[1.01] border-teal bg-[linear-gradient(135deg,rgba(30,122,110,0.1),rgba(42,157,143,0.06))] shadow-[0_4px_20px_rgba(30,122,110,0.14)]"
                    : "border-white/10 bg-white/4",
                )}
                style={{ animationDelay: `${0.2 + i * 0.07}s` }}
              >
                <span className="text-[1.8rem]">{level.icon}</span>
                <div>
                  <div className={cn("mb-0.5 text-[0.95rem] font-semibold", selected ? "text-teal-light" : "text-forest")}>
                    {level.label}
                  </div>
                  <div className="text-[0.8rem] text-sage">{level.desc}</div>
                </div>
                <div
                  className={cn(
                    "ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    selected ? "border-teal bg-teal text-[0.65rem] text-white" : "border-sage/35",
                  )}
                >
                  {selected && "✓"}
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
        <h2 className="fx-flutter-in mb-2 text-center font-display text-[clamp(1.7rem,3vw,2.15rem)] leading-tight font-semibold tracking-[-0.03em] text-forest">
          Any dietary restrictions?
        </h2>
        <p className="fx-fade-in mb-8 text-center text-[0.92rem] leading-relaxed text-muted">
          Optional. Skip if none apply. Your nutrition plan will respect these.
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {DIETARY.map((item, i) => (
            <Chip
              key={item.value}
              label={item.label}
              hint={item.hint || undefined}
              delay={i}
              selected={data.dietary_restrictions.includes(item.value)}
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  dietary_restrictions: toggle(prev.dietary_restrictions, item.value),
                }))
              }
            />
          ))}
        </div>
        {data.dietary_restrictions.includes("allergy") && (
          <div className="mt-4">
            <FieldLabel>Allergy details</FieldLabel>
            <input
              value={data.allergy_detail}
              onChange={(e) => setData((prev) => ({ ...prev, allergy_detail: e.target.value }))}
              placeholder="Nuts, seafood, shellfish..."
              className="intake-field"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className={heading}>Equipment & time</h2>
      <p className={sub}>What do you have to work with? Your fitness plan will be designed around this.</p>
      <FieldLabel>Equipment available</FieldLabel>
      <div className="mb-5 flex flex-wrap gap-2.5">
        {EQUIPMENT.map((item, i) => {
          const noneOn = data.equipment_available.includes("none");
          return (
            <Chip
              key={item.value}
              label={item.label}
              delay={i}
              selected={data.equipment_available.includes(item.value)}
              disabled={item.value !== "none" && noneOn}
              onClick={() => setData((prev) => toggleEquipment(prev, item.value))}
            />
          );
        })}
      </div>
      {data.equipment_available.includes("none") && (
        <p className="mb-5 text-[0.8rem] text-sage">
          No equipment is selected. Other gear stays locked, and workouts stay bodyweight only.
        </p>
      )}
      <LoadPickers data={data} setData={setData} />
      <FieldLabel>Daily workout time: {data.time_availability_minutes} minutes</FieldLabel>
      <input
        type="range"
        min={15}
        max={120}
        step={5}
        value={data.time_availability_minutes}
        onChange={(e) => setData((d) => ({ ...d, time_availability_minutes: parseInt(e.target.value, 10) }))}
        className="w-full"
      />
      <div className="mt-1.5 flex justify-between text-xs text-sage">
        <span>15 min</span>
        <span>120 min</span>
      </div>
      <div className="mt-3 rounded-[10px] border border-teal-mid/20 bg-teal-mid/8 px-4 py-2.5 text-[0.85rem] font-medium text-teal-mid">
        {data.time_availability_minutes <= 30
          ? "⚡ Perfect for quick, high-efficiency sessions"
          : data.time_availability_minutes <= 60
            ? "🏃 Great balance of volume and recovery"
            : "💪 Plenty of time for comprehensive training"}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  unit,
  onUnitToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  unit: string;
  onUnitToggle?: () => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-center text-[0.72rem] font-semibold tracking-[0.14em] text-sage uppercase">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="intake-field pr-16 text-center"
        />
        <button
          type="button"
          onClick={onUnitToggle}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-[0.78rem] text-sage"
        >
          {unit}
        </button>
      </div>
    </div>
  );
}

function LotusMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20c-4-4-7-7-7-11 0-3 2-5 5-5 1.2 0 2.2.5 3 1.4C13.8 4.5 14.8 4 16 4c3 0 5 2 5 5 0 4-3 7-9 11Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type IconName = "target" | "dumbbell" | "bolt" | "moon" | "lotus" | "stretch" | "run" | "apple" | "heart" | "bars";

function LineIcon({ name }: { name: IconName }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true as const };
  if (name === "dumbbell") {
    return (
      <svg {...common}>
        <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "bolt") {
    return (
      <svg {...common}>
        <path d="M13 3 6 14h6l-1 7 7-11h-6l1-7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "moon") {
    return (
      <svg {...common}>
        <path d="M16 13.5A6.5 6.5 0 1 1 10.5 5 5.2 5.2 0 0 0 16 13.5Z" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (name === "lotus") {
    return (
      <svg {...common}>
        <path d="M12 20c-4-4-7-7-7-11 0-3 2-5 5-5 1.2 0 2.2.5 3 1.4C13.8 4.5 14.8 4 16 4c3 0 5 2 5 5 0 4-3 7-9 11Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "apple") {
    return (
      <svg {...common}>
        <path d="M12 7c2-3 5-3 5-3s-1 3-3 4M8 10c-2 4 0 10 4 10s6-6 4-10c-1-2-3-3-4-3s-3 1-4 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "heart") {
    return (
      <svg {...common}>
        <path d="M12 19s-7-4.4-7-9.2C5 7 7 5.4 9.2 5.4c1.3 0 2.4.7 2.8 1.7.4-1 1.5-1.7 2.8-1.7C17 5.4 19 7 19 9.8 19 14.6 12 19 12 19Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "run") {
    return (
      <svg {...common}>
        <circle cx="14" cy="5" r="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 21l2.2-5 3 2 2-4 3 1M7 12l3 1 2-3 3 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "stretch") {
    return (
      <svg {...common}>
        <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 21l3-8 2 3 5-7M6 12h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "bars") {
    return (
      <svg {...common}>
        <path d="M6 16v4M12 10v10M18 4v16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
    </svg>
  );
}
