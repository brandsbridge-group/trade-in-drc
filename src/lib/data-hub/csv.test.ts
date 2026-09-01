import { describe, it, expect } from "vitest";
import { parsePriceCsv, parseLooseNumber } from "./csv";

describe("parseLooseNumber", () => {
  it("parses plain integers and decimals", () => {
    expect(parseLooseNumber("1234")).toBe(1234);
    expect(parseLooseNumber("1234.5")).toBe(1234.5);
  });
  it("strips US-style thousands separators", () => {
    expect(parseLooseNumber("1,234")).toBe(1234);
    expect(parseLooseNumber("1,234,567.89")).toBe(1234567.89);
  });
  it("handles European decimal comma", () => {
    expect(parseLooseNumber("1234,5")).toBe(1234.5);
    expect(parseLooseNumber("1.234,56")).toBe(1234.56);
  });
  it("handles space thousands separators", () => {
    expect(parseLooseNumber("1 234 567")).toBe(1234567);
  });
  it("rejects non-numbers", () => {
    expect(parseLooseNumber("abc")).toBeNull();
    expect(parseLooseNumber("")).toBeNull();
  });
});

describe("parsePriceCsv", () => {
  it("parses a plain two-column CSV", () => {
    const { rows, errors } = parsePriceCsv("2024-01-01,1234.5\n2024-02-01,1300");
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows[0].value).toBe(1234.5);
    expect(rows[0].observed_at.startsWith("2024-01-01")).toBe(true);
  });
  it("skips a header row", () => {
    const { rows } = parsePriceCsv("Date,Price\n2024-01-01,1000");
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBe(1000);
  });
  it("handles quoted fields with embedded commas as thousands", () => {
    const { rows, errors } = parsePriceCsv('observed_at,value\n2024-03-01,"1,234.50"');
    expect(errors).toHaveLength(0);
    expect(rows[0].value).toBe(1234.5);
  });
  it("ignores comments and blank lines", () => {
    const { rows } = parsePriceCsv("# header note\n\n2024-01-01,100\n# trailing\n");
    expect(rows).toHaveLength(1);
  });
  it("records errors for malformed rows without dropping good ones", () => {
    const { rows, errors } = parsePriceCsv("2024-01-01,100\nnot-a-date,5\n2024-02-01,abc");
    expect(rows).toHaveLength(1);
    expect(errors).toHaveLength(2);
    expect(errors[0].reason).toBe("date");
    expect(errors[1].reason).toBe("value");
  });
  it("returns empty result for empty input", () => {
    expect(parsePriceCsv("").rows).toHaveLength(0);
  });
});
