// A cell that looks like a formula to Excel/Sheets (starts with =, +, -,
// or @) gets prefixed with a leading apostrophe so it opens as inert text
// instead of executing as a formula when the file is opened — the
// standard CSV-injection mitigation. Applied to every cell, not just
// user-entered ones, since it's harmless on plain text/numbers and the
// cost of missing one field is a real vulnerability.
const FORMULA_TRIGGER_CHARS = ["=", "+", "-", "@"];

export function sanitizeCsvCell(value: string): string {
  if (FORMULA_TRIGGER_CHARS.some((c) => value.startsWith(c))) {
    return `'${value}`;
  }
  return value;
}

function escapeCell(raw: unknown): string {
  const value = raw === null || raw === undefined ? "" : String(raw);
  const sanitized = sanitizeCsvCell(value);
  if (/[",\n\r]/.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(","));
  return lines.join("\r\n") + "\r\n";
}
