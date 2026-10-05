import { describe, expect, it } from "vitest";
import {
  EMPTY_TERM,
  deletionBlockers,
  isHsCode,
  matchesTerm,
  missingLocales,
  moveTerm,
  parseChangeAction,
  slugifyTerm,
  summarize,
  termName,
  validateTerm,
  type CategoryTerm,
  type SectorTerm,
  type TaxonomyOverview,
} from "./terms";

const sector = (over: Partial<SectorTerm> = {}): SectorTerm => ({
  id: "s1",
  slug: "food-beverages",
  sort_order: 10,
  name_en: "Food & Beverages",
  name_fr: "Alimentation & Boissons",
  name_es: null,
  name_tr: null,
  name_zh: null,
  usage: { categories: 0, companies: 0, opportunities: 0, content: 0, reports: 0, prices: 0, hs_codes: 0, sub_sectors: 0 },
  ...over,
});

const category = (over: Partial<CategoryTerm> = {}): CategoryTerm => ({
  id: "c1",
  slug: "coffee",
  sort_order: 10,
  sector_id: "s1",
  name_en: "Coffee",
  name_fr: "Café",
  name_es: "Café",
  name_tr: "Kahve",
  name_zh: "咖啡",
  usage: { products: 0, services: 0, spec_fields: 0 },
  ...over,
});

describe("slugifyTerm", () => {
  it("never leaves a double dash or an accent", () => {
    expect(slugifyTerm("Food & Beverages")).toBe("food-beverages");
    expect(slugifyTerm("  Pétrole & Gaz  ")).toBe("petrole-gaz");
    expect(slugifyTerm("Iron-Ore (raw)")).toBe("iron-ore-raw");
  });

  it("returns nothing for a name with no latin letter or digit", () => {
    expect(slugifyTerm("咖啡")).toBe("");
  });
});

describe("isHsCode", () => {
  it("accepts chapters, headings and dotted sub-headings", () => {
    expect(isHsCode("09")).toBe(true);
    expect(isHsCode("0901")).toBe(true);
    expect(isHsCode("0901.21")).toBe(true);
    expect(isHsCode("2603.00.00.10")).toBe(true);
  });

  it("refuses anything else", () => {
    expect(isHsCode("9")).toBe(false);
    expect(isHsCode("09.")).toBe(false);
    expect(isHsCode("09..01")).toBe(false);
    expect(isHsCode("coffee")).toBe(false);
    expect(isHsCode("12345678901")).toBe(false);
  });
});

describe("names and translations", () => {
  it("falls back to English when a language is missing", () => {
    expect(termName(sector(), "fr")).toBe("Alimentation & Boissons");
    expect(termName(sector(), "zh")).toBe("Food & Beverages");
    expect(termName(sector({ name_es: "  " }), "es")).toBe("Food & Beverages");
  });

  it("lists the optional languages still missing", () => {
    expect(missingLocales(sector())).toEqual(["es", "tr", "zh"]);
    expect(missingLocales(sector({ name_es: "Alimentos", name_zh: " " }))).toEqual(["tr", "zh"]);
    expect(missingLocales(category())).toEqual([]);
  });
});

describe("matchesTerm", () => {
  it("searches every language and the identifier, ignoring case and accents", () => {
    expect(matchesTerm(category(), "cafe")).toBe(true);
    expect(matchesTerm(category(), "KAHVE")).toBe(true);
    expect(matchesTerm(category(), "咖")).toBe(true);
    expect(matchesTerm(sector(), "food-bev")).toBe(true);
    expect(matchesTerm(sector(), "mining")).toBe(false);
    expect(matchesTerm(sector(), "   ")).toBe(true);
  });
});

