"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui";
import { downloadPlanPdf } from "@/lib/plan-pdf";
import { copyText, planShareUrl } from "@/lib/share";
import type { Plan } from "@/lib/types";

export function PlanShareActions({
  plan,
  showShare = true,
  showLink = false,
}: {
  plan: Plan;
  showShare?: boolean;
  showLink?: boolean;
}) {
  const [shareOpen, setShareOpen] = useState(showLink);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const url = planShareUrl(plan.plan_id);

  async function onCopy() {
    try {
      await copyText(url);
      setCopied(true);
      setShareOpen(true);
      setMessage("");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setMessage("Could not copy the link. Select it and copy it yourself.");
    }
  }

  async function onPdf() {
    setBusy(true);
    setMessage("");
    try {
      await downloadPlanPdf(plan);
    } catch {
      setMessage("Could not create the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const linkVisible = shareOpen || showLink;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onPdf}
          disabled={busy}
          className="type-button rounded-full bg-[linear-gradient(135deg,#1e7a6e,#2a9d8f)] px-6 py-3 text-white shadow-[0_4px_16px_rgba(30,122,110,0.28)] disabled:opacity-60"
        >
          {busy ? "Preparing PDF…" : "Download as PDF"}
        </button>
        {showShare && (
          <button
            type="button"
            onClick={() => setShareOpen((open) => !open)}
            className="type-button rounded-full bg-sage/12 px-6 py-3 text-ink"
          >
            {shareOpen ? "Hide share link" : "Share"}
          </button>
        )}
        <button
          type="button"
          onClick={onCopy}
          className="type-button rounded-full border-[1.5px] border-teal-light/35 px-6 py-3 text-teal-light"
        >
          {copied ? "Link copied" : "Copy link"}
        </button>
      </div>
      {linkVisible && (
        <GlassCard className="mt-4 px-5 py-4">
          <div className="type-label mb-2 text-sage">Public link</div>
          <p className="type-caption break-all text-forest">{url}</p>
          <p className="type-caption mt-2 text-sage">
            Anyone with this link can view the plan. They cannot edit it or log habits.
          </p>
        </GlassCard>
      )}
      {message ? <p className="type-caption mt-3 text-coral-light">{message}</p> : null}
    </div>
  );
}
