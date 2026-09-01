import type { OpportunityCategory } from "./categories";
import {
  Coins,
  FileText,
  Handshake,
  HardHat,
  Package,
  Settings2,
  Sun,
  Truck,
} from "lucide-react";

/**
 * Board tabs (customer design 2). Each tab maps to one or more real
 * `opportunities.category` values. `all` applies no category filter.
 */
export const OPPORTUNITY_TABS = [
  { key: "all", categories: [] as OpportunityCategory[] },
  { key: "tenders", categories: ["tender"] as OpportunityCategory[] },
  { key: "partnership", categories: ["partner_search", "ppp"] as OpportunityCategory[] },
  { key: "investment", categories: ["investment_call", "project_launch"] as OpportunityCategory[] },
  { key: "supply", categories: ["demand", "quotation"] as OpportunityCategory[] },
  { key: "export", categories: ["offer"] as OpportunityCategory[] },
] as const;

export type OpportunityTab = (typeof OPPORTUNITY_TABS)[number]["key"];

/**
 * Need types for the "Submit Your Business Need" form (design 2 rail).
 * Kept here (a plain module) rather than in the "use server" actions file so
 * client components can import it — server-action modules only expose their
 * async functions to the client, not plain constants.
 */
export const NEED_TYPES = ["find_partner", "invest", "buy", "sell", "publish_opportunity", "other"] as const;
export type NeedType = (typeof NEED_TYPES)[number];

export function isOpportunityTab(value: unknown): value is OpportunityTab {
  return typeof value === "string" && OPPORTUNITY_TABS.some((t) => t.key === value);
}

export function categoriesForTab(tab: OpportunityTab): OpportunityCategory[] {
  return OPPORTUNITY_TABS.find((t) => t.key === tab)?.categories ?? [];
}

/**
 * Per-category presentation: a tinted type badge + a colored square icon for
 * the row's leading glyph. `labelKey` resolves under the `Opportunities.badges`
 * namespace.
 */
export const CATEGORY_DISPLAY: Record<
  OpportunityCategory,
  { labelKey: string; badge: string; icon: typeof FileText; iconWrap: string }
> = {
  tender: {
    labelKey: "tender",
    badge: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
    icon: FileText,
    iconWrap: "bg-market-navy text-white",
  },
  ppp: {
    labelKey: "ppp",
    badge: "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200",
    icon: HardHat,
    iconWrap: "bg-teal-600 text-white",
  },
  investment_call: {
    labelKey: "investment",
    badge: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200",
    icon: Sun,
    iconWrap: "bg-market-gold text-market-navy",
  },
  project_launch: {
    labelKey: "project",
    badge: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
    icon: Coins,
    iconWrap: "bg-indigo-600 text-white",
  },
  offer: {
    labelKey: "export",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    icon: Package,
    iconWrap: "bg-amber-600 text-white",
  },
  demand: {
    labelKey: "supply",
    badge: "bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-200",
    icon: Truck,
    iconWrap: "bg-cyan-700 text-white",
  },
  quotation: {
    labelKey: "procurement",
    badge: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
    icon: Settings2,
    iconWrap: "bg-purple-600 text-white",
  },
  partner_search: {
    labelKey: "partnership",
    badge: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
    icon: Handshake,
    iconWrap: "bg-green-600 text-white",
  },
};
