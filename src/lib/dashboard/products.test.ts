import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));

import { filterProducts, localizedName, productQuality, productVisibility, type OwnerProduct, type ProductFilters } from "./products";

const product = (patch: Partial<OwnerProduct> & { id: string }): OwnerProduct => ({
  company_id: "c1",
  name: patch.id,
  name_en: null,
  name_fr: null,
  description: null,
  description_en: null,
  description_fr: null,
  category_id: null,
  images: [],
  specs: null,
  price: null,
  price_currency: "USD",
  sale_unit: null,
  min_order_quantity: null,
  is_published: true,
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
  categories: null,
  ...patch,
});

const NO_FILTER: ProductFilters = { search: "", categoryId: "", visibility: "all", sort: "recent" };

describe("productVisibility", () => {
  it("is live only when published AND the company is verified", () => {
    expect(productVisibility({ is_published: true }, "verified")).toBe("live");
    expect(productVisibility({ is_published: true }, "pending")).toBe("awaiting");
    expect(productVisibility({ is_published: true }, undefined)).toBe("awaiting");
  });

  it("is hidden whenever the seller switched it off, verified or not", () => {
    expect(productVisibility({ is_published: false }, "verified")).toBe("hidden");
    expect(productVisibility({ is_published: false }, "pending_documents")).toBe("hidden");
  });
});

describe("productQuality", () => {
  it("scores an empty listing at 0 and lists everything missing", () => {
    expect(productQuality(product({ id: "p" }))).toEqual({
      percent: 0,
      missing: ["photo", "gallery", "description", "category", "specs"],
    });
  });

  it("counts the longest description of either language, and only filled specs", () => {
    const quality = productQuality(
      product({
        id: "p",
        images: ["a"],
        description_fr: "x".repeat(150),
        description_en: "short",
        category_id: "cat",
        specs: { purity: 99.9, form: "cathode", packaging: "", note: null },
      })
    );
    expect(quality.missing).toEqual(["gallery", "specs"]);
    expect(quality.percent).toBe(60);
  });

  it("reaches 100 with three photos, a real description, a category and three specs", () => {
    const quality = productQuality(
      product({ id: "p", images: ["a", "b", "c"], description_en: "x".repeat(150), category_id: "cat", specs: { a: 1, b: "2", c: true } })
    );
    expect(quality).toEqual({ percent: 100, missing: [] });
  });
});

describe("localizedName", () => {
  it("prefers the reader's language and falls back to the other one", () => {
    const p = product({ id: "p", name: "legacy", name_fr: "Café", name_en: "Coffee" });
    expect(localizedName(p, "fr")).toBe("Café");
    expect(localizedName(p, "tr")).toBe("Coffee");
    expect(localizedName(product({ id: "p", name: "legacy", name_fr: "Café" }), "en")).toBe("Café");
    expect(localizedName(product({ id: "p", name: "legacy" }), "en")).toBe("legacy");
  });
});

describe("filterProducts", () => {
  const list = [
    product({ id: "a", name_fr: "Café arabica", name_en: "Arabica coffee", category_id: "coffee", created_at: "2026-09-03T00:00:00Z", images: ["1", "2", "3"] }),
    product({ id: "b", name_fr: "Cuivre cathode", name_en: "Copper cathode", category_id: "copper", created_at: "2026-09-02T00:00:00Z", is_published: false }),
    product({ id: "c", name_fr: "Cacao", name_en: "Cocoa", category_id: "cocoa", created_at: "2026-09-01T00:00:00Z" }),
  ];
  const ctx = { locale: "fr", companyStatus: "verified", metrics: { a: { views: 2, previous_views: 0, search_appearances: 0, series: [] }, c: { views: 9, previous_views: 0, search_appearances: 0, series: [] } } };
  const ids = (filters: Partial<ProductFilters>) => filterProducts(list, { ...NO_FILTER, ...filters }, ctx).map((p) => p.id);

  it("lists the most recent first by default", () => {
    expect(ids({})).toEqual(["a", "b", "c"]);
  });

  it("searches the name in either language, ignoring case", () => {
    expect(ids({ search: "COPPER" })).toEqual(["b"]);
    expect(ids({ search: "ca" })).toEqual(["a", "b", "c"]);
    expect(ids({ search: "zzz" })).toEqual([]);
  });

  it("filters by category and by what buyers can see", () => {
    expect(ids({ categoryId: "cocoa" })).toEqual(["c"]);
    expect(ids({ visibility: "hidden" })).toEqual(["b"]);
    expect(ids({ visibility: "live" })).toEqual(["a", "c"]);
    expect(filterProducts(list, { ...NO_FILTER, visibility: "awaiting" }, { ...ctx, companyStatus: "pending" }).map((p) => p.id)).toEqual(["a", "c"]);
  });

  it("sorts by name, by views, and weakest listing first", () => {
    expect(ids({ sort: "name" })).toEqual(["c", "a", "b"]);
    expect(ids({ sort: "views" })).toEqual(["c", "a", "b"]);
    // b and c have nothing (0 %), a has its photos (40 %): ties keep the most recent first.
    expect(ids({ sort: "quality" })).toEqual(["b", "c", "a"]);
  });

  it("does not reorder the list it was given", () => {
    filterProducts(list, { ...NO_FILTER, sort: "name" }, ctx);
    expect(list.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });
});
