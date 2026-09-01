import type { LucideIcon } from "lucide-react";
import { Pickaxe, Zap, Building2, Truck, Sprout, RadioTower } from "lucide-react";

/**
 * The six curated sectors from customer design 9. Display names + descriptions
 * come from the `BySector.sectors.<key>` i18n namespace; the icon, accent hue,
 * and `match` regex are static presentation data. `match` is tested against a
 * real `sectors` row's `name_en` so the "Explore Sector" link and the two stat
 * counts resolve to live taxonomy data. If no real row matches, the card still
 * renders with the design label and zero counts (link falls back to /companies).
 */
export interface SectorBlueprint {
  key: "mining" | "energy" | "construction" | "logistics" | "agriculture" | "digital";
  icon: LucideIcon;
  /** Icon foreground colour class. */
  iconColor: string;
  /** Soft tinted icon-chip background class. */
  iconBg: string;
  /** Keyword matcher against a real sector's `name_en`. */
  match: RegExp;
}

export const SECTOR_BLUEPRINTS: readonly SectorBlueprint[] = [
  { key: "mining", icon: Pickaxe, iconColor: "text-amber-500", iconBg: "bg-amber-50", match: /min/i },
  { key: "energy", icon: Zap, iconColor: "text-blue-600", iconBg: "bg-blue-50", match: /energ|electric|power/i },
  { key: "construction", icon: Building2, iconColor: "text-amber-600", iconBg: "bg-amber-50", match: /construc|infrastruc|build/i },
  { key: "logistics", icon: Truck, iconColor: "text-blue-600", iconBg: "bg-blue-50", match: /logist|transport|freight/i },
  { key: "agriculture", icon: Sprout, iconColor: "text-emerald-600", iconBg: "bg-emerald-50", match: /agri|agro|farm/i },
  { key: "digital", icon: RadioTower, iconColor: "text-purple-600", iconBg: "bg-purple-50", match: /digital|tech|telecom|ict/i },
] as const;
