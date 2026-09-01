import { describe, it, expect } from "vitest";
import { REPORT_KINDS, isReportKind } from "./kinds";

describe("report kinds", () => {
  it("exposes 3 canonical kinds in roadmap order", () => {
    expect(REPORT_KINDS).toEqual(["market_report","legal_guide","regulation"]);
  });
  it("isReportKind accepts valid keys", () => {
    expect(isReportKind("market_report")).toBe(true);
    expect(isReportKind("legal_guide")).toBe(true);
    expect(isReportKind("regulation")).toBe(true);
    expect(isReportKind("nonsense")).toBe(false);
  });
});
