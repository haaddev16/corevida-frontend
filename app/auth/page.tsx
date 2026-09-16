"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppIcon, type AppIconName } from "@/components/app-icon";
import { PageShell } from "@/components/animated-background";
import { Logo } from "@/components/site-nav";
import { ErrorBanner, LoadingDots, PrimaryButton } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { hydrateUserPlan } from "@/lib/plans";
import { clearPlanCache, saveSession, useSession } from "@/lib/storage";

type Tab = "signup" | "login";

function passwordStrength(pw: string) {
  if (!pw) return { level: 0, label: "", color: "#e0e0e0" };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  if (score <= 1) return { level: 1, label: "Weak", color: "#e8856a" };
  if (score === 2) return { level: 2, label: "Fair", color: "#f5c95e" };
  if (score === 3) return { level: 3, label: "Good", color: "#7fad8b" };
  return { level: 4, label: "Strong", color: "#a8e63d" };
}

export default function AuthPage() {
  const router = useRouter();
  const session = useSession();
  const [tab, setTab] = useState<Tab>("signup");
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    if (!session.ready || !session.userId) return;
    router.replace("/home");
  }, [session.ready, session.userId, session.planId, router]);

  const strength = passwordStrength(password);

  function shake(message: string) {
    setError(message);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  }

  async function afterAuth(user: { id: string; name?: string | null; email?: string }) {
    saveSession(user);
    clearPlanCache();
    try {
      await hydrateUserPlan(user.id);
    } catch {
      // Home will retry loading saved plans.
    }
    router.push("/home");
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name || !email || !password || !confirm) return shake("Please fill in all fields.");
    if (password !== confirm) return shake("Passwords don't match.");
    if (password.length < 6) return shake("Password must be at least 6 characters.");
    setLoading(true);
    try {
      const user = await api.signup({ name, email, password });
      await afterAuth(user);
    } catch (err) {
      shake(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!loginEmail || !loginPassword) return shake("Please fill in all fields.");
    setLoading(true);
    try {
      const user = await api.login({ email: loginEmail, password: loginPassword });
      await afterAuth(user);
    } catch (err) {
      shake(err instanceof Error ? err.message : "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function continueAsGuest() {
    setLoading(true);
    setError("");
    try {
      const stamp = Date.now();
      const user = await api.signup({
        name: "Guest",
        email: `guest-${stamp}@corevida.app`,
        password: `guest-${stamp}-corevida`,
      });
      await afterAuth({ ...user, name: "Guest" });
    } catch (err) {
      shake(err instanceof Error ? err.message : "Could not start a guest session.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell image="/loading-plan-bg.png" className="min-h-dvh">
      <AuthDecor />
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-10">
        <div className="page-fade mb-6 text-center">
          <Logo className="text-[1.9rem]" />
          <p className="type-caption fx-flutter-in mt-1 text-sage">Your AI wellness coach</p>
        </div>

        <div
          className={cn(
            "auth-card page-fade w-full max-w-[420px] rounded-[28px] px-6 py-8 sm:px-8",
            shaking && "animate-shake",
          )}
          style={{ animationDelay: "0.12s" }}
        >
          <div className="mb-7 flex rounded-full bg-white/6 p-1">
            {(["signup", "login"] as Tab[]).map((item) => (
              <button
                key={item}
                onClick={() => {
                  setTab(item);
                  setError("");
                }}
                className={cn(
                  "type-button min-h-11 flex-1 rounded-full py-2.5 text-[0.92rem] transition-all duration-200",
                  tab === item
                    ? "bg-[#2a9d8f] text-white shadow-[0_6px_20px_rgba(42,157,143,0.35)]"
                    : "text-muted hover:text-forest",
                )}
              >
                {item === "signup" ? "Sign up" : "Log in"}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5">
              <ErrorBanner message={error} />
            </div>
          )}

          {tab === "signup" ? (
            <form onSubmit={handleSignup} className="animate-tab flex flex-col gap-3.5">
              <AuthField
                label="Full name"
                icon="user"
                value={name}
                onChange={setName}
                placeholder="Alex Johnson"
                autoComplete="name"
                delay={0}
              />
              <AuthField
                label="Email"
                type="email"
                icon="mail"
                value={email}
                onChange={setEmail}
                placeholder="alex@example.com"
                autoComplete="email"
                delay={1}
              />
              <div>
                <AuthField
                  label="Password"
                  type="password"
                  icon="lock"
                  value={password}
                  onChange={setPassword}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  delay={2}
                />
                {password.length > 0 && (
                  <div className="mt-2 px-1">
                    <div className="mb-1 h-1 overflow-hidden rounded bg-white/10">
                      <div
                        className="h-full rounded transition-all duration-300"
                        style={{ width: `${(strength.level / 4) * 100}%`, background: strength.color }}
                      />
                    </div>
                    <span className="type-meta" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>
              <AuthField
                label="Confirm password"
                type="password"
                icon="lock"
                value={confirm}
                onChange={setConfirm}
                placeholder="Repeat your password"
                autoComplete="new-password"
                delay={3}
              />
              {confirm.length > 0 && confirm !== password && (
                <p className="type-caption text-coral">Passwords don&apos;t match.</p>
              )}
              <PrimaryButton type="submit" disabled={loading} className="mt-3 w-full rounded-full">
                {loading ? (
                  <>
                    <LoadingDots /> Creating account…
                  </>
                ) : (
                  <>
                    <AppIcon name="sparkles" size={16} />
                    Create account
                  </>
                )}
              </PrimaryButton>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="animate-tab flex flex-col gap-3.5">
              <AuthField
                label="Email"
                type="email"
                icon="mail"
                value={loginEmail}
                onChange={setLoginEmail}
                placeholder="alex@example.com"
                autoComplete="email"
                delay={0}
              />
              <AuthField
                label="Password"
                type="password"
                icon="lock"
                value={loginPassword}
                onChange={setLoginPassword}
                placeholder="Your password"
                autoComplete="current-password"
                delay={1}
              />
              <PrimaryButton type="submit" disabled={loading} className="mt-3 w-full rounded-full">
                {loading ? (
                  <>
                    <LoadingDots /> Signing in…
                  </>
                ) : (
                  "Log in"
                )}
              </PrimaryButton>
            </form>
          )}

          <div className="mt-5 text-center">
            <button
              onClick={continueAsGuest}
              disabled={loading}
              className="type-caption inline-flex min-h-11 items-center gap-1.5 text-sage underline decoration-sage/40 transition-colors hover:text-teal-light disabled:opacity-50"
            >
              Continue as guest
              <AppIcon name="arrowRight" size={14} />
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function AuthDecor() {
  return (
    <>
      <p className="intake-quote quote-live pointer-events-none absolute top-[16%] left-6 hidden max-w-[150px] text-[1.35rem] lg:block">
        Better
        <br />
        Health
        <br />
        Bigger
        <br />
        Goals
      </p>
      <div className="pointer-events-none absolute top-[42%] left-7 hidden flex-col gap-5 lg:flex">
        {(
          [
            { icon: "dumbbell" as const, label: "Personalized workouts" },
            { icon: "heart" as const, label: "Nutrition guidance" },
            { icon: "brain" as const, label: "AI powered coach" },
            { icon: "bars" as const, label: "Track progress" },
          ] as const
        ).map((item, i) => (
          <div key={item.label} className="rail-in flex items-center gap-2.5 text-sage/75" style={{ animationDelay: `${0.1 * i}s` }}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/4 text-teal-light">
              <AppIcon name={item.icon} size={16} />
            </span>
            <span className="type-kicker max-w-[130px] leading-tight text-sage/80">{item.label}</span>
          </div>
        ))}
      </div>
      <p className="intake-quote quote-live pointer-events-none absolute top-[18%] right-10 hidden max-w-[160px] text-right text-[1.45rem] lg:block">
        Discipline
        <br />
        Builds
        <br />
        Freedom
      </p>
      <div className="pointer-events-none absolute top-[42%] right-7 hidden flex-col items-end gap-5 lg:flex">
        {(
          [
            { icon: "run" as const, label: "Move better" },
            { icon: "apple" as const, label: "Eat healthier" },
            { icon: "brain" as const, label: "Think clearer" },
            { icon: "smile" as const, label: "Feel stronger" },
          ] as const
        ).map((item, i) => (
          <div key={item.label} className="rail-in flex items-center justify-end gap-2.5 text-sage/75" style={{ animationDelay: `${0.12 * i}s` }}>
            <span className="type-kicker max-w-[120px] text-right leading-tight text-sage/80">{item.label}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/4 text-teal-light">
              <AppIcon name={item.icon} size={16} />
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function AuthField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  icon,
  delay = 0,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  icon: AppIconName;
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && visible ? "text" : type;

  return (
    <div className="chip-in" style={{ animationDelay: `${0.22 + delay * 0.08}s` }}>
      <label className="type-label mb-1.5 block text-sage">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sage/70">
          <AppIcon name={icon} size={16} />
        </span>
        <input
          type={inputType}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "type-input w-full rounded-full border border-white/12 bg-[#0d1a16]/70 py-3.5 pr-4 pl-12 text-forest outline-none transition-all",
            "placeholder:text-sage/40 focus:border-[#4db8aa] focus:shadow-[0_0_0_3px_rgba(42,157,143,0.16)]",
            isPassword && "pr-12",
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-sage transition-colors hover:text-teal-light"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            <AppIcon name={visible ? "eyeOff" : "eye"} size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

