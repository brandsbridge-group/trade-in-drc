import {
  Landmark,
  TrendingUp,
  FileText,
  Users,
  ShieldCheck,
  MapPin,
  Globe,
  Banknote,
  Scale,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

/**
 * Institutional category taxonomy for the Institutional Contacts directory
 * (customer design 4). `ALL` is a synthetic sidebar entry, not a DB value.
 * Order matches the design's sidebar. `other` exists in the DB enum but is not
 * surfaced as a sidebar filter (the design shows nine thematic categories).
 */
export type InstitutionCategory =
  | "investment_promotion"
  | "business_registration"
  | "chambers_networks"
  | "sector_regulators"
  | "provincial_support"
  | "export_trade"
  | "finance_tax"
  | "legal_judicial"
  | "education_training"
  | "other";

export const CATEGORY_ORDER: InstitutionCategory[] = [
  "investment_promotion",
  "business_registration",
  "chambers_networks",
  "sector_regulators",
  "provincial_support",
  "export_trade",
  "finance_tax",
  "legal_judicial",
  "education_training",
];

export const CATEGORY_ICONS: Record<InstitutionCategory | "all", LucideIcon> = {
  all: Landmark,
  investment_promotion: TrendingUp,
  business_registration: FileText,
  chambers_networks: Users,
  sector_regulators: ShieldCheck,
  provincial_support: MapPin,
  export_trade: Globe,
  finance_tax: Banknote,
  legal_judicial: Scale,
  education_training: GraduationCap,
  other: Landmark,
};

/**
 * Badge tint per category — flat tinted pill (light bg + saturated text),
 * matching the design's green / purple / amber trio, extended across the taxonomy.
 */
export const CATEGORY_BADGE_TINT: Record<InstitutionCategory, string> = {
  investment_promotion: "bg-emerald-50 text-emerald-700",
  business_registration: "bg-blue-50 text-blue-700",
  chambers_networks: "bg-violet-50 text-violet-700",
  sector_regulators: "bg-violet-50 text-violet-700",
  provincial_support: "bg-teal-50 text-teal-700",
  export_trade: "bg-amber-50 text-amber-700",
  finance_tax: "bg-amber-50 text-amber-700",
  legal_judicial: "bg-slate-100 text-slate-700",
  education_training: "bg-indigo-50 text-indigo-700",
  other: "bg-slate-100 text-slate-700",
};
