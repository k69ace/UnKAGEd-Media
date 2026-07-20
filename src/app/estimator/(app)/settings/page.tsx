import { requireProfile, ADMIN_ROLES } from "@/lib/auth/profile";
import { listAllTaxRules, listOrgConfig } from "@/lib/data/catering";
import { TaxRulesManager } from "@/components/estimator/TaxRulesManager";
import { ChargeSettingsForm } from "@/components/estimator/ChargeSettingsForm";

export default async function SettingsPage() {
  const profile = await requireProfile();

  if (!ADMIN_ROLES.includes(profile.role)) {
    return (
      <div className="rounded-lg border border-foreground/10 p-6 text-sm">
        <p>Settings are only available to Catering Admin and Manager/Owner roles.</p>
      </div>
    );
  }

  const [config, allTaxRules] = await Promise.all([
    listOrgConfig(profile.organizationId),
    listAllTaxRules(profile.organizationId),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Tax rules and fee configuration apply org-wide to every new line item and estimate calculation.
        </p>
      </div>

      <section>
        <h2 className="text-base font-semibold">Tax Rules</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Each rule is applied only to the line items assigned to it — never a single blanket rate across the whole estimate.
        </p>
        <div className="mt-4">
          <TaxRulesManager taxRules={allTaxRules} />
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold">Service Charge, Gratuity &amp; Approval</h2>
        <div className="mt-4 max-w-2xl">
          <ChargeSettingsForm settings={config.settings} taxRules={config.taxRules} />
        </div>
      </section>

      <section className="rounded-lg border border-dashed border-foreground/15 p-4 text-sm text-foreground/60">
        <p className="font-medium text-foreground/80">Not yet manageable from this page</p>
        <p className="mt-1">
          Event types, service styles, staffing roles/ratios, and package templates ship with sensible defaults per
          organization but don&apos;t have a dedicated admin UI yet — edit them directly via the Supabase Table Editor
          for now. See Known Limitations in the module README.
        </p>
      </section>
    </div>
  );
}
