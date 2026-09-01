import {
  Landmark,
  Factory,
  Plane,
  Pickaxe,
  ShoppingCart,
  Truck,
  HardHat,
  Zap,
  Ship,
  Anchor,
  Wheat,
  Coffee,
  Compass,
  Sprout,
  Fish,
  Mountain,
  Trees,
  type LucideIcon,
} from "lucide-react";

/**
 * The 7 "Key Economic Provinces" surfaced on the Explore-by-Province hub
 * (customer design 8). `value` MUST match the `companies.province` column so
 * the "Explore Province" CTA can deep-link into `/companies?region=<value>`.
 * Display names and sub-labels are proper nouns — identical across locales.
 */
export interface KeyProvince {
  /** Canonical DB value (companies.province) — used for filtering + counts. */
  value: string;
  /** Row heading, e.g. "Haut-Katanga / Lubumbashi". */
  displayName: string;
  /** Small pin sub-label under the heading. */
  subLabel: string;
  /** Three dominant-sector glyphs (design shows 3 + overflow "…"). */
  icons: LucideIcon[];
  /** City-thumbnail photo (extracted from the design artwork). */
  thumb: string;
}

export const KEY_PROVINCES: readonly KeyProvince[] = [
  {
    value: "Kinshasa",
    displayName: "Kinshasa",
    subLabel: "Kinshasa City",
    icons: [Landmark, Factory, Plane],
    thumb: "/images/provinces/kinshasa.jpg",
  },
  {
    value: "Haut-Katanga",
    displayName: "Haut-Katanga / Lubumbashi",
    subLabel: "Haut-Katanga",
    icons: [Pickaxe, ShoppingCart, Truck],
    thumb: "/images/provinces/lubumbashi.jpg",
  },
  {
    value: "Lualaba",
    displayName: "Lualaba / Kolwezi",
    subLabel: "Lualaba",
    icons: [Pickaxe, HardHat, Zap],
    thumb: "/images/provinces/kolwezi.jpg",
  },
  {
    value: "Kongo-Central",
    displayName: "Kongo Central / Matadi",
    subLabel: "Kongo-Central",
    icons: [Ship, Anchor, Factory],
    thumb: "/images/provinces/matadi.jpg",
  },
  {
    value: "Nord-Kivu",
    displayName: "Nord-Kivu / Goma",
    subLabel: "Nord-Kivu",
    icons: [Wheat, Coffee, Compass],
    thumb: "/images/provinces/goma.jpg",
  },
  {
    value: "Sud-Kivu",
    displayName: "Sud-Kivu / Bukavu",
    subLabel: "Sud-Kivu",
    icons: [Sprout, Fish, Mountain],
    thumb: "/images/provinces/bukavu.jpg",
  },
  {
    value: "Tshopo",
    displayName: "Tshopo / Kisangani",
    subLabel: "Tshopo",
    icons: [Trees, Wheat, ShoppingCart],
    thumb: "/images/provinces/kisangani.jpg",
  },
] as const;

/** The province spotlighted in the Featured band. */
export const FEATURED_PROVINCE = "Lualaba" as const;
