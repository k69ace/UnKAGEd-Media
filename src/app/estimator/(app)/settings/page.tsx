import { requireProfile, ADMIN_ROLES } from "@/lib/auth/profile";
import {
  listAllEventTypes,
  listAllPackageTemplates,
  listAllServiceStyles,
  listAllStaffingRoles,
  listAllTaxRules,
  listOrgConfig,
  listOrgMembers,
  listPendingInvites,
} from "@/lib/data/catering";
import { TaxRulesManager } from "@/components/estimator/TaxRulesManager";
import { ChargeSettingsForm } from "@/components/estimator/ChargeSettingsForm";
import { NamedListManager } from "@/components/estimator/NamedListManager";
import { StaffingRolesManager } from "@/components/estimator/StaffingRolesManager";
import { TeamManager } from "@/components/estimator/TeamManager";
import { InviteManager } from "@/components/estimator/InviteManager";
import { PackageTemplateManager } from "@/components/estimator/PackageTemplateManager";
import { PackageTemplateCsvImport } from "@/components/estimator/PackageTemplateCsvImport";
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

  const [config, allTaxRules, allEventTypes, allServiceStyles, allStaffingRoles, members, allPackageTemplates, pendingInvites] =
    await Promise.all([
      listOrgConfig(profile.organizationId),
      listAllTaxRules(profile.organizationId),
      listAllEventTypes(profile.organizationId),
      listAllServiceStyles(profile.organizationId),
      listAllStaffingRoles(profile.organizationId),
      listOrgMembers(profile.organizationId),
      listAllPackageTemplates(profile.organizationId),
      listPendingInvites(profile.organizationId),
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
        <h2 className="text-base font-semibold">Invite a teammate</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Generates a link that joins your organization directly, with the role you pick — no more separate
          organization to merge in by hand. Leave email blank for an open link anyone can use; set it to restrict
          the link to that address. Links expire after 7 days and can be revoked any time before they&apos;re used.
        </p>
        <div className="mt-4">
          <InviteManager invites={pendingInvites} />
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

      <section>
        <h2 className="text-base font-semibold">Package Templates</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Reusable bundles of line items sales staff can drop onto an estimate in one step (Menu/Packages section
          of the builder). Editing a template only affects future uses of it — estimates that already applied it
          keep their own copy of the line items, untouched.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <PackageTemplateManager templates={allPackageTemplates} taxRules={config.taxRules} />
          <PackageTemplateCsvImport />
        </div>
      </section>

    </div>
  );
}
