import { describe, expect, it } from "vitest";
import {
  assertRole,
  PermissionError,
  ADMIN_ROLES,
  APPROVER_ROLES,
  ESTIMATE_WRITE_ROLES,
  READ_ONLY_ROLE,
  type CurrentProfile,
} from "./profile";
import type { AppRole } from "@/lib/supabase/types";

const ALL_ROLES: AppRole[] = ["catering_admin", "manager_owner", "sales_manager", "chef", "reporting_readonly"];

function profileWithRole(role: AppRole): CurrentProfile {
  return {
    id: "user-1",
    organizationId: "org-1",
    locationId: null,
    role,
    fullName: "Test User",
    email: "test@example.com",
  };
}

describe("assertRole", () => {
  it("does not throw when the profile's role is in the allowed list", () => {
    expect(() => assertRole(profileWithRole("sales_manager"), ESTIMATE_WRITE_ROLES)).not.toThrow();
  });

  it("throws PermissionError when the profile's role is not in the allowed list", () => {
    expect(() => assertRole(profileWithRole(READ_ONLY_ROLE), ESTIMATE_WRITE_ROLES)).toThrow(PermissionError);
  });

  it("includes both the required roles and the caller's actual role in the error message", () => {
    try {
      assertRole(profileWithRole("sales_manager"), APPROVER_ROLES);
      expect.unreachable("assertRole should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(PermissionError);
      const message = (e as Error).message;
      expect(message).toContain("manager_owner");
      expect(message).toContain("sales_manager");
    }
  });
});

describe("role gating matches the product's access model", () => {
  it("reporting_readonly is excluded from every write-capable role list", () => {
    expect(ESTIMATE_WRITE_ROLES).not.toContain(READ_ONLY_ROLE);
    expect(ADMIN_ROLES).not.toContain(READ_ONLY_ROLE);
    expect(APPROVER_ROLES).not.toContain(READ_ONLY_ROLE);
  });

  it("only manager_owner can approve estimates that cross the approval gate", () => {
    expect(APPROVER_ROLES).toEqual(["manager_owner"]);
  });

  it("catering_admin and manager_owner are the only admin roles (Settings access)", () => {
    expect(new Set(ADMIN_ROLES)).toEqual(new Set(["catering_admin", "manager_owner"]));
  });

  it("every role can either write estimates, is the read-only role, or is an admin role -- no role falls through the cracks", () => {
    for (const role of ALL_ROLES) {
      const isWriter = ESTIMATE_WRITE_ROLES.includes(role);
      const isReadOnly = role === READ_ONLY_ROLE;
      expect(isWriter || isReadOnly).toBe(true);
    }
  });

  it.each(ESTIMATE_WRITE_ROLES)("assertRole allows %s to perform estimate-write actions", (role) => {
    expect(() => assertRole(profileWithRole(role), ESTIMATE_WRITE_ROLES)).not.toThrow();
  });

  it("assertRole blocks reporting_readonly from every estimate-write action", () => {
    expect(() => assertRole(profileWithRole(READ_ONLY_ROLE), ESTIMATE_WRITE_ROLES)).toThrow(PermissionError);
  });

  it.each(ALL_ROLES.filter((r) => r !== "manager_owner"))(
    "assertRole blocks %s from approver-only actions",
    (role) => {
      expect(() => assertRole(profileWithRole(role), APPROVER_ROLES)).toThrow(PermissionError);
    },
  );
});
