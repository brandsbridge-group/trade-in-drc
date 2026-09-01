export const REPORT_KINDS = ["market_report","legal_guide","regulation"] as const;
export type ReportKind = typeof REPORT_KINDS[number];
export function isReportKind(value: unknown): value is ReportKind {
  return typeof value === "string" && (REPORT_KINDS as readonly string[]).includes(value);
}
