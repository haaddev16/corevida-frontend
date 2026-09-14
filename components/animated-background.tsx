"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E\")";

type Scene = "app" | "landing" | "intake";

const LANDING_ORBS = [
  {
    className: "landing-orb -top-[8%] -left-[10%] h-[70vw] max-h-[620px] w-[70vw] max-w-[620px]",
    parallax: -0.08,
    glow: "radial-gradient(circle at center, rgba(232,160,112,0.72) 0%, rgba(196,120,74,0.38) 38%, transparent 70%)",
    float: "blob-float 20s ease-in-out infinite",
  },
  {
    className: "landing-orb -right-[8%] bottom-[-6%] h-[62vw] max-h-[560px] w-[62vw] max-w-[560px]",
    parallax: -0.14,
    glow: "radial-gradient(circle at center, rgba(251,146,60,0.78) 0%, rgba(249,115,22,0.4) 40%, transparent 70%)",
    float: "blob-float-2 24s ease-in-out infinite",
  },
  {
    className: "landing-orb top-[32%] left-[30%] h-[48vw] max-h-[440px] w-[48vw] max-w-[440px]",
    parallax: -0.2,
    glow: "radial-gradient(circle at center, rgba(251,146,60,0.55) 0%, rgba(234,88,12,0.26) 44%, transparent 72%)",
    float: "blob-float-3 30s ease-in-out infinite",
  },
];

function LandingParallaxOrbs() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const apply = () => {
      layer.style.setProperty("--scroll-y", `${Math.min(window.scrollY, 1600)}`);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      ref={layerRef}
      className="landing-parallax"
      data-landing-orbs="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2,
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      {LANDING_ORBS.map((orb) => (
        <div
          key={orb.float}
          className={orb.className}
          style={{ ["--parallax" as string]: orb.parallax }}
        >
          <div
            className="landing-orb-core h-full w-full rounded-full"
            style={{
              background: orb.glow,
              animation: orb.float,
              mixBlendMode: "normal",
              filter: "blur(46px)",
              boxShadow: "0 0 80px 24px rgba(249,115,22,0.35), 0 0 160px 48px rgba(196,120,74,0.2)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

function FadingPhoto({ image }: { image: string }) {
  const [active, setActive] = useState(image);
  const [incoming, setIncoming] = useState<string | null>(null);

  useEffect(() => {
    if (image === active) return;
    setIncoming(image);
    const t = window.setTimeout(() => {
      setActive(image);
      setIncoming(null);
    }, 480);
    return () => window.clearTimeout(t);
  }, [image, active]);

  return (
    <>
      <div
        className="fx-kenburns absolute inset-[-4%] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${active}')` }}
      />
      {incoming && (
        <div
          className="fx-kenburns absolute inset-[-4%] bg-cover bg-center bg-no-repeat [animation:fade-in_0.48s_ease]"
          style={{ backgroundImage: `url('${incoming}')` }}
        />
      )}
    </>
  );
}

export function AnimatedBackground({
  scene = "app",
  image,
  overlay = "default",
}: {
  scene?: Scene;
  image?: string;
  overlay?: "default" | "sides";
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 h-dvh w-dvw overflow-hidden" aria-hidden>
      {image ? (
        <>
          <FadingPhoto image={image} />
          {overlay === "sides" ? (
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.12)_0%,rgba(10,10,10,0.42)_16%,rgba(10,10,10,0.94)_34%,rgba(10,10,10,0.96)_66%,rgba(10,10,10,0.42)_84%,rgba(10,10,10,0.12)_100%)]" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,10,10,0.28)_0%,rgba(10,10,10,0.52)_100%)]" />
          )}
        </>
      ) : scene === "landing" ? (
        <>
          <img
            src="/landing-gym-wide.png"
            alt=""
            className="fx-kenburns absolute inset-0 hidden h-full w-full object-cover object-center md:block"
          />
          <img
            src="/landing-gym.png"
            alt=""
            className="fx-kenburns absolute inset-0 h-full w-full object-cover object-[center_72%] md:hidden"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.18)_0%,rgba(18,10,6,0.32)_55%,rgba(26,12,4,0.58)_100%)]" />
          <div className="fx-aurora" />
          <div className="fx-scan-sweep" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#0a0a0a_0%,#111111_55%,#1a1410_100%)]" />
          <div className="absolute inset-y-0 left-0 w-[38%] bg-[linear-gradient(90deg,rgba(196,120,74,0.12),transparent)]" />
          <div
            className="absolute -top-[12%] -left-[8%] h-[58vw] w-[58vw] rounded-full blur-[64px]"
            style={{
              background: "radial-gradient(ellipse at center, rgba(196,120,74,0.22) 0%, transparent 68%)",
              animation: "blob-float 20s ease-in-out infinite",
            }}
          />
          <div
            className="absolute right-[-12%] bottom-[5%] h-[52vw] w-[52vw] rounded-full blur-[80px]"
            style={{
              background: "radial-gradient(ellipse at center, rgba(249,115,22,0.24) 0%, transparent 68%)",
              animation: "blob-float-2 24s ease-in-out infinite",
            }}
          />
          <div
            className="absolute top-[40%] left-[35%] h-[44vw] w-[44vw] rounded-full blur-[72px]"
            style={{
              background: "radial-gradient(ellipse at center, rgba(232,133,106,0.1) 0%, transparent 68%)",
              animation: "blob-float-3 30s ease-in-out infinite",
            }}
          />
        </>
      )}

      {[8, 22, 37, 51, 64, 78, 89].map((left, i) => (
        <span
          key={left}
          className="fx-mote"
          style={{
            left: `${left}%`,
            animationDelay: `${i * 1.7}s`,
            animationDuration: `${12 + (i % 3) * 3}s`,
          }}
        />
      ))}

      {[14, 31, 48, 67, 82].map((left, i) => (
        <span
          key={`ember-${left}`}
          className="fx-ember"
          style={{
            left: `${left}%`,
            animationDelay: `${i * 1.4}s`,
            animationDuration: `${8 + (i % 3) * 2.2}s`,
          }}
        />
      ))}

      <div className="fx-heat-floor" />
      <div className="fx-heat-haze" />

      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{
          backgroundImage: NOISE,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
          opacity: 0.03,
        }}
      />
    </div>
  );
}

export function PageShell({
  children,
  className,
  scene = "app",
  image,
  overlay = "default",
}: {
  children: ReactNode;
  className?: string;
  scene?: Scene;
  image?: string;
  overlay?: "default" | "sides";
}) {
  return (
    <div className={cn("relative min-h-dvh", className)}>
      <AnimatedBackground scene={scene} image={image} overlay={overlay} />
      {scene === "landing" && !image && <LandingParallaxOrbs />}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
