import { api } from "@/lib/api";
import { clearPlanCache, savePlan, saveProfileId } from "@/lib/storage";
import type { PastPlan, Plan } from "@/lib/types";

export async function hydrateUserPlan(userId: string): Promise<{
  history: PastPlan[];
  plan: Plan | null;
}> {
  const history = await api.listPlans(userId);
  if (history.length === 0) {
    clearPlanCache();
    return { history, plan: null };
  }

  const latest = history[0];
  if (latest.profile_id) saveProfileId(latest.profile_id);
  const plan = await api.getPlan(latest.plan_id);
  savePlan(plan);
  return { history, plan };
}
