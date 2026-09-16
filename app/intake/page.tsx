"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppIcon, type AppIconName } from "@/components/app-icon";
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
  { label: "lose weight", icon: "target" as const },
  { label: "build strength", icon: "dumbbell" as const },
  { label: "improve energy", icon: "bolt" as const },
  { label: "better sleep", icon: "moon" as const },
  { label: "reduce stress", icon: "lotus" as const },
  { label: "improve flexibility", icon: "stretch" as const },
  { label: "run a 5K", icon: "run" as const },
  { label: "eat healthier", icon: "apple" as const },
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

const ACTIVITY_LEVELS: { key: string; icon: AppIconName; label: string; desc: string }[] = [
  { key: "sedentary", icon: "armchair", label: "Sedentary", desc: "Mostly desk work, little exercise" },
  { key: "walk only", icon: "sneakers", label: "Walk only", desc: "No workouts, just a 10 to 15 minute walk" },
  { key: "lightly active", icon: "walk", label: "Lightly active", desc: "Light exercise 1 to 3 days a week" },
  { key: "active", icon: "run", label: "Active", desc: "Moderate exercise 3 to 5 days a week" },
  { key: "very active", icon: "zap", label: "Very active", desc: "Intense exercise 6 to 7 days a week" },
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
      <header className="fixed top-0 right-0 left-0 z-50 px-3 py-3 sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-[1100px] items-center gap-2 sm:gap-5">
          <Link href="/home" className="fx-logo hidden shrink-0 items-center gap-2 text-teal-light md:flex">
            <AppIcon name="lotus" size={18} />
            <span className="type-logo text-[1.25rem]">Corevida</span>
          </Link>
          <span className="type-caption hidden font-medium text-sage sm:inline">{STEPS[step]}</span>
          <div className="h-[2px] min-w-6 flex-1 overflow-hidden rounded-full bg-white/12">
            <div
              className="fx-bar-sheen h-full shadow-[0_0_10px_rgba(77,184,170,0.7)] transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <span className="type-caption shrink-0 text-sage">
            {step + 1} of {STEPS.length}
          </span>
          <UserBadge />
        </div>
      </header>

      <SceneDecor step={step} />

      <div className="flex min-h-dvh items-center justify-center px-3 pt-20 pb-8 sm:px-4 sm:pt-24 sm:pb-10">
        <div
          className="intake-card w-full max-w-[720px] rounded-[22px] px-4 py-6 sm:rounded-[28px] sm:px-10 sm:py-10"
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

          <div className="mt-8 flex items-center justify-between gap-2 sm:mt-9 sm:gap-3">
            <button
              onClick={() => go(step - 1, "back")}
              disabled={step === 0}
              className="type-button inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/14 bg-white/4 px-4 py-3 text-forest transition-colors hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-35 sm:px-6"
            >
              <AppIcon name="arrowLeft" size={16} />
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => canContinue && go(step + 1, "forward")}
                disabled={!canContinue}
                className={cn(
                  "type-button inline-flex min-h-11 items-center gap-1.5 rounded-full px-5 py-3 transition-all sm:px-8",
                  canContinue
                    ? "bg-[#2a9d8f] text-white shadow-[0_8px_24px_rgba(42,157,143,0.35)] hover:-translate-y-0.5"
                    : "cursor-not-allowed bg-white/8 text-muted/50",
                )}
              >
                Continue
                <AppIcon name="arrowRight" size={16} />
              </button>
            ) : (
              <PrimaryButton onClick={submit} disabled={loading} className="min-h-11 rounded-full px-5 sm:px-8">
                {loading ? (
                  <>
                    <LoadingDots /> Submitting…
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <AppIcon name="sparkles" size={16} />
                    Generate my plan
                  </span>
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
          <div className="type-kicker mt-16 ml-auto flex items-center justify-end gap-2 text-sage/70">
            <AppIcon name="bars" size={14} />
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

function Rail({ items }: { items: { icon: AppIconName; label: string }[] }) {
  return (
    <div className="flex flex-col gap-5">
      {items.map((item, i) => (
        <div
          key={item.label}
          className="rail-in flex items-center gap-2.5 text-sage/75"
          style={{ animationDelay: `${0.12 * i}s` }}
        >
          <AppIcon name={item.icon} size={16} />
          <span className="type-kicker max-w-[140px] leading-tight">{item.label}</span>
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
          <p className="type-caption mb-2.5 text-sage">Select every weight you can actually use.</p>
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
  icon?: AppIconName;
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
        "intake-chip chip-in min-h-11",
        selected && "intake-chip-on",
        compact && "intake-chip-sm",
        hint && "intake-chip-hint",
        disabled && "pointer-events-none cursor-not-allowed opacity-35",
      )}
      style={{ animationDelay: `${0.18 + delay * 0.06}s` }}
    >
      {icon ? (
        <AppIcon name={icon} size={16} className="text-teal-light" />
      ) : selected ? (
        <AppIcon name="habits" size={14} className="text-teal-light" />
      ) : null}
      <span className="min-w-0 text-left">
        <span className={cn("type-button block", compact ? "text-[0.86rem]" : "capitalize")}>{label}</span>
        {hint ? <span className="type-caption mt-0.5 block font-normal normal-case leading-snug text-sage">{hint}</span> : null}
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
  const heading = "type-h2 fx-reveal-right mb-2 text-center text-forest";
  const sub = "type-body fx-fade-in mb-8 text-center text-muted";

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
                "type-button rounded-full border py-3 text-[0.9rem] capitalize transition-all",
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
                  "chip-in flex min-h-[72px] items-center gap-3 rounded-[14px] border-[1.5px] px-4 py-4 text-left transition-all sm:gap-4 sm:px-5",
                  selected
                    ? "scale-[1.01] border-teal bg-[linear-gradient(135deg,rgba(30,122,110,0.1),rgba(42,157,143,0.06))] shadow-[0_4px_20px_rgba(30,122,110,0.14)]"
                    : "border-white/10 bg-white/4",
                )}
                style={{ animationDelay: `${0.2 + i * 0.07}s` }}
              >
                <span className={cn("shrink-0", selected ? "text-teal-light" : "text-sage")}>
                  <AppIcon name={level.icon} size={26} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className={cn("type-title mb-0.5", selected ? "text-teal-light" : "text-forest")}>
                    {level.label}
                  </div>
                  <div className="type-caption text-sage">{level.desc}</div>
                </div>
                <div
                  className={cn(
                    "ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    selected ? "border-teal bg-teal text-white" : "border-sage/35",
                  )}
                >
                  {selected && <AppIcon name="habits" size={12} />}
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
        <h2 className="type-h2 fx-flutter-in mb-2 text-center text-forest">
          Any dietary restrictions?
        </h2>
        <p className="type-body fx-fade-in mb-8 text-center text-muted">
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
        <p className="type-caption mb-5 text-sage">
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
      <div className="type-meta mt-1.5 flex justify-between text-sage">
        <span>15 min</span>
        <span>120 min</span>
      </div>
      <div className="type-caption mt-3 flex items-start gap-2 rounded-[10px] border border-teal-mid/20 bg-teal-mid/8 px-4 py-2.5 text-teal-mid">
        {data.time_availability_minutes <= 30 ? (
          <>
            <AppIcon name="zap" size={16} className="mt-0.5 shrink-0" />
            Perfect for quick, high efficiency sessions
          </>
        ) : data.time_availability_minutes <= 60 ? (
          <>
            <AppIcon name="run" size={16} className="mt-0.5 shrink-0" />
            Great balance of volume and recovery
          </>
        ) : (
          <>
            <AppIcon name="fitness" size={16} className="mt-0.5 shrink-0" />
            Plenty of time for comprehensive training
          </>
        )}
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
      <label className="type-label mb-2 block text-center text-sage">
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
          className="type-caption absolute top-1/2 right-3 -translate-y-1/2 text-sage"
        >
          {unit}
        </button>
      </div>
    </div>
  );
}
