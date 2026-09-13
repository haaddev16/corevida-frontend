type Variant = "default" | "dark" | "loading";

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function AnimatedBackground({ variant = "default" }: { variant?: Variant }) {
  const dark = variant === "dark" || variant === "loading";
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Base gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: dark
            ? "linear-gradient(135deg, #0d1a16 0%, #111f1b 55%, #162823 100%)"
            : "linear-gradient(145deg, #eef7ef 0%, #faf9f5 45%, #fdf2ec 100%)",
        }}
      />

      {/* Blob 1 — sage/green top-left */}
      <div
        style={{
          position: "absolute",
          top: "-12%",
          left: "-8%",
          width: "58vw",
          height: "58vw",
          borderRadius: "50%",
          background: dark
            ? "radial-gradient(ellipse at center, rgba(127,173,139,0.2) 0%, transparent 68%)"
            : "radial-gradient(ellipse at center, rgba(127,173,139,0.42) 0%, transparent 68%)",
          filter: "blur(64px)",
          animation: "blob-float 20s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Blob 2 — teal bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: "5%",
          right: "-12%",
          width: "52vw",
          height: "52vw",
          borderRadius: "50%",
          background: dark
            ? "radial-gradient(ellipse at center, rgba(42,157,143,0.22) 0%, transparent 68%)"
            : "radial-gradient(ellipse at center, rgba(42,157,143,0.22) 0%, transparent 68%)",
          filter: "blur(80px)",
          animation: "blob-float-2 24s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Blob 3 — coral/peach center-right */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "35%",
          width: "44vw",
          height: "44vw",
          borderRadius: "50%",
          background: dark
            ? "radial-gradient(ellipse at center, rgba(232,133,106,0.10) 0%, transparent 68%)"
            : "radial-gradient(ellipse at center, rgba(232,133,106,0.18) 0%, transparent 68%)",
          filter: "blur(72px)",
          animation: "blob-float-3 30s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Energy accent blob — top right (small) */}
      {variant === "loading" && (
        <div
          style={{
            position: "absolute",
            top: "15%",
            right: "8%",
            width: "28vw",
            height: "28vw",
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(168,230,61,0.12) 0%, transparent 68%)",
            filter: "blur(50px)",
            animation: "blob-float 14s ease-in-out infinite reverse",
          }}
        />
      )}

      {/* Noise texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: NOISE_SVG,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
          opacity: dark ? 0.025 : 0.04,
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}
