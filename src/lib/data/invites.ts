import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isInviteUsable, inviteEmailMatches } from "@/lib/invites/inviteRules";
import type { Database } from "@/lib/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface InvitePreview {
  organizationName: string;
  role: AppRole;
  email: string | null;
}

/**
 * Pre-auth invite lookup for the sign-up page. Deliberately uses the
 * service-role client: the caller has no session yet at this point (they
 * haven't signed up), and invites RLS intentionally grants no anonymous
 * select -- this is the module's one real use of createServiceRoleClient()
 * (see CATERING_ESTIMATOR.md's "why no service-role usage" section).
 */
export async function getInvitePreview(token: string): Promise<InvitePreview | null> {
  const supabase = createServiceRoleClient();
  const { data: invite, error } = await supabase
    .from("invites")
    .select("organization_id, email, role, expires_at, accepted_at, revoked_at")
    .eq("token", token)
    .single();
  if (error || !invite || !isInviteUsable(invite)) return null;

  const { data: org } = await supabase.from("organizations").select("name").eq("id", invite.organization_id).single();
  if (!org) return null;

  return { organizationName: org.name, role: invite.role, email: invite.email };
}

export type InviteValidationResult = { valid: true } | { valid: false; error: string };

/**
 * Re-validated at signup time (not just relying on the page-load preview)
 * because expiry/revocation/acceptance can change in the gap between
 * loading the invite page and submitting the form.
 */
export async function validateInviteForSignup(token: string, signupEmail: string): Promise<InviteValidationResult> {
  const supabase = createServiceRoleClient();
  const { data: invite, error } = await supabase
    .from("invites")
    .select("email, expires_at, accepted_at, revoked_at")
    .eq("token", token)
    .single();
  if (error || !invite) return { valid: false, error: "This invite link isn't valid." };
  if (!isInviteUsable(invite)) {
    return { valid: false, error: "This invite link has expired, been revoked, or was already used." };
  }
  if (!inviteEmailMatches(invite.email, signupEmail)) {
    return { valid: false, error: "This invite was issued for a different email address." };
  }
  return { valid: true };
}
