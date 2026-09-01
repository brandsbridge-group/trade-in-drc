import type { LucideIcon } from "lucide-react";
import {
  Pickaxe,
  Sprout,
  Zap,
  Building2,
  Wifi,
  Landmark,
  Factory,
  HeartPulse,
} from "lucide-react";
import type { Locale } from "@/config/locales";

/** The eight event classifications stored on content_items.event_type. */
export const EVENT_TYPES = [
  "conference",
  "summit",
  "forum",
  "b2b_meeting",
  "exhibition",
  "training",
  "webinar",
  "trade_mission",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

/** Upcoming-section tab keys (design 13). "all" shows every upcoming event. */
export const EVENT_TABS = [
  "all",
  "conferences",
  "b2b",
  "exhibitions",
  "training",
  "webinars",
  "trademissions",
] as const;

export type EventTab = (typeof EVENT_TABS)[number];

/** Which event_type values each tab includes. "all" has no restriction. */
export const TAB_EVENT_TYPES: Record<Exclude<EventTab, "all">, readonly EventType[]> = {
  conferences: ["conference", "forum", "summit"],
  b2b: ["b2b_meeting"],
  exhibitions: ["exhibition"],
  training: ["training"],
  webinars: ["webinar"],
  trademissions: ["trade_mission"],
};

export function isEventTab(value: unknown): value is EventTab {
  return typeof value === "string" && (EVENT_TABS as readonly string[]).includes(value);
}

export function isEventType(value: unknown): value is EventType {
  return typeof value === "string" && (EVENT_TYPES as readonly string[]).includes(value);
}

/**
 * "Events by Sector" tiles (design 13). Each tile matches DB sectors whose
 * English name contains any keyword, so real per-sector event counts can be
 * tallied without hardcoding sector ids.
 */
export interface SectorTile {
  key: string;
  Icon: LucideIcon;
  match: readonly string[];
}

export const SECTOR_TILES: readonly SectorTile[] = [
  { key: "mining", Icon: Pickaxe, match: ["mining", "mine", "minier", "miner"] },
  { key: "agriculture", Icon: Sprout, match: ["agri", "farm"] },
  { key: "energy", Icon: Zap, match: ["energy", "énerg", "energie", "power"] },
  { key: "infrastructure", Icon: Building2, match: ["infra", "construction", "transport"] },
  { key: "digital", Icon: Wifi, match: ["digital", "telecom", "numér", "télécom", "ict", "tech"] },
  { key: "finance", Icon: Landmark, match: ["financ", "bank", "banc", "insurance"] },
  { key: "manufacturing", Icon: Factory, match: ["manufactur", "industr"] },
  { key: "healthcare", Icon: HeartPulse, match: ["health", "santé", "medic", "pharma"] },
];

/** Fixed popular-cities list (proper nouns, identical across locales). */
export const POPULAR_CITIES = [
  "Kinshasa",
  "Lubumbashi",
  "Kolwezi",
  "Goma",
  "Istanbul",
  "Dubai",
] as const;

/** Static platform figures shown alongside live counts in the stat tiles. */
export const PROVINCES_COVERED = 26;
export const INTERNATIONAL_PARTNERS_LABEL = "40+";

/**
 * Format an event date range for cards, e.g. "Feb 10 – 12, 2026" or
 * "May 19 – Jun 2, 2026". Falls back gracefully when the end date is missing.
 */
export function formatEventDateRange(
  startISO: string | null,
  endISO: string | null,
  locale: Locale
): string {
  if (!startISO) return "";
  const start = new Date(startISO);
  const end = endISO ? new Date(endISO) : null;

  const monthDay = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  const dayOnly = new Intl.DateTimeFormat(locale, { day: "numeric" });
  const yearOnly = new Intl.DateTimeFormat(locale, { year: "numeric" });
  const full = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" });

  const startYear = start.getFullYear();
  if (!end || start.getTime() === end.getTime()) {
    return full.format(start);
  }

  const endYear = end.getFullYear();
  if (startYear !== endYear) {
    return `${full.format(start)} – ${full.format(end)}`;
  }

  // Same year.
  if (start.getMonth() === end.getMonth()) {
    return `${monthDay.format(start)} – ${dayOnly.format(end)}, ${yearOnly.format(start)}`;
  }
  return `${monthDay.format(start)} – ${monthDay.format(end)}, ${yearOnly.format(start)}`;
}

/** Compact "N+" formatting for the upcoming-events stat tile. */
export function approxPlus(n: number): string {
  if (n >= 20) return `${Math.floor(n / 10) * 10}+`;
  if (n >= 5) return `${n}+`;
  return String(n);
}
