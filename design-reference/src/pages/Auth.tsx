import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AnimatedBackground from "../components/AnimatedBackground";

const API = "http://127.0.0.1:8000";

type Tab = "login" | "signup";

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "14px 18px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.6)",
    backdropFilter: "blur(8px)",
    border: focused ? "1.5px solid #2a9d8f" : "1.5px solid rgba(127,173,139,0.3)",
    fontFamily: "'Outfit', sans-serif",
    fontSize: "0.95rem",
    color: "#1a2420",
    outline: "none",
    transition: "all 0.22s ease",
    boxShadow: focused ? "0 0 0 3px rgba(42,157,143,0.12)" : "none",
  };
}

function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (pw.length === 0) return { level: 0, label: "", color: "#e0e0e0" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: "Weak", color: "#e8856a" };
  if (score === 2) return { level: 2, label: "Fair", color: "#f5c95e" };
  if (score === 3) return { level: 3, label: "Good", color: "#7fad8b" };
  return { level: 4, label: "Strong", color: "#a8e63d" };
}

export default function Auth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("signup");
  const [mounted, setMounted] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Signup fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Focus tracking
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    const uid = localStorage.getItem("user_id");
    if (uid) navigate("/intake");
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, [navigate]);

  const pwStrength = getPasswordStrength(password);

  function shake() {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name || !email || !password || !confirm) {
      setError("Please fill in all fields.");
      return shake();
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return shake();
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return shake();
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Sign up failed.");
      }
      const data = await res.json();
      localStorage.setItem("user_id", data.id);
      localStorage.setItem("user_name", data.name || name);
      navigate("/intake");
    } catch (err: unknown) {
      // Fallback: demo mode without real backend
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        // Demo mode
        localStorage.setItem("user_id", "demo-" + Date.now());
        localStorage.setItem("user_name", name || "Demo User");
        navigate("/intake");
      } else {
        setError(msg);
        shake();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!loginEmail || !loginPassword) {
      setError("Please fill in all fields.");
      return shake();
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Invalid credentials.");
      }
      const data = await res.json();
      localStorage.setItem("user_id", data.id);
      localStorage.setItem("user_name", data.name || "");
      navigate("/intake");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        localStorage.setItem("user_id", "demo-" + Date.now());
        localStorage.setItem("user_name", "Demo User");
        navigate("/intake");
      } else {
        setError(msg);
        shake();
      }
    } finally {
      setLoading(false);
    }
  }

  function switchTab(t: Tab) {
    setTab(t);
    setError("");
  }

  const cardAnim: React.CSSProperties = {
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0) scale(1)" : "translateY(32px) scale(0.97)",
    transition: "opacity 0.65s ease, transform 0.65s cubic-bezier(0.34,1.2,0.64,1)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
      }}
    >
      <AnimatedBackground />

      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          position: "relative",
          zIndex: 1,
          ...cardAnim,
        }}
      >
        {/* Logo */}
        <div
          style={{ textAlign: "center", marginBottom: "32px", cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          <span
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "1.8rem",
              fontWeight: 700,
              color: "#1e7a6e",
            }}
          >
            Corevida
          </span>
          <div style={{ fontSize: "0.85rem", color: "#7fad8b", marginTop: "4px" }}>
            Your AI wellness coach
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.75)",
            borderRadius: "24px",
            padding: "36px 32px",
            boxShadow: "0 8px 40px rgba(30,122,110,0.12), 0 2px 8px rgba(30,122,110,0.06)",
            animation: shaking ? "shake 0.5s ease" : undefined,
          }}
        >
          {/* Tab toggle */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              background: "rgba(127,173,139,0.12)",
              borderRadius: "12px",
              padding: "4px",
              marginBottom: "28px",
            }}
          >
            {(["signup", "login"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "9px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  transition: "all 0.22s ease",
                  background: tab === t ? "#1e7a6e" : "transparent",
                  color: tab === t ? "white" : "#6b8c85",
                  boxShadow: tab === t ? "0 2px 10px rgba(30,122,110,0.25)" : "none",
                }}
              >
                {t === "signup" ? "Sign up" : "Log in"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: "rgba(232,133,106,0.12)",
                border: "1px solid rgba(232,133,106,0.35)",
                color: "#c0614a",
                fontSize: "0.85rem",
                marginBottom: "20px",
                animation: "fade-in 0.3s ease",
              }}
            >
              {error}
            </div>
          )}

          {/* Sign Up Form */}
          {tab === "signup" && (
            <form
              onSubmit={handleSignup}
              style={{ display: "flex", flexDirection: "column", gap: "14px", animation: "tab-slide 0.3s ease" }}
            >
              <div>
                <label style={labelStyle}>Full name</label>
                <input
                  type="text"
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                  style={inputStyle(focused === "name")}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  style={inputStyle(focused === "email")}
                />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("pw")}
                  onBlur={() => setFocused(null)}
                  style={inputStyle(focused === "pw")}
                />
                {password.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <div
                      style={{
                        height: "4px",
                        borderRadius: "4px",
                        background: "#e8f0ec",
                        overflow: "hidden",
                        marginBottom: "4px",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: "4px",
                          background: pwStrength.color,
                          width: `${(pwStrength.level / 4) * 100}%`,
                          transition: "all 0.3s ease",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "0.75rem", color: pwStrength.color, fontWeight: 500 }}>
                      {pwStrength.label}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Confirm password</label>
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onFocus={() => setFocused("confirm")}
                  onBlur={() => setFocused(null)}
                  style={{
                    ...inputStyle(focused === "confirm"),
                    borderColor:
                      confirm.length > 0 && confirm !== password
                        ? "#e8856a"
                        : focused === "confirm"
                        ? "#2a9d8f"
                        : "rgba(127,173,139,0.3)",
                  }}
                />
              </div>
              <SubmitButton loading={loading}>Create account</SubmitButton>
            </form>
          )}

          {/* Login Form */}
          {tab === "login" && (
            <form
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: "14px", animation: "tab-slide 0.3s ease" }}
            >
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onFocus={() => setFocused("lemail")}
                  onBlur={() => setFocused(null)}
                  style={inputStyle(focused === "lemail")}
                />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  placeholder="Your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onFocus={() => setFocused("lpw")}
                  onBlur={() => setFocused(null)}
                  style={inputStyle(focused === "lpw")}
                />
              </div>
              <SubmitButton loading={loading}>Log in</SubmitButton>
            </form>
          )}

          {/* Guest */}
          <div style={{ marginTop: "18px", textAlign: "center" }}>
            <button
              onClick={() => {
                localStorage.setItem("user_id", "guest-" + Date.now());
                localStorage.setItem("user_name", "Guest");
                navigate("/intake");
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
                fontSize: "0.85rem",
                color: "#7fad8b",
                textDecoration: "underline",
                textDecorationColor: "rgba(127,173,139,0.4)",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1e7a6e")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#7fad8b")}
            >
              Continue as guest →
            </button>
          </div>
        </div>

        {/* Micro-copy */}
        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "0.8rem",
            color: "#7fad8b",
            lineHeight: 1.6,
          }}
        >
          Your plan is generated in under 60 seconds.
          <br />
          No credit card required.
        </p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "#4a6560",
  marginBottom: "6px",
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: "0.02em",
  textTransform: "uppercase",
};

function SubmitButton({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        marginTop: "6px",
        width: "100%",
        padding: "15px",
        borderRadius: "12px",
        background: loading
          ? "rgba(127,173,139,0.4)"
          : "linear-gradient(135deg, #1e7a6e 0%, #2a9d8f 100%)",
        color: "white",
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 600,
        fontSize: "0.98rem",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.22s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        boxShadow: loading ? "none" : "0 4px 20px rgba(30,122,110,0.28)",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 28px rgba(30,122,110,0.4)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = loading ? "none" : "0 4px 20px rgba(30,122,110,0.28)";
      }}
    >
      {loading ? (
        <>
          <LoadingDots />
          Signing in…
        </>
      ) : (
        children
      )}
    </button>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[0, 0.15, 0.3].map((d, i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.8)",
            display: "inline-block",
            animation: `dot-bounce 0.8s ease ${d}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
