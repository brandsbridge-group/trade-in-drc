import { describe, it, expect } from "vitest";
import { companySlugBase, resolveSlugCollision, generateCompanySlug } from "./company-slug";

// P2-9: companies.slug was never generated on registration, so
// /trust/[companySlug] could never resolve for a newly registered company.
// The real fix runs as a Postgres trigger (00042_companies_slug_trigger.sql);
// this file is a pure-TS mirror of that trigger's algorithm, tested here
// because the trigger itself can't run under Vitest.

describe("companySlugBase", () => {
  it("kebab-cases a simple company name", () => {
    expect(companySlugBase("Acme Trading Ltd", "id-1")).toBe("acme-trading-ltd");
  });

  it("strips accented characters common in French company names", () => {
    // The exact class of bug this migration fixes: a naive regexp_replace
    // without unaccent() turns each accented letter into its own hyphen
    // (e.g. "soci-t-g-n-rale"), not a readable slug.
    expect(companySlugBase("Société Générale du Congo", "id-1")).toBe(
      "societe-generale-du-congo"
    );
    expect(companySlugBase("Café Import-Export SARL", "id-2")).toBe(
      "cafe-import-export-sarl"
    );
    expect(companySlugBase("Établissements Ndjoli & Fils", "id-3")).toBe(
      "etablissements-ndjoli-fils"
    );
  });

  // Code-review finding, 2026-08-27: this file's header used to claim
  // byte-for-byte parity with the SQL trigger's `unaccent()`-based base
  // slug. It is NOT parity — `.normalize("NFD")` (slug.ts) only decomposes
  // precomposed accented letters, while Postgres's `unaccent` extension
  // also transliterates letters with no NFD decomposition at all (ß, Ø/ø,
  // Æ/æ, ...). Pin the known divergence so nobody mistakes this TS helper
  // as authoritative for what the trigger will actually assign — these
  // MUST stay failing-different from the SQL trigger's real output
  // (00042_companies_slug_trigger.sql), not be "fixed" to match it, unless
  // Postgres's full unaccent.rules table is ported into TS too.
  it("DIVERGES from the SQL trigger for letters with no NFD decomposition (documented, not a bug to silently fix)", () => {
    // SQL trigger (extensions.unaccent): "orsted-ltd" — Ø unaccents to O.
    expect(companySlugBase("Ørsted Ltd", "id-4")).toBe("rsted-ltd");
    // SQL trigger: "weiss-gmbh" — unaccent expands ß to "ss".
    expect(companySlugBase("Weiß GmbH", "id-5")).toBe("wei-gmbh");
  });

  it("falls back to a fallback-id-derived slug when the name yields nothing usable", () => {
    expect(companySlugBase("!!!---???", "abcd-1234-efgh")).toBe(
      "company-abcd1234efgh"
    );
    expect(companySlugBase("", "abcd-1234")).toBe("company-abcd1234");
  });
});

describe("resolveSlugCollision", () => {
  it("returns the base slug unchanged when it's free", () => {
    expect(resolveSlugCollision("acme-trading", new Set())).toBe("acme-trading");
  });

  it("appends -2 on the first collision", () => {
    expect(resolveSlugCollision("acme-trading", new Set(["acme-trading"]))).toBe(
      "acme-trading-2"
    );
  });

  it("walks the numeric suffix upward until a free slug is found", () => {
    const taken = new Set(["acme-trading", "acme-trading-2", "acme-trading-3"]);
    expect(resolveSlugCollision("acme-trading", taken)).toBe("acme-trading-4");
  });

  it("does not collide with a differently-suffixed slug that merely shares a prefix", () => {
    // "acme-trading-20" existing must not block "acme-trading-2".
    const taken = new Set(["acme-trading", "acme-trading-20"]);
    expect(resolveSlugCollision("acme-trading", taken)).toBe("acme-trading-2");
  });
});

describe("generateCompanySlug (end-to-end)", () => {
  it("produces a collision-free, accent-stripped slug in one call", () => {
    const existing = new Set(["societe-generale-du-congo"]);
    expect(generateCompanySlug("Société Générale du Congo", "id-2", existing)).toBe(
      "societe-generale-du-congo-2"
    );
  });

  it("two applicants registering the same company name never collide", () => {
    const existing = new Set<string>();
    const first = generateCompanySlug("Kivu Mining SARL", "id-1", existing);
    existing.add(first);
    const second = generateCompanySlug("Kivu Mining SARL", "id-2", existing);
    existing.add(second);
    const third = generateCompanySlug("Kivu Mining SARL", "id-3", existing);

    expect(new Set([first, second, third]).size).toBe(3);
    expect(first).toBe("kivu-mining-sarl");
    expect(second).toBe("kivu-mining-sarl-2");
    expect(third).toBe("kivu-mining-sarl-3");
  });
});
