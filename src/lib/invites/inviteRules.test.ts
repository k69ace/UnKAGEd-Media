import { describe, expect, it } from "vitest";
import { inviteEmailMatches, isInviteUsable } from "./inviteRules";

const now = new Date("2026-07-24T12:00:00Z");

describe("isInviteUsable", () => {
  it("is usable when unaccepted, unrevoked, and not yet expired", () => {
    expect(isInviteUsable({ accepted_at: null, revoked_at: null, expires_at: "2026-07-25T00:00:00Z" }, now)).toBe(true);
  });

  it("is not usable once accepted", () => {
    expect(
      isInviteUsable({ accepted_at: "2026-07-23T00:00:00Z", revoked_at: null, expires_at: "2026-07-25T00:00:00Z" }, now),
    ).toBe(false);
  });

  it("is not usable once revoked, even if not yet expired", () => {
    expect(
      isInviteUsable({ accepted_at: null, revoked_at: "2026-07-23T00:00:00Z", expires_at: "2026-07-25T00:00:00Z" }, now),
    ).toBe(false);
  });

  it("is not usable once expired", () => {
    expect(isInviteUsable({ accepted_at: null, revoked_at: null, expires_at: "2026-07-01T00:00:00Z" }, now)).toBe(false);
  });

  it("treats the expiry instant itself as expired, not usable", () => {
    expect(isInviteUsable({ accepted_at: null, revoked_at: null, expires_at: now.toISOString() }, now)).toBe(false);
  });
});

describe("inviteEmailMatches", () => {
  it("matches any signup email when the invite has no email set (an open link)", () => {
    expect(inviteEmailMatches(null, "anyone@example.com")).toBe(true);
  });

  it("matches case-insensitively and ignores surrounding whitespace", () => {
    expect(inviteEmailMatches("Jane@Example.com", " jane@example.com ")).toBe(true);
  });

  it("rejects a different email address", () => {
    expect(inviteEmailMatches("jane@example.com", "someone.else@example.com")).toBe(false);
  });
});
