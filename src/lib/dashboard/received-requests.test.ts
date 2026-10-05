import { describe, expect, it } from "vitest";
import {
  filterReceivedRequests,
  productLabel,
  receivedViewCounts,
  replyMailto,
  requestKind,
  unseenRequests,
} from "./received-requests";

describe("requestKind", () => {
  it("is a quote request when it is about a product", () => {
    expect(requestKind({ product_id: "p1", quantity: "12 t" })).toBe("quote");
  });

  it("stays a quote request when the product was deleted since", () => {
    expect(requestKind({ product_id: null, quantity: "12 t" })).toBe("quote");
  });

  it("is a contact request otherwise", () => {
    expect(requestKind({ product_id: null, quantity: null })).toBe("contact");
  });
});

describe("unseenRequests", () => {
  it("keeps only the requests the company has not opened", () => {
    const rows = [
      { id: "a", supplier_seen_at: null },
      { id: "b", supplier_seen_at: "2026-10-03T10:00:00Z" },
      { id: "c", supplier_seen_at: null },
    ];
    expect(unseenRequests(rows).map((r) => r.id)).toEqual(["a", "c"]);
  });
});

describe("filterReceivedRequests", () => {
  const blank = { company_name: null, country: null, reference: null, message: "", product_name: null, product_name_en: null, product_name_fr: null };
  const rows = [
    { ...blank, id: "a", product_id: "p1", quantity: "12 t", full_name: "Anke Vermeulen", email: "anke@example.com", product_name: "Cacao brut", country: "Belgique" },
    { ...blank, id: "b", product_id: null, quantity: null, full_name: "Rahul Mehta", email: "rahul@example.com", message: "Distribution in Mumbai" },
    { ...blank, id: "c", product_id: "p2", quantity: "3 t", full_name: "Lena Fischer", email: "lena@example.com", reference: "TIDRC-PR-2026-000031" },
  ];
  const newIds = new Set(["c"]);

  it("filters by tab", () => {
    const ids = (view: "all" | "new" | "quote" | "contact") =>
      filterReceivedRequests(rows, { view, query: "", newIds }).map((r) => r.id);
    expect(ids("all")).toEqual(["a", "b", "c"]);
    expect(ids("new")).toEqual(["c"]);
    expect(ids("quote")).toEqual(["a", "c"]);
    expect(ids("contact")).toEqual(["b"]);
  });

  it("searches the buyer, the product, the message and the reference, whatever the case", () => {
    const ids = (query: string) => filterReceivedRequests(rows, { view: "all", query, newIds }).map((r) => r.id);
    expect(ids("  ANKE ")).toEqual(["a"]);
    expect(ids("cacao")).toEqual(["a"]);
    expect(ids("mumbai")).toEqual(["b"]);
    expect(ids("000031")).toEqual(["c"]);
    expect(ids("nothing")).toEqual([]);
  });

  it("combines the tab and the search", () => {
    expect(filterReceivedRequests(rows, { view: "quote", query: "lena", newIds }).map((r) => r.id)).toEqual(["c"]);
  });

  it("counts each tab", () => {
    expect(receivedViewCounts(rows, newIds)).toEqual({ all: 3, new: 1, quote: 2, contact: 1 });
  });
});

describe("productLabel", () => {
  const names = { product_name: "Cacao brut", product_name_en: "Raw cocoa", product_name_fr: "Cacao brut bio" };

  it("uses the reader's language", () => {
    expect(productLabel(names, "fr")).toBe("Cacao brut bio");
    expect(productLabel(names, "en")).toBe("Raw cocoa");
  });

  it("falls back to the name as typed, and reads other languages in English", () => {
    expect(productLabel({ ...names, product_name_fr: " " }, "fr")).toBe("Cacao brut");
    expect(productLabel(names, "tr")).toBe("Raw cocoa");
  });

  it("is null when the product is gone", () => {
    expect(productLabel({ product_name: null, product_name_en: null, product_name_fr: null }, "fr")).toBeNull();
  });
});

describe("replyMailto", () => {
  it("encodes the subject", () => {
    expect(replyMailto("buyer@example.com", "Votre demande TIDRC-PR-2026-000012 & devis")).toBe(
      "mailto:buyer@example.com?subject=Votre%20demande%20TIDRC-PR-2026-000012%20%26%20devis"
    );
  });
});
