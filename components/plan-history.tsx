"use client";

import Link from "next/link";
import type { PastPlan } from "@/lib/types";

export function formatPlanStamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function PlanHistoryList({
  history,
  limit = 8,
}: {
  history: PastPlan[];
  limit?: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      {history.slice(0, limit).map((item, index) => (
        <Link
          key={`${item.plan_id}-${item.created_at}-${index}`}
          href={`/results/${encodeURIComponent(item.plan_id)}`}
          className="fx-history-item type-caption flex min-h-11 items-center rounded-[10px] border border-sage/20 px-3 py-2.5 text-left text-ink hover:bg-sage/8"
          style={{ animationDelay: `${index * 0.06}s` }}
        >
          {formatPlanStamp(item.created_at)}
        </Link>
      ))}
    </div>
  );
}
