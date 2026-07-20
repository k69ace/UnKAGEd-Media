import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/supabase/types";

export interface CurrentProfile {
  id: string;
  organizationId: string;
  locationId: string | null;
  role: AppRole;
  fullName: string;
  email: string;
}

/** Returns null when there is no signed-in user — callers decide whether that's an error. */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, location_id, role, full_name, email")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return {
    id: profile.id,
    organizationId: profile.organization_id,
    locationId: profile.location_id,
    role: profile.role,
    fullName: profile.full_name,
    email: profile.email,
  };
}

/** For Server Components/pages: redirects to login instead of rendering when unauthenticated. */
export async function requireProfile(): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/estimator/login");
  return profile;
}

export class PermissionError extends Error {
  constructor(message = "You don't have permission to perform this action.") {
    super(message);
    this.name = "PermissionError";
  }
}

/** For Server Actions/Route Handlers: throws instead of redirecting, so callers can return 403 JSON. */
export function assertRole(profile: CurrentProfile, allowedRoles: AppRole[]): void {
  if (!allowedRoles.includes(profile.role)) {
    throw new PermissionError(
      `This action requires one of: ${allowedRoles.join(", ")}. Your role is ${profile.role}.`,
    );
  }
}

export const READ_ONLY_ROLE: AppRole = "reporting_readonly";
export const APPROVER_ROLES: AppRole[] = ["manager_owner"];
export const ADMIN_ROLES: AppRole[] = ["catering_admin", "manager_owner"];
export const ESTIMATE_WRITE_ROLES: AppRole[] = [
  "sales_manager",
  "chef",
  "catering_admin",
  "manager_owner",
];