describe("deletionBlockers", () => {
  it("lets an unused entry go", () => {
    expect(deletionBlockers("sectors", sector().usage)).toEqual([]);
  });

  it("names what still uses a sector", () => {
    const usage = { ...sector().usage, categories: 5, companies: 5, opportunities: 2 };
    expect(deletionBlockers("sectors", usage)).toEqual([
      { key: "categories", count: 5 },
      { key: "companies", count: 5 },
      { key: "opportunities", count: 2 },
    ]);
  });

  it("does not count a category's own specification template", () => {
    expect(deletionBlockers("categories", { products: 0, services: 0, spec_fields: 8 })).toEqual([]);
    expect(deletionBlockers("categories", { products: 3, services: 0, spec_fields: 8 })).toEqual([{ key: "products", count: 3 }]);
  });
});

describe("validateTerm", () => {
  const named = { ...EMPTY_TERM, name_en: "Coffee", name_fr: "Café" };

  it("requires English and French, nothing else", () => {
    expect(validateTerm("sectors", EMPTY_TERM, true)).toEqual({ name_en: "required", name_fr: "required" });
    expect(validateTerm("sectors", named, true)).toEqual({});
  });

  it("requires a sector for a category", () => {
    expect(validateTerm("categories", named, true)).toEqual({ sector_id: "required" });
    expect(validateTerm("categories", { ...named, sector_id: "s1" }, true)).toEqual({});
    expect(validateTerm("hs_codes", { ...named, code: "0901" }, true)).toEqual({});
  });

  it("refuses a name that cannot give an identifier", () => {
    expect(validateTerm("tags", { ...EMPTY_TERM, name_en: "咖啡", name_fr: "Café" }, true)).toEqual({ slug: "invalid" });
    expect(validateTerm("tags", { ...EMPTY_TERM, name_en: "咖啡", name_fr: "Café", slug: "coffee" }, true)).toEqual({});
    // Once created the identifier is frozen: nothing to check.
    expect(validateTerm("tags", { ...EMPTY_TERM, name_en: "咖啡", name_fr: "Café" }, false)).toEqual({});
  });

  it("checks the HS code only at creation, the parent always", () => {
    expect(validateTerm("hs_codes", named, true)).toEqual({ code: "required" });
    expect(validateTerm("hs_codes", { ...named, code: "coffee" }, true)).toEqual({ code: "invalid" });
    expect(validateTerm("hs_codes", named, false)).toEqual({});
    expect(validateTerm("hs_codes", { ...named, code: "0901", parent_code: "0901" }, true)).toEqual({ parent_code: "invalid" });
    expect(validateTerm("hs_codes", { ...named, code: "0901", parent_code: "09" }, true)).toEqual({});
  });

  it("caps the length of a name", () => {
    expect(validateTerm("sectors", { ...named, name_es: "x".repeat(81) }, false)).toEqual({ name_es: "too_long" });
  });
});

describe("moveTerm", () => {
  it("swaps with the neighbour", () => {
    expect(moveTerm(["a", "b", "c"], "b", -1)).toEqual(["b", "a", "c"]);
    expect(moveTerm(["a", "b", "c"], "b", 1)).toEqual(["a", "c", "b"]);
  });

  it("refuses to leave the list", () => {
    expect(moveTerm(["a", "b"], "a", -1)).toBeNull();
    expect(moveTerm(["a", "b"], "b", 1)).toBeNull();
    expect(moveTerm(["a", "b"], "z", 1)).toBeNull();
  });
});

describe("summarize", () => {
  it("counts what staff should look at first", () => {
    const overview: TaxonomyOverview = {
      can_delete: false,
      companies_without_sector: 12,
      sectors: [sector({ usage: { ...sector().usage, categories: 1 } }), sector({ id: "s2", name_es: "x", name_tr: "x", name_zh: "x" })],
      categories: [category(), category({ id: "c2", name_zh: null })],
      hs_codes: [],
      tags: [],
      history: [],
    };
    expect(summarize(overview)).toEqual({
      sectors: 2,
      categories: 2,
      untranslated: 2,
      sectorsWithoutCategory: 1,
      companiesWithoutSector: 12,
    });
  });
});

describe("parseChangeAction", () => {
  it("reads the trigger's action key", () => {
    expect(parseChangeAction("taxonomy.category_spec_fields.delete")).toEqual({ table: "category_spec_fields", verb: "delete" });
    expect(parseChangeAction("user.role.change")).toBeNull();
  });
});
