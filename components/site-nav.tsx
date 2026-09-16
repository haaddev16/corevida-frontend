"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui";
import { UserBadge } from "@/components/user-badge";
import { cn } from "@/lib/cn";

export function Logo({
  className,
  light = false,
  href = "/",
}: {
  className?: string;
  light?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "fx-logo type-logo text-[1.4rem] text-teal-light transition-opacity hover:opacity-80",
        light && "text-teal-light",
        className,
      )}
    >
      Corevida
    </Link>
  );
}

export function SiteNav({
  userName,
  planId,
  compact = false,
}: {
  userName?: string | null;
  planId?: string | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const homePath = userName || planId ? "/home" : "/";

  return (
    <nav className="nav-glass sticky top-0 z-50 flex items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-8 sm:py-4">
      <Logo href={homePath} className="shrink-0 text-[1.15rem] sm:text-[1.4rem]" />
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 sm:gap-3">
        <button
          onClick={() => router.push(homePath)}
          className="type-nav fx-nav min-h-10 rounded-[10px] px-2.5 py-2 text-teal-light transition-colors hover:bg-white/6 sm:min-h-11 sm:px-5"
        >
          Home
        </button>
        {planId && (
          <>
            <button
              onClick={() => router.push("/results")}
              className={cn(
                "type-nav fx-nav min-h-10 rounded-[10px] px-2.5 py-2 text-teal-light transition-colors hover:bg-white/6 sm:min-h-11 sm:px-5",
                compact && "hidden sm:inline-flex",
              )}
            >
              My plan
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="type-nav fx-nav min-h-10 rounded-[10px] border-[1.5px] border-teal-light/35 px-2.5 py-2 text-teal-light transition-colors hover:bg-white/6 sm:min-h-11 sm:px-5"
            >
              Habits
            </button>
          </>
        )}
        {userName ? <UserBadge /> : <PrimaryButton onClick={() => router.push("/auth")}>Get started</PrimaryButton>}
      </div>
    </nav>
  );
}
