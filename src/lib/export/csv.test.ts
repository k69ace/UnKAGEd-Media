import { describe, expect, it } from "vitest";
import { sanitizeCsvCell, toCsv } from "./csv";

describe("sanitizeCsvCell", () => {
  it.each(["=cmd|'/c calc'!A1", "+1+1", "-2+3", "@SUM(A1:A2)"])(
    "neutralizes a formula-injection payload starting with a trigger character: %s",
    (payload) => {
      expect(sanitizeCsvCell(payload)).toBe(`'${payload}`);
    },
  );

  it("leaves plain text and numbers untouched", () => {
    expect(sanitizeCsvCell("Smith Wedding")).toBe("Smith Wedding");
    expect(sanitizeCsvCell("1250.50")).toBe("1250.50");
  });
});

describe("toCsv", () => {
  it("quotes cells containing commas, quotes, or newlines", () => {
    const csv = toCsv(["name", "notes"], [["Acme, Inc.", 'Says "hi"']]);
    expect(csv).toContain('"Acme, Inc."');
    expect(csv).toContain('"Says ""hi"""');
  });

  it("neutralizes formula-injection payloads inside real row data", () => {
    const csv = toCsv(["Customer name"], [["=HYPERLINK(\"http://evil\",\"click\")"]]);
    expect(csv.startsWith("Customer name")).toBe(true);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).not.toMatch(/\r\n=HYPERLINK/);
  });

  it("uses CRLF line endings and a trailing line ending", () => {
    const csv = toCsv(["a"], [["1"], ["2"]]);
    expect(csv).toBe("a\r\n1\r\n2\r\n");
  });
});
