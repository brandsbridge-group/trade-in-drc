/**
 * Shared constants + pure helpers for the Market Intelligence Data Hub
 * (customer design 11). All charts are inline SVG computed from real data —
 * these named values keep magic numbers out of the chart components.
 */

/** Brand palette (mirrors globals.css `--market-*` tokens). */
export const MARKET_COLORS = {
  navy: "#0B1F3A",
  navyDeep: "#081426",
  red: "#D8232A",
  gold: "#F5B800",
  blue: "#2563EB",
  teal: "#0D9488",
  slate: "#64748B",
  green: "#16A34A",
} as const;

/** Ordered segment colors for the "Companies by Sector" donut (top 6 + Other). */
export const DONUT_SEGMENT_COLORS = [
  MARKET_COLORS.navy,
  MARKET_COLORS.red,
  MARKET_COLORS.blue,
  MARKET_COLORS.gold,
  MARKET_COLORS.teal,
  "#7C3AED",
  MARKET_COLORS.slate,
] as const;

/** Three-step blue ramp for the provincial coverage choropleth buckets. */
export const CHOROPLETH_BUCKET_FILL = {
  high: "#1E3A8A",
  medium: "#60A5FA",
  low: "#DBEAFE",
} as const;

export type CoverageBucket = keyof typeof CHOROPLETH_BUCKET_FILL;

/** Fraction of the max province count above which coverage is "high" / "medium". */
export const COVERAGE_HIGH_FRACTION = 0.5;
export const COVERAGE_MEDIUM_FRACTION = 0.2;

export const DONUT_TOP_SECTORS = 6;
export const REPORTS_LIMIT = 6;

/**
 * Compact USD formatter used across the KPI cards and charts.
 * 24_800_000_000 -> "$24.8B", 940_000_000 -> "$940M".
 */
export function formatUsdShort(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

/** Round a company count down to a friendly "N+" figure (1_247 -> "1,200+"). */
export function formatCountPlus(count: number): string {
  if (count < 100) return String(count);
  const step = count >= 1000 ? 100 : 50;
  const floored = Math.floor(count / step) * step;
  return `${floored.toLocaleString("en-US")}+`;
}

/** Bucket a per-province count against the dataset max. */
export function bucketForCount(count: number, max: number): CoverageBucket {
  if (max <= 0) return "low";
  const fraction = count / max;
  if (fraction >= COVERAGE_HIGH_FRACTION) return "high";
  if (fraction >= COVERAGE_MEDIUM_FRACTION) return "medium";
  return "low";
}
