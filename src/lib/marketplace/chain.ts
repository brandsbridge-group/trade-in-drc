/**
 * "Complete your operation" — the four chain pages under /market/<key>.
 * Three are company segments (company_segments.specialties / .attributes,
 * migration 00049); `institutions` reads the public institutions directory.
 * Chip keys and fact keys below are the contract with the seeded data;
 * their labels live in MarketChain.segments.<key>.{chips,facts}.
 */
export const CHAIN_KEYS = ["logistics", "finance", "facilitation", "institutions"] as const;
export type ChainKey = (typeof CHAIN_KEYS)[number];

export function isChainKey(value: unknown): value is ChainKey {
  return typeof value === "string" && (CHAIN_KEYS as readonly string[]).includes(value);
}

/** Company-backed chain pages (institutions is a separate table). */
export type ProviderChainKey = Exclude<ChainKey, "institutions">;

export const CHAIN_CONFIG: Record<
  ProviderChainKey,
  {
    chips: readonly string[];
    facts: readonly [string, string, string, string];
    /** Primary action label key (MarketChain.actions.*). */
    cta: "contact" | "introduce";
  }
> = {
  logistics: {
    chips: ["corridor_matadi", "corridor_kasumbalesa", "corridor_kigali", "sea", "road", "bonded"],
    facts: ["corridors", "modes", "licence", "storage"],
    cta: "contact",
  },
  finance: {
    chips: ["documentary_credit", "bank_guarantee", "cargo_insurance", "fx", "import_finance"],
    facts: ["instruments", "currencies", "sectors", "lead_time"],
    cta: "introduce",
  },
  facilitation: {
    chips: [
      "pre_inspection",
      "origin_certificate",
      "tariff_classification",
      "standards_testing",
      "health_products",
    ],
    facts: ["accreditations", "controls", "documents", "lead_time"],
    cta: "contact",
  },
};

export const INSTITUTION_FACTS = ["competence", "obtain", "province", "access"] as const;

/**
 * A fact is either a language-neutral string ("USD, CDF", "Matadi → Kinshasa")
 * or a { en, fr, … } map. Falls back to English, then French.
 */
export function pickFact(attributes: unknown, key: string, locale: string): string | null {
  if (!attributes || typeof attributes !== "object") return null;
  const v = (attributes as Record<string, unknown>)[key];
  if (typeof v === "string") return v.trim() || null;
  if (v && typeof v === "object") {
    const m = v as Record<string, unknown>;
    const s = m[locale] ?? m.en ?? m.fr;
    return typeof s === "string" && s.trim() ? s : null;
  }
  return null;
}
