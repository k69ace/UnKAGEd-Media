import { requireProfile, ADMIN_ROLES } from "@/lib/auth/profile";
import { listAllEventTypes, listAllServiceStyles, listAllStaffingRoles, listAllTaxRules, listOrgConfig, listOrgMembers } from "@/lib/data/catering";
import { TaxRulesManager } from "@/components/estimator/TaxRulesManager";
import { ChargeSettingsForm } from "@/components/estimator/ChargeSettingsForm";
import { NamedListManager } from "@/components/estimator/NamedListManager";
import { StaffingRolesManager } from "@/components/estimator/StaffingRolesManager";
import { TeamManager } from "@/components/estimator/TeamManager";
import { createEventType, createServiceStyle, toggleEventTypeActive, toggleServiceStyleActive } from "./actions";

export default async function SettingsPage() {
  const profile = await requireProfile();

  if (!ADMIN_ROLES.includes(profile.role)) {
    return (
      <div className="rounded-lg border border-foreground/10 p-6 text-sm">
        <p>Settings are only available to Catering Admin and Manager/Owner roles.</p>
      </div>
    );
  }

  const [config, allTaxRules, allEventTypes, allServiceStyles, allStaffingRoles, members] = await Promise.all([
    listOrgConfig(profile.organizationId),
    listAllTaxRules(profile.organizationId),
    listAllEventTypes(profile.organizationId),
    listAllServiceStyles(profile.organizationId),
    listAllStaffingRoles(profile.organizationId),
    listOrgMembers(profile.organizationId),
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

      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
        <section>
          <h2 className="text-base font-semibold">Event Types</h2>
          <div className="mt-4">
            <NamedListManager
              items={allEventTypes}
              itemLabel="Event type"
              createAction={createEventType}
              toggleAction={toggleEventTypeActive}
            />
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold">Service Styles</h2>
          <div className="mt-4">
            <NamedListManager
              items={allServiceStyles}
              itemLabel="Service style"
              createAction={createServiceStyle}
              toggleAction={toggleServiceStyleActive}
            />
          </div>
        </section>
      </div>

      <section>
        <h2 className="text-base font-semibold">Staffing Roles</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Default rate and guest ratio pre-fill the Staffing section when building an estimate — they don&apos;t
          lock in a rate; sales staff can still adjust per estimate.
        </p>
        <div className="mt-4">
          <StaffingRolesManager roles={allStaffingRoles} />
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold">Team</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Change a teammate&apos;s role, or deactivate someone who&apos;s left — a deactivated account loses access
          immediately. You can&apos;t deactivate yourself or remove the organization&apos;s last admin.
        </p>
        <div className="mt-4">
          <TeamManager members={members} currentProfileId={profile.id} />
        </div>
      </section>

      <section className="rounded-lg border border-dashed border-foreground/15 p-4 text-sm text-foreground/60">
        <p className="font-medium text-foreground/80">Not yet manageable from this page</p>
        <p className="mt-1">
          Package templates don&apos;t have a dedicated admin UI yet — edit them directly via the Supabase Table
          Editor, or adapt the demo template created by <code>supabase/seed.sql</code>. There&apos;s also still no
          invite flow — a new teammate&apos;s sign-up creates its own separate organization, and merging that
          into yours requires a direct database edit (see the admin guide); the Team list above only manages
          role/active status for people already in your organization.
        </p>
      </section>
    </div>
  );
}
