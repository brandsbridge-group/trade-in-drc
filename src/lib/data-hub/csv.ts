// Robust CSV parsing for the price-point uploader. Handles:
//   - an optional header row (e.g. "observed_at,value" or "Date,Price")
//   - quoted fields with embedded commas / escaped double-quotes ("1,234.5")
//   - thousands separators in the numeric column ("1,234.50" or "1 234,50")
//   - comment lines starting with "#" and blank lines
//
// Designed to be exercised by unit tests, so it returns a structured result
// rather than throwing, and never silently drops malformed rows.

export interface ParsedPricePoint {
  observed_at: string; // ISO timestamp
  value: number;
}

export interface CsvParseResult {
  rows: ParsedPricePoint[];
  errors: { line: number; reason: "columns" | "date" | "value" }[];
}

const HEADER_DATE_TOKENS = ["date", "observed_at", "observed", "day", "month", "période", "periode"];
const HEADER_VALUE_TOKENS = ["value", "price", "prix", "valeur", "amount", "montant"];

/** Split a single CSV line into fields, honoring double-quoted fields. */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        // Escaped quote ("") inside a quoted field.
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

/** True if the first row looks like a header rather than a data row. */
function looksLikeHeader(fields: string[]): boolean {
  if (fields.length < 2) return false;
  const a = fields[0].toLowerCase();
  const b = fields[1].toLowerCase();
  const dateHeader = HEADER_DATE_TOKENS.some((tok) => a.includes(tok));
  const valueHeader = HEADER_VALUE_TOKENS.some((tok) => b.includes(tok));
  if (dateHeader || valueHeader) return true;
  // Fall back to: first field isn't a parseable date AND second isn't a number.
  const dateParsed = !Number.isNaN(new Date(fields[0]).getTime());
  const numParsed = parseLooseNumber(fields[1]) !== null;
  return !dateParsed && !numParsed;
}

/**
 * Parse a number that may carry thousands separators and either a "." or ","
 * decimal mark. Returns null when the token is not a finite number.
 */
export function parseLooseNumber(raw: string): number | null {
  let s = raw.replace(/\s+/g, "").trim();
  if (s.length === 0) return null;
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    // The right-most separator is the decimal mark; the other groups thousands.
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    // A lone comma: decimal mark if it splits the trailing 1-2 digits, else thousands.
    const parts = s.split(",");
    const last = parts[parts.length - 1];
    if (parts.length === 2 && last.length > 0 && last.length <= 2) {
      s = `${parts[0]}.${last}`;
    } else {
      s = parts.join("");
    }
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function parsePriceCsv(input: string): CsvParseResult {
  const result: CsvParseResult = { rows: [], errors: [] };
  const rawLines = input
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (rawLines.length === 0) return result;

  let startIndex = 0;
  const firstFields = splitCsvLine(rawLines[0]);
  if (looksLikeHeader(firstFields)) startIndex = 1;

  for (let i = startIndex; i < rawLines.length; i++) {
    const lineNo = i + 1;
    const fields = splitCsvLine(rawLines[i]);
    if (fields.length < 2) {
      result.errors.push({ line: lineNo, reason: "columns" });
      continue;
    }
    const parsedDate = new Date(fields[0]);
    if (Number.isNaN(parsedDate.getTime())) {
      result.errors.push({ line: lineNo, reason: "date" });
      continue;
    }
    const value = parseLooseNumber(fields[1]);
    if (value === null) {
      result.errors.push({ line: lineNo, reason: "value" });
      continue;
    }
    result.rows.push({ observed_at: parsedDate.toISOString(), value });
  }

  return result;
}
