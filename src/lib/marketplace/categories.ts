import type { LucideIcon } from "lucide-react";
import {
  Factory,
  Globe,
  PackageOpen,
  Landmark,
  Ship,
  Building2,
  Users,
  Handshake,
  CircleDollarSign,
} from "lucide-react";

import type { SegmentKey } from "./segments";

/**
 * The nine marketplace category cards from the customer design
 * (latest-designs/marketplace-drc-business.ai). Each card owns its accent
 * colour — Tailwind needs whole literal class strings, so they are spelled out
 * rather than composed at runtime.
 */
export interface MarketCategory {
  key: SegmentKey;
  Icon: LucideIcon;
  /** Icon + heading colour. */
  text: string;
  /** Outline-button classes (border, text, hover fill). */
  button: string;
  /**
   * Where the card leads. Government bodies and public corporations resolve to
   * the real institutions directory at /contact-points; the rest to their
   * marketplace segment.
   */
  href: string;
  /** Counted from `institutions` instead of `company_segments`. */
  countsInstitutions?: boolean;
}

export const MARKET_CATEGORIES: readonly MarketCategory[] = [
  {
    key: "manufacturer",
    Icon: Factory,
    text: "text-blue-700",
    button: "border-blue-600/40 text-blue-700 hover:bg-blue-50",
    href: "/market/manufacturer",
  },
  {
    key: "importer",
    Icon: Globe,
    text: "text-emerald-700",
    button: "border-emerald-600/40 text-emerald-700 hover:bg-emerald-50",
    href: "/market/importer",
  },
  {
    key: "exporter",
    Icon: PackageOpen,
    text: "text-violet-700",
    button: "border-violet-600/40 text-violet-700 hover:bg-violet-50",
    href: "/market/exporter",
  },
  {
    key: "finance",
    Icon: Landmark,
    text: "text-sky-700",
    button: "border-sky-600/40 text-sky-700 hover:bg-sky-50",
    href: "/market/finance",
  },
  {
    key: "logistics",
    Icon: Ship,
    text: "text-orange-600",
    button: "border-orange-500/40 text-orange-600 hover:bg-orange-50",
    href: "/market/logistics",
  },
  {
    key: "government",
    Icon: Building2,
    text: "text-teal-700",
    button: "border-teal-600/40 text-teal-700 hover:bg-teal-50",
    href: "/contact-points",
    countsInstitutions: true,
  },
  {
    key: "public_corp",
    Icon: Users,
    text: "text-blue-600",
    button: "border-blue-500/40 text-blue-600 hover:bg-blue-50",
    href: "/contact-points",
    countsInstitutions: true,
  },
  {
    key: "facilitation",
    Icon: Handshake,
    text: "text-red-600",
    button: "border-red-500/40 text-red-600 hover:bg-red-50",
    href: "/market/facilitation",
  },
  {
    key: "investors",
    Icon: CircleDollarSign,
    text: "text-amber-600",
    button: "border-amber-500/50 text-amber-700 hover:bg-amber-50",
    href: "/market/investors",
  },
] as const;
