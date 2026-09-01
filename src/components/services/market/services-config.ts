import {
  UserSearch,
  Landmark,
  ShieldCheck,
  Users,
  BarChart3,
  UserRound,
  Plane,
  Globe,
  TrendingUp,
  Building2,
  Pickaxe,
  Zap,
  Wheat,
  HardHat,
  MonitorSmartphone,
  Truck,
  HeartPulse,
  Briefcase,
  Palmtree,
  Fuel,
  Factory,
  type LucideIcon,
} from "lucide-react";

/**
 * The 7 services (design "Our Services"). Each maps to a valid
 * `business_requests.intent` so a submission is admin-visible at /admin/requests.
 */
export const SERVICES: { key: string; intent: string; icon: LucideIcon }[] = [
  { key: "partnerSearch", intent: "partner_search", icon: UserSearch },
  { key: "marketEntry", intent: "market_entry", icon: Landmark },
  { key: "verification", intent: "business_verification", icon: ShieldCheck },
  { key: "b2bMeeting", intent: "b2b_meeting", icon: Users },
  { key: "marketReports", intent: "market_report", icon: BarChart3 },
  { key: "localRepresentation", intent: "local_representation", icon: UserRound },
  { key: "delegation", intent: "delegation", icon: Plane },
];

/** "Who We Serve" audience panel. */
export const AUDIENCES: { key: string; icon: LucideIcon }[] = [
  { key: "international", icon: Globe },
  { key: "congolese", icon: Users },
  { key: "investors", icon: TrendingUp },
  { key: "institutions", icon: Building2 },
];

/** "Strategic Sectors We Cover" chips (static — design's 11 sectors). */
export const SECTOR_CHIPS: { key: string; icon: LucideIcon }[] = [
  { key: "mining", icon: Pickaxe },
  { key: "energy", icon: Zap },
  { key: "agriculture", icon: Wheat },
  { key: "infrastructure", icon: HardHat },
  { key: "digital", icon: MonitorSmartphone },
  { key: "logistics", icon: Truck },
  { key: "healthcare", icon: HeartPulse },
  { key: "finance", icon: Briefcase },
  { key: "tourism", icon: Palmtree },
  { key: "oilGas", icon: Fuel },
  { key: "manufacturing", icon: Factory },
];

/** "How It Works" 4-step band keys. */
export const STEPS = ["submit", "review", "connect", "deliver"] as const;
