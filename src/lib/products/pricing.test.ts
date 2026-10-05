import { describe, expect, it } from "vitest";
import { buildPricing, EMPTY_PRICING_FORM, formatPrice, parseAmount, pricingDisplay, pricingOf, pricingToForm, type PricingTranslator } from "./pricing";

const t: PricingTranslator = Object.assign(
  (key: string, values?: Record<string, string | number>) =>
    key === "quantity.kg" ? `${values?.count} kg` : key === "units.kg" ? "kg" : key,
  { has: (key: string) => key === "quantity.kg" || key === "units.kg" }
);

describe("parseAmount", () => {
  it("reads what a person types", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("  ")).toBeNull();
    expect(parseAmount("4,5")).toBe(4.5);
    expect(parseAmount("1 250.00")).toBe(1250);
    expect(parseAmount("0")).toBe(0);
    expect(parseAmount("3.456")).toBe(3.46);
  });

  it("flags what is not an amount", () => {
    expect(parseAmount("abc")).toBeNaN();
    expect(parseAmount("-4")).toBeNaN();
    expect(parseAmount("1.2.3")).toBeNaN();
  });
});

describe("buildPricing", () => {
  it("saves nothing when nothing is typed, even with a unit picked", () => {
    expect(buildPricing({ ...EMPTY_PRICING_FORM, unit: "kg" })).toEqual({
      ok: true,
      pricing: { price: null, price_currency: "USD", sale_unit: null, min_order_quantity: null },
    });
  });

  it("keeps a price and a minimum order with their unit", () => {
    expect(buildPricing({ price: "4,50", currency: "EUR", unit: "kg", minOrder: "500" })).toEqual({
      ok: true,
      pricing: { price: 4.5, price_currency: "EUR", sale_unit: "kg", min_order_quantity: 500 },
    });
  });

  it("refuses a figure without its unit, an invalid amount and a zero minimum", () => {
    expect(buildPricing({ ...EMPTY_PRICING_FORM, price: "4" })).toEqual({ ok: false, errors: ["unit"] });
    expect(buildPricing({ price: "x", currency: "USD", unit: "kg", minOrder: "0" })).toEqual({
      ok: false,
      errors: ["price", "minOrder"],
    });
  });
});

describe("reading and printing", () => {
  it("round-trips a stored row through the form", () => {
    const row = { price: "12.50", price_currency: "CDF", sale_unit: "bag", min_order_quantity: 20 };
    expect(pricingToForm(pricingOf(row))).toEqual({ price: "12.5", currency: "CDF", unit: "bag", minOrder: "20" });
    expect(pricingOf({})).toEqual({ price: null, price_currency: "USD", sale_unit: null, min_order_quantity: null });
  });

  it("drops cents only when there are none", () => {
    expect(formatPrice(1200, "USD", "en")).toBe("$1,200");
    expect(formatPrice(4.5, "USD", "en")).toBe("$4.50");
  });

  it("prints a price, its unit and the minimum order", () => {
    expect(pricingDisplay({ price: 4.5, price_currency: "USD", sale_unit: "kg", min_order_quantity: 500 }, t, "en")).toEqual({
      price: "$4.50",
      unit: "kg",
      minOrder: "500 kg",
    });
    expect(pricingDisplay({ sale_unit: null }, t, "en")).toEqual({ price: null, unit: null, minOrder: null });
  });
});
