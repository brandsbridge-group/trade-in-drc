import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ManifestSchema, type Manifest } from "../manifest.schema";

const validManifest: Manifest = {
  products: [
    {
      id: "d0000000-0000-0000-0000-000000000001",
      slug: "copper-cathode",
      queries: ["copper cathode", "refined copper"],
      override_url: null,
      alt_en: "Copper cathodes",
      alt_fr: "Cathodes de cuivre",
    },
  ],
  content: [
    {
      title_match_en: "DRC Copper Export Reaches Record High",
      queries: ["copper mine africa"],
      override_url: null,
      alt_en: "Copper mine",
    },
  ],
  companies: [
    {
      id: "c0000000-0000-0000-0000-000000000001",
      slug: "kct",
      initials: "KCT",
      name: "Katanga Copper Trading",
    },
  ],
};

describe("ManifestSchema", () => {
  it("accepts a valid manifest", () => {
    expect(() => ManifestSchema.parse(validManifest)).not.toThrow();
  });

  it("rejects a product entry with no queries and no override", () => {
    const bad = {
      ...validManifest,
      products: [{ ...validManifest.products[0], queries: [], override_url: null }],
    };
    expect(() => ManifestSchema.parse(bad)).toThrow();
  });

  it("rejects a company entry with empty initials", () => {
    const bad = {
      ...validManifest,
      companies: [{ ...validManifest.companies[0], initials: "" }],
    };
    expect(() => ManifestSchema.parse(bad)).toThrow();
  });

  it("rejects a product slug with uppercase letters", () => {
    const bad = {
      ...validManifest,
      products: [{ ...validManifest.products[0], slug: "Copper-Cathode" }],
    };
    expect(() => ManifestSchema.parse(bad)).toThrow();
  });

  it("accepts the non-conformant seed UUID format (zeros in version/variant)", () => {
    const m: Manifest = {
      products: [{
        id: "d0000000-0000-0000-0000-000000000001",
        slug: "x",
        queries: ["x"],
        override_url: null,
        alt_en: "x", alt_fr: "x",
      }],
      content: [],
      companies: [],
    };
    expect(() => ManifestSchema.parse(m)).not.toThrow();
  });

  it("rejects a truly malformed UUID", () => {
    const m = {
      products: [{
        id: "not-a-uuid",
        slug: "x",
        queries: ["x"],
        override_url: null,
        alt_en: "x", alt_fr: "x",
      }],
      content: [],
      companies: [],
    };
    expect(() => ManifestSchema.parse(m)).toThrow();
  });
});

describe("manifest.json coverage", () => {
  const manifestPath = resolve(__dirname, "../manifest.json");
  const manifest = ManifestSchema.parse(JSON.parse(readFileSync(manifestPath, "utf8")));
  const seedSql = readFileSync(resolve(__dirname, "../../../supabase/seed.sql"), "utf8");

  it("every product UUID in manifest matches a row in seed.sql", () => {
    for (const p of manifest.products) {
      expect(seedSql, `product ${p.slug} (${p.id}) not in seed.sql`).toContain(p.id);
    }
  });

  it("every company UUID in manifest matches a row in seed.sql", () => {
    for (const c of manifest.companies) {
      expect(seedSql, `company ${c.slug} (${c.id}) not in seed.sql`).toContain(c.id);
    }
  });

  it("covers all 25 seeded products", () => {
    expect(manifest.products).toHaveLength(25);
  });

  it("covers all 15 seeded companies", () => {
    expect(manifest.companies).toHaveLength(15);
  });

  it("every content entry's title_match_en exists in seed.sql", () => {
    for (const c of manifest.content) {
      expect(seedSql).toContain(c.title_match_en);
    }
  });
});
