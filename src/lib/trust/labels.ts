import type { VerificationTier } from "./types";

export function tierLabel(t: VerificationTier): string {
  return `badge.${t}` as const;
}

export type TrustTone = "muted" | "slate" | "emerald" | "indigo";

export function tierTone(t: VerificationTier): TrustTone {
  switch (t) {
    case "premium": return "indigo";
    case "verified": return "emerald";
    case "basic": return "slate";
    case "none":
    default: return "muted";
  }
}
