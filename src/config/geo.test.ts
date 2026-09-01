import { describe, it, expect } from "vitest";
import { COUNTRIES, COUNTRY_DIAL_CODE, DIAL_CODES, DEFAULT_DIAL_CODE, HOME_COUNTRY } from "./geo";

// A handful of territories genuinely have no ITU E.164 country calling code —
// uninhabited land, or pseudo-entries that aren't real countries at all. These
// are deliberately left out of COUNTRY_DIAL_CODE; everything else must be mapped.
const DELIBERATELY_UNMAPPED = new Set([
  "Antarctica",
  "Bouvet Island",
  "Clipperton Island",
  "European Union",
  "Eurozone",
  "French Southern Territories",
  "Heard & McDonald Islands",
  "Outlying Oceania",
  "Pitcairn Islands",
  "Pseudo-Accents",
  "Pseudo-Bidi",
  "U.S. Outlying Islands",
  "United Nations",
  "Unknown Region",
  "Other",
]);

describe("COUNTRY_DIAL_CODE coverage", () => {
  it("maps every dialable COUNTRIES entry", () => {
    const missing = COUNTRIES.filter(
      (c) => !(c in COUNTRY_DIAL_CODE) && !DELIBERATELY_UNMAPPED.has(c)
    );
    expect(missing).toEqual([]);
  });

  it("only omits the deliberately-unmapped territories, nothing else", () => {
    const mappedSet = new Set(Object.keys(COUNTRY_DIAL_CODE));
    const actuallyUnmapped = COUNTRIES.filter((c) => !mappedSet.has(c));
    expect(new Set(actuallyUnmapped)).toEqual(DELIBERATELY_UNMAPPED);
  });

  it("has no dial-code keys for countries outside COUNTRIES", () => {
    const countrySet = new Set<string>(COUNTRIES);
    const stray = Object.keys(COUNTRY_DIAL_CODE).filter((k) => !countrySet.has(k));
    expect(stray).toEqual([]);
  });

  it("every COUNTRY_DIAL_CODE value appears in DIAL_CODES", () => {
    const dialCodeSet = new Set(DIAL_CODES);
    const missing = Object.entries(COUNTRY_DIAL_CODE)
      .filter(([, code]) => !dialCodeSet.has(code))
      .map(([country, code]) => `${country} -> ${code}`);
    expect(missing).toEqual([]);
  });

  it("keeps DIAL_CODES free of duplicates", () => {
    expect(new Set(DIAL_CODES).size).toBe(DIAL_CODES.length);
  });

  it("pins the DRC default dial code first", () => {
    expect(DIAL_CODES[0]).toBe(DEFAULT_DIAL_CODE);
    expect(COUNTRY_DIAL_CODE[HOME_COUNTRY]).toBe(DEFAULT_DIAL_CODE);
  });
});
