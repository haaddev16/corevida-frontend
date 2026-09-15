"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { clearSession, firstName, useSession } from "@/lib/storage";

export function UserBadge({ className }: { className?: string }) {
  const session = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!session.ready || !session.userId) return null;

  const shown = firstName(session.userName);
  const initial = shown.slice(0, 1).toUpperCase();

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  function signOut() {
    setOpen(false);
    clearSession();
    router.push("/");
  }

  return (
    <div ref={box} className={cn("relative z-50", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex shrink-0 items-center gap-2.5 rounded-full border border-white/10 bg-black/25 px-2 py-1.5 pr-3 backdrop-blur-md transition-colors hover:border-[#4db8aa]/45 hover:bg-black/40"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#4db8aa]/45 bg-[#2a9d8f]/25 type-stat text-[0.82rem] text-teal-light shadow-[0_0_14px_rgba(77,184,170,0.28)]">
          {initial}
        </div>
        <div className="min-w-0 text-left leading-tight">
          <div className="type-title truncate text-[0.95rem] text-forest">{shown}</div>
          {session.userEmail && (
            <div className="type-meta hidden max-w-[140px] truncate text-sage sm:block">{session.userEmail}</div>
          )}
        </div>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+8px)] right-0 min-w-[176px] rounded-2xl border border-white/12 bg-[#0d1a16]/92 p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-md"
        >
          <MenuItem label="Home" onClick={() => go("/home")} />
          {session.planId && (
            <>
              <MenuItem label="My plan" onClick={() => go("/results")} />
              <MenuItem label="Dashboard" onClick={() => go("/dashboard")} />
            </>
          )}
          <MenuItem label="Sign out" danger onClick={signOut} />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full rounded-xl px-3 py-2 text-left type-nav transition-colors",
        danger ? "text-[#e8856a] hover:bg-[#e8856a]/12" : "text-forest hover:bg-white/8",
      )}
    >
      {label}
    </button>
  );
}
