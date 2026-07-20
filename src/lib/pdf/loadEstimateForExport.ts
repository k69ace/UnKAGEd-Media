import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { getEstimate, listOrgConfig } from "@/lib/data/catering";
import { computeEstimateSummary } from "@/lib/calculations/estimateSummary";

export async function loadEstimateForExport(estimateId: string) {
  const profile = await requireProfile();
  const estimate = await getEstimate(estimateId).catch(() => null);
  if (!estimate || estimate.organization_id !== profile.organizationId) notFound();

  const [config, org] = await Promise.all([
    listOrgConfig(profile.organizationId),
    (async () => {
      const supabase = await createClient();
      const { data } = await supabase.from("organizations").select("name").eq("id", profile.organizationId).single();
      return data;
    })(),
  ]);

  const summary = computeEstimateSummary(
    estimate,
    estimate.catering_estimate_line_items,
    estimate.catering_estimate_staffing,
    config.taxRules,
    config.settings,
  );

  return { estimate, summary, organizationName: org?.name ?? "Catering Estimator" };
}
