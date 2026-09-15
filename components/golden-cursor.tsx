"use client";

import { useEffect, useRef } from "react";

type Sparkle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  gold: string;
};

const GOLDS = ["#ffe8a3", "#f3d16a", "#d4a017"];

export function GoldenCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const context = canvasEl?.getContext("2d") ?? null;
    if (!canvasEl || !context) return;

    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = context;

    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const sparkles: Sparkle[] = [];
    let last = { x: -99, y: -99 };
    let frame = 0;

    function resize() {
      if (!canvas || !ctx) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function addSparkle(x: number, y: number) {
      sparkles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7 - 0.25,
        life: 1,
        max: 18 + Math.random() * 16,
        size: 1.2 + Math.random() * 2.2,
        gold: GOLDS[Math.floor(Math.random() * GOLDS.length)],
      });
    }

    function onMove(event: PointerEvent) {
      const x = event.clientX;
      const y = event.clientY;
      const dx = x - last.x;
      const dy = y - last.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 6) return;
      last = { x, y };
      const count = dist > 28 ? 3 : 2;
      for (let i = 0; i < count; i += 1) addSparkle(x, y);
    }

    function drawStar(x: number, y: number, size: number) {
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size * 0.28, y - size * 0.28);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x + size * 0.28, y + size * 0.28);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size * 0.28, y + size * 0.28);
      ctx.lineTo(x - size, y);
      ctx.lineTo(x - size * 0.28, y - size * 0.28);
      ctx.closePath();
      ctx.fill();
    }

    function tick() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = sparkles.length - 1; i >= 0; i -= 1) {
        const sparkle = sparkles[i];
        sparkle.x += sparkle.vx;
        sparkle.y += sparkle.vy;
        sparkle.life -= 1 / sparkle.max;
        if (sparkle.life <= 0) {
          sparkles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = Math.max(sparkle.life, 0);
        ctx.fillStyle = sparkle.gold;
        ctx.shadowColor = sparkle.gold;
        ctx.shadowBlur = 8;
        drawStar(sparkle.x, sparkle.y, sparkle.size);
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      frame = window.requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[200] hidden md:block"
      aria-hidden
    />
  );
}
