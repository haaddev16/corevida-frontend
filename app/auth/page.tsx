"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
  if (score === 3) return { level: 3, label: "Good", color: "#c4784a" };
  return { level: 4, label: "Strong", color: "#ffb020" };
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
          <p className="fx-flutter-in mt-1 text-[0.85rem] text-sage">Your AI wellness coach</p>
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
                  "flex-1 rounded-full py-2.5 text-[0.9rem] font-semibold transition-all duration-200",
                  tab === item
                    ? "bg-[#f97316] text-white shadow-[0_6px_20px_rgba(249,115,22,0.35)]"
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
                icon={<UserIcon />}
                value={name}
                onChange={setName}
                placeholder="Alex Johnson"
                autoComplete="name"
                delay={0}
              />
              <AuthField
                label="Email"
                type="email"
                icon={<MailIcon />}
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
                  icon={<LockIcon />}
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
                    <span className="text-xs font-medium" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>
              <AuthField
                label="Confirm password"
                type="password"
                icon={<LockIcon />}
                value={confirm}
                onChange={setConfirm}
                placeholder="Repeat your password"
                autoComplete="new-password"
                delay={3}
              />
              {confirm.length > 0 && confirm !== password && (
                <p className="text-xs text-coral">Passwords don&apos;t match.</p>
              )}
              <PrimaryButton type="submit" disabled={loading} className="mt-3 w-full rounded-full">
                {loading ? (
                  <>
                    <LoadingDots /> Creating account…
                  </>
                ) : (
                  "✦ Create account"
                )}
              </PrimaryButton>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="animate-tab flex flex-col gap-3.5">
              <AuthField
                label="Email"
                type="email"
                icon={<MailIcon />}
                value={loginEmail}
                onChange={setLoginEmail}
                placeholder="alex@example.com"
                autoComplete="email"
                delay={0}
              />
              <AuthField
                label="Password"
                type="password"
                icon={<LockIcon />}
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
              className="text-[0.85rem] text-sage underline decoration-sage/40 transition-colors hover:text-teal-light disabled:opacity-50"
            >
              Continue as guest →
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
        {[
          { icon: "dumbbell", label: "Personalized workouts" },
          { icon: "heart", label: "Nutrition guidance" },
          { icon: "brain", label: "AI powered coach" },
          { icon: "bars", label: "Track progress" },
        ].map((item, i) => (
          <div key={item.label} className="rail-in flex items-center gap-2.5 text-sage/75" style={{ animationDelay: `${0.1 * i}s` }}>
            <AuthMark name={item.icon} />
            <span className="max-w-[130px] text-[0.68rem] leading-tight tracking-[0.12em] uppercase">{item.label}</span>
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
        {[
          { icon: "run", label: "Move better" },
          { icon: "apple", label: "Eat healthier" },
          { icon: "brain", label: "Think clearer" },
          { icon: "smile", label: "Feel stronger" },
        ].map((item, i) => (
          <div key={item.label} className="rail-in flex items-center justify-end gap-2.5 text-sage/75" style={{ animationDelay: `${0.12 * i}s` }}>
            <span className="max-w-[120px] text-right text-[0.68rem] leading-tight tracking-[0.12em] uppercase">{item.label}</span>
            <AuthMark name={item.icon} />
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
  icon: ReactNode;
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && visible ? "text" : type;

  return (
    <div className="chip-in" style={{ animationDelay: `${0.22 + delay * 0.08}s` }}>
      <label className="mb-1.5 block text-[0.7rem] font-semibold tracking-[0.14em] text-sage uppercase">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sage/70">{icon}</span>
        <input
          type={inputType}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full rounded-full border border-white/12 bg-[#0a0a0a]/70 py-3.5 pr-4 pl-12 text-[0.92rem] text-forest outline-none transition-all",
            "placeholder:text-sage/40 focus:border-[#fb923c] focus:shadow-[0_0_0_3px_rgba(249,115,22,0.16)]",
            isPassword && "pr-12",
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-sage transition-colors hover:text-teal-light"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 19c1.4-3.2 3.8-4.8 7-4.8s5.6 1.6 7 4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 8l7 5 7-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="6" y="10" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 5l16 14M9.5 9.7A3.2 3.2 0 0 0 12 15.2M7 8C4.6 9.4 3 12 3 12s3.5 6.5 9.5 6.5c1.4 0 2.7-.3 3.8-.8M17 16c2.1-1.3 3.5-4 3.5-4s-3.5-6.5-9.5-6.5c-.7 0-1.4.1-2 .2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function AuthMark({ name }: { name: string }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true as const };
  if (name === "heart") {
    return (
      <svg {...common}>
        <path d="M12 19s-7-4.4-7-9.2C5 7 7 5.4 9.2 5.4c1.3 0 2.4.7 2.8 1.7.4-1 1.5-1.7 2.8-1.7C17 5.4 19 7 19 9.8 19 14.6 12 19 12 19Z" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (name === "brain") {
    return (
      <svg {...common}>
        <path d="M9 8a3 3 0 0 1 3-3 3 3 0 0 1 3 3v8a3 3 0 0 1-3 3 3 3 0 0 1-3-3V8Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 12H7a2 2 0 0 1 0-4h2M15 12h2a2 2 0 0 0 0-4h-2" stroke="currentColor" strokeWidth="1.6" />
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
  if (name === "run") {
    return (
      <svg {...common}>
        <circle cx="14" cy="5" r="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 21l2.2-5 3 2 2-4 3 1M7 12l3 1 2-3 3 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "apple") {
    return (
      <svg {...common}>
        <path d="M12 7c2-3 5-3 5-3s-1 3-3 4M8 10c-2 4 0 10 4 10s6-6 4-10c-1-2-3-3-4-3s-3 1-4 3Z" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (name === "smile") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8.5 13.5c.8 1.4 2 2.1 3.5 2.1s2.7-.7 3.5-2.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

