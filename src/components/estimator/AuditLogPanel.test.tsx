import { describe, expect, it } from "vitest";
import { summarizeChanges } from "./AuditLogPanel";

describe("summarizeChanges", () => {
  it("returns null for missing or non-object changes", () => {
    expect(summarizeChanges("created", null)).toBeNull();
    expect(summarizeChanges("created", undefined)).toBeNull();
    expect(summarizeChanges("created", "not an object")).toBeNull();
  });

  it("summarizes a status change as from -> to", () => {
    expect(summarizeChanges("status_changed", { from_status: "draft", to_status: "sent" })).toBe("draft → sent");
  });

  it("labels a brand-new status change with (new) when from_status is absent", () => {
    expect(summarizeChanges("status_changed", { to_status: "draft" })).toBe("(new) → draft");
  });

  it("returns null for status_changed without a to_status field", () => {
    expect(summarizeChanges("status_changed", { from_status: "draft" })).toBeNull();
  });

  it("summarizes post_approval_edit field diffs", () => {
    const changes = {
      guest_count_estimated: { from: 100, to: 120 },
      notes: { from: "old", to: "old" },
    };
    expect(summarizeChanges("post_approval_edit", changes)).toBe("guest_count_estimated: 100 → 120");
  });

  it("joins multiple changed fields with a semicolon", () => {
    const changes = {
      a: { from: 1, to: 2 },
      b: { from: "x", to: "y" },
    };
    expect(summarizeChanges("post_approval_edit", changes)).toBe("a: 1 → 2; b: x → y");
  });

  it("falls back to an em dash for null/undefined from or to values", () => {
    const changes = { a: { from: null, to: 5 } };
    expect(summarizeChanges("post_approval_edit", changes)).toBe("a: — → 5");
  });

  it("returns null when no post_approval_edit fields actually changed", () => {
    const changes = { a: { from: 1, to: 1 } };
    expect(summarizeChanges("post_approval_edit", changes)).toBeNull();
  });

  it("returns null for unrecognized actions", () => {
    expect(summarizeChanges("created", { anything: true })).toBeNull();
  });
});
