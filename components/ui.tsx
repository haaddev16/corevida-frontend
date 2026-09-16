"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { AppIcon } from "@/components/app-icon";
import { cn } from "@/lib/cn";
import { displayText } from "@/lib/text";

export function GlassCard({
  children,
  className,
  hover = false,
  onClick,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      style={style}
      className={cn(
        "glass rounded-[20px] text-left",
        hover && "glass-hover hover:shadow-[0_18px_50px_rgba(42,157,143,0.22)]",
        onClick && "w-full cursor-pointer",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function PrimaryButton({
  children,
  className,
  large = false,
  type = "button",
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  large?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "type-button relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-full text-white transition-all duration-200",
        "bg-[linear-gradient(135deg,#1e7a6e_0%,#2a9d8f_100%)]",
        "shadow-[0_6px_28px_rgba(30,122,110,0.32)]",
        "before:pointer-events-none before:absolute before:inset-0 before:translate-x-[-140%] before:skew-x-[-18deg] before:bg-[linear-gradient(115deg,transparent,rgba(255,255,255,0.22),transparent)] hover:before:animate-[card-shine_0.8s_ease]",
        "hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_10px_40px_rgba(30,122,110,0.44)]",
        "active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:scale-100",
        large ? "min-h-12 px-8 py-3.5 text-[1.05rem] sm:px-12 sm:py-4 sm:text-[1.08rem]" : "px-6 py-3 text-[0.98rem] sm:px-7",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className,
  onClick,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "type-button inline-flex min-h-12 items-center justify-center rounded-full border-[1.5px] border-teal-light/35 bg-white/6 px-6 py-3.5 text-[1.02rem] text-teal-light backdrop-blur-sm transition-all duration-200 sm:px-10 sm:py-4 sm:text-[1.05rem]",
        "hover:border-teal-light/60 hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="type-label mb-1.5 block text-ink">
      {children}
    </label>
  );
}

export function TextInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && visible ? "text" : type;

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            "type-input w-full rounded-xl bg-white/6 px-4 py-3.5 text-forest outline-none transition-all duration-200",
            isPassword && "pr-12",
            focused
              ? "border-[1.5px] border-teal-mid shadow-[0_0_0_3px_rgba(42,157,143,0.16)]"
              : "border-[1.5px] border-white/12",
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-sage transition-colors hover:text-teal-light"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            <AppIcon name={visible ? "eyeOff" : "eye"} size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

export function CountUp({
  target,
  prefix = "",
  suffix = "",
  duration = 1600,
  start = true,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  start?: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) {
      setValue(0);
      return;
    }
    setValue(0);
    const begin = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - begin) / duration);
      const eased = 1 - (1 - t) ** 2;
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, target, duration]);

  return (
    <span>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

export function ProgressRing({
  pct,
  size = 120,
  stroke = 9,
  color = "#2a9d8f",
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const [drawn, setDrawn] = useState(circ);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(offset), 80);
    return () => clearTimeout(t);
  }, [offset]);

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(127,173,139,0.18)"
        strokeWidth={stroke}
      />
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
        className="transition-[stroke-dashoffset] duration-[1400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      />
    </svg>
  );
}

export function LoadingDots({ className = "bg-white/80" }: { className?: string }) {
  return (
    <span className="inline-flex gap-1">
      {[0, 0.15, 0.3].map((delay) => (
        <span
          key={delay}
          className={cn("inline-block h-1.5 w-1.5 rounded-full", className)}
          style={{ animation: `dot-bounce 0.8s ease ${delay}s infinite` }}
        />
      ))}
    </span>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="type-caption animate-in rounded-[10px] border border-coral/40 bg-coral/15 px-3.5 py-2.5 text-coral-light">
      {displayText(message)}
    </div>
  );
}

export function CheckIcon() {
  return (
    <svg width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden>
      <path
        d="M1.5 5L5 8.5L11.5 1.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ animation: "check-draw 0.25s ease" }}
      />
    </svg>
  );
}
