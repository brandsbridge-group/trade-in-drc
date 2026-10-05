/**
 * A product's price and minimum order (migration 00064): one selling unit
 * serves both figures — "4.50 USD per kg, minimum 500 kg". Pure helpers shared
 * by the seller's form, the dashboard and the public marketplace.
 */

/** Unit keys stored in `products.sale_unit`; labels live in `ProductPricing.units` / `.quantity`. */
export const SALE_UNITS = ["kg", "tonne", "litre", "piece", "bag", "carton", "pallet", "container", "m3", "m2"] as const;
export type SaleUnit = (typeof SALE_UNITS)[number];

export const PRICE_CURRENCIES = ["USD", "EUR", "CDF"] as const;
export type PriceCurrency = (typeof PRICE_CURRENCIES)[number];
export const DEFAULT_CURRENCY: PriceCurrency = "USD";

/** numeric(14,2): twelve digits before the decimal point. */
const MAX_AMOUNT = 999_999_999_999.99;

/** The four columns, as stored. */
export interface ProductPricing {
  price: number | null;
  price_currency: PriceCurrency;
  sale_unit: string | null;
  min_order_quantity: number | null;
}

/** The same four, as the form's inputs hold them. */
export interface PricingForm {
  price: string;
  currency: PriceCurrency;
  unit: string;
  minOrder: string;
}

export const EMPTY_PRICING_FORM: PricingForm = { price: "", currency: DEFAULT_CURRENCY, unit: "", minOrder: "" };

export function isCurrency(value: unknown): value is PriceCurrency {
  return PRICE_CURRENCIES.includes(value as PriceCurrency);
}

/** PostgREST returns `numeric` as a number, or as a string for large values. */
function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Reads the pricing columns off any product row (missing columns read as "not stated"). */
export function pricingOf(row: unknown): ProductPricing {
  const r = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;
  return {
    price: toNumber(r.price),
    price_currency: isCurrency(r.price_currency) ? r.price_currency : DEFAULT_CURRENCY,
    sale_unit: typeof r.sale_unit === "string" && r.sale_unit ? r.sale_unit : null,
    min_order_quantity: toNumber(r.min_order_quantity),
  };
}

export function pricingToForm(pricing: ProductPricing): PricingForm {
  return {
    price: pricing.price === null ? "" : String(pricing.price),
    currency: pricing.price_currency,
    unit: pricing.sale_unit ?? "",
    minOrder: pricing.min_order_quantity === null ? "" : String(pricing.min_order_quantity),
  };
}

/**
 * "4,5" and "1 250.00" are numbers to the person typing them: spaces are
 * dropped and a comma reads as the decimal separator. `null` = empty,
 * `NaN` = typed but not a number.
 */
export function parseAmount(text: string): number | null {
  const cleaned = text.replace(/[\s  ]/g, "").replace(",", ".");
  if (!cleaned) return null;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return Number.NaN;
  return Math.round(Number(cleaned) * 100) / 100;
}

export type PricingField = "price" | "minOrder" | "unit";

export type BuildPricingResult =
  | { ok: true; pricing: ProductPricing }
  | { ok: false; errors: PricingField[] };

/**
 * What gets saved. Both figures are optional; the save is refused when a
 * figure is not a valid amount, when the minimum order is zero, or when a
 * figure is given without the unit it is counted in.
 */
export function buildPricing(form: PricingForm): BuildPricingResult {
  const errors: PricingField[] = [];
  const price = parseAmount(form.price);
  const minOrder = parseAmount(form.minOrder);

  if (price !== null && (Number.isNaN(price) || price > MAX_AMOUNT)) errors.push("price");
  if (minOrder !== null && (Number.isNaN(minOrder) || minOrder <= 0 || minOrder > MAX_AMOUNT)) errors.push("minOrder");
  if ((price !== null || minOrder !== null) && !form.unit) errors.push("unit");
  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    pricing: {
      price,
      price_currency: form.currency,
      // A unit alone says nothing: it is only kept next to a figure.
      sale_unit: price !== null || minOrder !== null ? form.unit : null,
      min_order_quantity: minOrder,
    },
  };
}

/** "4,50 $US" / "1 250 000 FC": cents only when the amount has some. */
export function formatPrice(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Translator of the `ProductPricing` namespace, as both `useTranslations` and `getTranslations` return it. */
export interface PricingTranslator {
  (key: string, values?: Record<string, string | number>): string;
  has(key: string): boolean;
}

/** "kg", "tonne"… — an unknown key (a unit added later, an old row) is shown as stored. */
export function unitLabel(t: PricingTranslator, unit: string): string {
  return t.has(`units.${unit}`) ? t(`units.${unit}`) : unit;
}

/** "500 kg", "2 tonnes": the unit agrees with the number. */
export function quantityLabel(t: PricingTranslator, quantity: number, unit: string, locale: string): string {
  if (t.has(`quantity.${unit}`)) return t(`quantity.${unit}`, { count: quantity });
  return `${new Intl.NumberFormat(locale).format(quantity)} ${unit}`;
}

/** What the public pages print for a product: a price per unit and/or a minimum order. */
export interface PricingDisplay {
  /** "4,50 $US" */
  price: string | null;
  /** "kg" — what the price is for. */
  unit: string | null;
  /** "500 kg" */
  minOrder: string | null;
}

export function pricingDisplay(row: unknown, t: PricingTranslator, locale: string): PricingDisplay {
  const p = pricingOf(row);
  const unit = p.sale_unit;
  return {
    price: p.price !== null && unit ? formatPrice(p.price, p.price_currency, locale) : null,
    unit: unit ? unitLabel(t, unit) : null,
    minOrder: p.min_order_quantity !== null && unit ? quantityLabel(t, p.min_order_quantity, unit, locale) : null,
  };
}
