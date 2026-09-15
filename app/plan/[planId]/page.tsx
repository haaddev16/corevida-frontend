"use client";

import { useParams } from "next/navigation";
import { ResultsView } from "@/components/results-view";

export default function PublicPlanPage() {
  const params = useParams<{ planId: string }>();
  const planId = decodeURIComponent(String(params.planId ?? ""));
  return <ResultsView key={planId} planIdFromRoute={planId} publicView />;
}
