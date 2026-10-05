import { describe, expect, it } from "vitest";
import {
  NO_COMPANY_FILTERS,
  companyInitials,
  companyOrigin,
  companyViewCounts,
  filterCompanies,
  premiumActive,
  sortCompanies,
  summarizeCompanies,
  type ConsoleCompanyRow,
} from "./companies";

const NOW = new Date("2026-10-05T12:00:00Z");

const company = (over: Partial<ConsoleCompanyRow> = {}): ConsoleCompanyRow => ({
  id: "c1",
  name: "Kivu Coffee Cooperative",
  logoUrl: null,
  city: "Goma",
  country: "Democratic Republic of the Congo",
  sectorName: "Agriculture",
  status: "verified",
  stage: "verified",
  verificationTier: "verified",
  isPremium: false,
  premiumPlan: null,
  premiumExpiresAt: null,
  productCount: 3,
  ownerName: "Aline Mukendi",
  ownerEmail: "aline@example.com",
  createdAt: "2026-09-01T10:00:00Z",
  ...over,
});

describe("companyOrigin", () => {
  it("treats a missing country as the DRC", () => {
    expect(companyOrigin(null)).toBe("drc");
    expect(companyOrigin("Democratic Republic of the Congo")).toBe("drc");
    expect(companyOrigin("Belgium")).toBe("intl");
  });
});

describe("premiumActive", () => {
  it("needs the flag and an end date still ahead", () => {
    expect(premiumActive(company(), NOW)).toBe(false);
    expect(premiumActive(company({ isPremium: true }), NOW)).toBe(true);
    expect(premiumActive(company({ isPremium: true, premiumExpiresAt: "2026-12-01T00:00:00Z" }), NOW)).toBe(true);
    expect(premiumActive(company({ isPremium: true, premiumExpiresAt: "2026-10-01T00:00:00Z" }), NOW)).toBe(false);
  });
});

describe("views", () => {
  const rows = [
    company(),
    company({ id: "c2", status: "pending", stage: "to_review" }),
    company({ id: "c3", status: "pending", stage: "awaiting_owner" }),
    company({ id: "c4", status: "pending_documents", stage: "not_submitted" }),
  ];

  it("counts each company once, under its stage", () => {
    expect(companyViewCounts(rows)).toEqual({ all: 4, to_review: 1, awaiting_owner: 1, not_submitted: 1, verified: 1, rejected: 0 });
  });

  it("separates a file waiting on staff from one waiting on the company", () => {
    expect(filterCompanies(rows, { ...NO_COMPANY_FILTERS, view: "to_review" }, NOW).map((r) => r.id)).toEqual(["c2"]);
    expect(filterCompanies(rows, { ...NO_COMPANY_FILTERS, view: "awaiting_owner" }, NOW).map((r) => r.id)).toEqual(["c3"]);
  });
});

describe("filterCompanies", () => {
  const rows = [
    company(),
    company({ id: "c2", name: "Société Minière du Katanga", city: "Lubumbashi", sectorName: "Mines & Minéraux", ownerName: null, ownerEmail: "direction@smk.cd" }),
    company({ id: "c3", name: "Antwerp Trading", city: "Antwerp", country: "Belgium", sectorName: null, isPremium: true, ownerName: "Jan Peeters", ownerEmail: "jan@antwerp.example" }),
  ];
  const ids = (filters: Partial<typeof NO_COMPANY_FILTERS>) => filterCompanies(rows, { ...NO_COMPANY_FILTERS, ...filters }, NOW).map((r) => r.id);

  it("searches the name, the place, the sector and the owner, ignoring accents", () => {
    expect(ids({ query: "societe miniere" })).toEqual(["c2"]);
    expect(ids({ query: "GOMA" })).toEqual(["c1"]);
    expect(ids({ query: "smk.cd" })).toEqual(["c2"]);
    expect(ids({ query: "mukendi" })).toEqual(["c1"]);
    expect(ids({ query: "belgium" })).toEqual(["c3"]);
    expect(ids({ query: "nothing" })).toEqual([]);
  });

  it("combines sector, origin and premium", () => {
    expect(ids({ sector: "Agriculture" })).toEqual(["c1"]);
    expect(ids({ origin: "intl" })).toEqual(["c3"]);
    expect(ids({ origin: "drc" })).toEqual(["c1", "c2"]);
    expect(ids({ premiumOnly: true })).toEqual(["c3"]);
    expect(ids({ premiumOnly: true, origin: "drc" })).toEqual([]);
  });
});

describe("sortCompanies", () => {
  const rows = [
    company({ id: "a", name: "Zeta", createdAt: "2026-09-03T00:00:00Z", productCount: 1 }),
    company({ id: "b", name: "élan", createdAt: "2026-09-01T00:00:00Z", productCount: 9 }),
    company({ id: "c", name: "Alpha", createdAt: "2026-09-02T00:00:00Z", productCount: 1 }),
  ];

  it("orders by date, name or number of products without touching the input", () => {
    expect(sortCompanies(rows, "recent", "fr").map((r) => r.id)).toEqual(["a", "c", "b"]);
    expect(sortCompanies(rows, "name", "fr").map((r) => r.id)).toEqual(["c", "b", "a"]);
    expect(sortCompanies(rows, "products", "fr").map((r) => r.id)).toEqual(["b", "a", "c"]);
    expect(rows.map((r) => r.id)).toEqual(["a", "b", "c"]);
  });
});

describe("companyInitials", () => {
  it("keeps the first two words", () => {
    expect(companyInitials("Kivu Coffee Cooperative")).toBe("KC");
    expect(companyInitials("  smk  ")).toBe("S");
    expect(companyInitials("")).toBe("");
  });
});

describe("summarizeCompanies", () => {
  it("feeds the tiles from the same rules as the views", () => {
    const rows = [
      company(),
      company({ id: "c2", status: "pending", stage: "to_review" }),
      company({ id: "c3", country: "Belgium", isPremium: true }),
      company({ id: "c4", isPremium: true, premiumExpiresAt: "2026-01-01T00:00:00Z" }),
    ];
    expect(summarizeCompanies(rows, NOW)).toEqual({ total: 4, toReview: 1, verified: 3, verifiedRate: 75, premium: 1, drc: 3, intl: 1 });
    expect(summarizeCompanies([], NOW).verifiedRate).toBe(0);
  });
});
