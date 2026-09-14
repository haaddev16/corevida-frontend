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

const THEME_FX = `
@keyframes ember-rise{0%{transform:translate3d(0,12px,0) scale(.55);opacity:0}12%{opacity:.95}100%{transform:translate3d(18px,-92vh,0) scale(.2);opacity:0}}
.fx-ember{position:absolute;bottom:-4%;width:3px;height:9px;border-radius:999px;background:linear-gradient(180deg,#ffb020,#ea580c);box-shadow:0 0 12px rgba(249,115,22,.85);animation:ember-rise 9s linear infinite}
@keyframes heat-floor{0%,100%{opacity:.38;transform:scaleX(1) translateY(0)}50%{opacity:.7;transform:scaleX(1.05) translateY(-10px)}}
.fx-heat-floor{pointer-events:none;position:absolute;left:-12%;right:-12%;bottom:-22%;height:46%;background:radial-gradient(ellipse at bottom,rgba(249,115,22,.32) 0%,rgba(234,88,12,.1) 44%,transparent 72%);filter:blur(22px);animation:heat-floor 6.4s ease-in-out infinite}
@keyframes heat-haze{0%,100%{transform:translateX(-3%) scaleY(1);opacity:.1}50%{transform:translateX(3%) scaleY(1.06);opacity:.2}}
.fx-heat-haze{pointer-events:none;position:absolute;inset:0;background:repeating-linear-gradient(180deg,transparent 0,rgba(249,115,22,.035) 2px,transparent 7px);mix-blend-mode:overlay;animation:heat-haze 8s ease-in-out infinite}
@keyframes scan-sweep{0%{transform:translateX(-45%);opacity:0}18%{opacity:.38}55%{opacity:.16}100%{transform:translateX(48%);opacity:0}}
.fx-scan-sweep{pointer-events:none;position:absolute;top:-12%;left:0;width:30%;height:124%;background:linear-gradient(90deg,transparent,rgba(255,122,24,.2),transparent);filter:blur(26px);animation:scan-sweep 10s ease-in-out infinite}
@keyframes spark-line{0%,100%{opacity:.45;filter:drop-shadow(0 0 4px rgba(249,115,22,.2));transform:scaleX(.92)}50%{opacity:1;filter:drop-shadow(0 0 10px rgba(255,176,32,.75));transform:scaleX(1)}}
.fx-spark-line{transform-origin:center;animation:page-fade .85s ease forwards,spark-line 2.8s ease-in-out 1s infinite}
@keyframes heat-stat{0%,100%{text-shadow:0 0 12px rgba(249,115,22,.22)}50%{text-shadow:0 0 26px rgba(255,122,24,.55),0 0 8px rgba(255,176,32,.35)}}
.fx-heat-stat{animation:heat-stat 3.2s ease-in-out infinite}
.stat-count.fx-heat-stat{animation:stat-count .45s cubic-bezier(.34,1.3,.64,1) both,heat-stat 3.2s ease-in-out .45s infinite}
@keyframes ember-under{0%,100%{opacity:.35;transform:scaleX(.86)}50%{opacity:.95;transform:scaleX(1.08)}}
@keyframes cta-ember{0%,100%{box-shadow:0 6px 28px rgba(234,88,12,.32);filter:brightness(1)}32%{box-shadow:0 12px 48px rgba(249,115,22,.55),0 0 28px rgba(255,176,32,.28);filter:brightness(1.08)}58%{box-shadow:0 8px 34px rgba(234,88,12,.4);filter:brightness(1.02)}78%{box-shadow:0 14px 52px rgba(249,115,22,.48),0 0 18px rgba(255,176,32,.2);filter:brightness(1.06)}}
.fx-cta-pulse{animation:cta-ember 2.8s ease-in-out infinite}
.fx-cta-pulse::after{content:"";position:absolute;inset:auto 12% -6px;height:10px;border-radius:999px;pointer-events:none;background:radial-gradient(ellipse at center,rgba(255,176,32,.55),transparent 70%);filter:blur(6px);animation:ember-under 2.4s ease-in-out infinite}
.fx-cta-pulse:hover{animation:none}
.fx-cta-pulse:hover::after{animation:none;opacity:.8}
.nav-glass{position:relative}
.nav-glass::before{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;pointer-events:none;background:linear-gradient(90deg,transparent,#f97316,#ffb020,#f97316,transparent);background-size:220% 100%;animation:bar-sheen 4.8s linear infinite;opacity:.7}
@media (prefers-reduced-motion:reduce){.fx-ember,.fx-heat-floor,.fx-heat-haze,.fx-scan-sweep,.fx-spark-line,.fx-heat-stat,.fx-cta-pulse::after,.nav-glass::before{animation:none!important;opacity:1}}
`;

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
      <style>{THEME_FX}</style>
      <AnimatedBackground scene={scene} image={image} overlay={overlay} />
      {scene === "landing" && !image && <LandingParallaxOrbs />}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
