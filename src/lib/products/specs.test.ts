import { describe, expect, it } from "vitest";
import {
  buildSpecs,
  rebaseSpecs,
  slugifySpecKey,
  specEntries,
  splitSpecs,
  toSpecFields,
  type SpecField,
} from "./specs";

const field = (patch: Partial<SpecField> & { key: string }): SpecField => ({
  label_en: patch.key,
  label_fr: patch.key,
  field_type: "text",
  unit: null,
  options: [],
  required: false,
  sort_order: 0,
  ...patch,
});

const COFFEE: SpecField[] = [
  field({ key: "variety", label_en: "Variety", label_fr: "Variété", required: true, sort_order: 10 }),
  field({ key: "altitude", label_en: "Altitude", label_fr: "Altitude", field_type: "number", unit: "m", sort_order: 20 }),
  field({
    key: "process",
    label_en: "Process",
    label_fr: "Procédé",
    field_type: "select",
    options: [
      { value: "washed", label_en: "Washed", label_fr: "Lavé" },
      { value: "natural", label_en: "Natural", label_fr: "Nature" },
    ],
    sort_order: 30,
  }),
  field({ key: "organic", label_en: "Organic", label_fr: "Bio", field_type: "boolean", sort_order: 40 }),
];

describe("slugifySpecKey", () => {
  it("makes a stable snake_case key out of a label", () => {
    expect(slugifySpecKey("Moisture content (%)")).toBe("moisture_content");
    expect(slugifySpecKey("Taux d'humidité")).toBe("taux_d_humidite");
    expect(slugifySpecKey("  2nd grade ")).toBe("nd_grade");
    expect(slugifySpecKey("%%%")).toBe("");
  });
});

describe("toSpecFields", () => {
  it("normalizes rows, orders them and drops malformed options", () => {
    const fields = toSpecFields([
      { key: "b", label_en: "B", label_fr: "", field_type: "weird", sort_order: 20, options: null },
      { key: "a", label_en: "A", label_fr: "Â", field_type: "select", sort_order: 10, options: [{ value: "x", label_en: "X" }, { nope: 1 }] },
      { label_en: "no key" },
    ]);
    expect(fields.map((f) => f.key)).toEqual(["a", "b"]);
    expect(fields[0].options).toEqual([{ value: "x", label_en: "X", label_fr: "X" }]);
    expect(fields[1]).toMatchObject({ field_type: "text", label_fr: "B" });
    expect(toSpecFields(null)).toEqual([]);
  });
});

describe("specEntries", () => {
  const specs = { process: "washed", altitude: 1800, variety: "Bourbon", organic: true, Humidité: "11 %", empty: "  " };

  it("prints template fields first, in template order, localized, with unit and option label", () => {
    expect(specEntries(specs, { fields: COFFEE, locale: "fr", yes: "Oui", no: "Non" })).toEqual([
      { label: "Variété", value: "Bourbon" },
      { label: "Altitude", value: "1800 m" },
      { label: "Procédé", value: "Lavé" },
      { label: "Bio", value: "Oui" },
      { label: "Humidité", value: "11 %" },
    ]);
  });

  it("still reads products written before templates existed", () => {
    expect(specEntries({ form: "cathode", purity: "99.99%", lead_time: 30, nested: { a: 1 } })).toEqual([
      { label: "Form", value: "cathode" },
      { label: "Purity", value: "99.99%" },
      { label: "Lead time", value: "30" },
    ]);
    expect(specEntries(null)).toEqual([]);
    expect(specEntries(["a"])).toEqual([]);
  });
});

describe("splitSpecs", () => {
  it("separates template values from free lines without dropping anything", () => {
    const { values, custom } = splitSpecs({ variety: "Bourbon", altitude: 1800, purity: "99.99%" }, COFFEE);
    expect(values).toEqual({ variety: "Bourbon", altitude: "1800" });
    expect(custom.map((c) => [c.label, c.value])).toEqual([["Purity", "99.99%"]]);
  });
});

describe("buildSpecs", () => {
  const row = (id: string, label: string, value: string) => ({ id, label, value });

  it("stores numbers raw, booleans as booleans and free lines under their label", () => {
    const result = buildSpecs({
      fields: COFFEE,
      values: { variety: " Bourbon ", altitude: "1800,5", process: "washed", organic: "false" },
      custom: [row("r1", "Humidité", "11 %"), row("r2", "", "")],
    });
    expect(result).toEqual({
      ok: true,
      specs: { variety: "Bourbon", altitude: 1800.5, process: "washed", organic: false, Humidité: "11 %" },
    });
  });

  it("refuses a missing required field, a non-number and a half-filled line", () => {
    const result = buildSpecs({
      fields: COFFEE,
      values: { altitude: "high" },
      custom: [row("r1", "Humidité", "")],
    });
    expect(result).toMatchObject({ ok: false, missing: ["variety"], invalidNumbers: ["altitude"], incompleteRows: ["r1"] });
  });

  it("refuses a free line named like a template field or like another line", () => {
    const result = buildSpecs({
      fields: COFFEE,
      values: { variety: "Bourbon" },
      custom: [row("r1", "Variété", "Typica"), row("r2", "Origine", "Kivu"), row("r3", "origine", "Ituri")],
    });
    expect(result).toMatchObject({ ok: false, duplicates: ["r1", "r3"] });
  });
});

describe("rebaseSpecs", () => {
  const COPPER: SpecField[] = [
    field({ key: "purity", label_en: "Purity", label_fr: "Pureté", sort_order: 10 }),
    field({ key: "variety", label_en: "Variety", label_fr: "Variété", sort_order: 20 }),
  ];

  it("keeps shared fields, turns orphaned values into free lines and adopts matching lines", () => {
    const { values, custom } = rebaseSpecs({
      previousFields: COFFEE,
      nextFields: COPPER,
      values: { variety: "Bourbon", altitude: "1800" },
      custom: [{ id: "r1", label: "Pureté", value: "99.99%" }, { id: "r2", label: "Emballage", value: "Sacs" }],
      locale: "fr",
    });
    expect(values).toEqual({ variety: "Bourbon", purity: "99.99%" });
    expect(custom.map((c) => [c.label, c.value])).toEqual([
      ["Altitude", "1800 m"],
      ["Emballage", "Sacs"],
    ]);
  });
});
