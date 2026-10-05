import { describe, expect, it } from "vitest";
import { authEmailRedirect } from "./email-redirect";

describe("authEmailRedirect", () => {
  it("keeps the domain the person is on", () => {
    for (const origin of ["https://tradeindrc.net", "https://tradeindrc.com", "https://staging.tradeindrc.net", "http://localhost:3000"]) {
      expect(authEmailRedirect(origin, "fr", "signup", "/fr/dashboard").startsWith(`${origin}/fr/callback?`)).toBe(true);
    }
  });

  it("carries where to land after signing up", () => {
    expect(authEmailRedirect("https://tradeindrc.net", "fr", "signup", "/fr/dashboard/companies/new")).toBe(
      "https://tradeindrc.net/fr/callback?redirect=%2Ffr%2Fdashboard%2Fcompanies%2Fnew"
    );
  });

  it("marks a password reset", () => {
    expect(authEmailRedirect("https://tradeindrc.org", "en", "recovery")).toBe("https://tradeindrc.org/en/callback?type=recovery");
  });

  it("always has a query string, since the e-mail template appends with &", () => {
    const urls = [
      authEmailRedirect("https://tradeindrc.net", "fr", "signup"),
      authEmailRedirect("https://tradeindrc.net", "fr", "signup", null),
      authEmailRedirect("https://tradeindrc.net", "fr", "signup", "/fr/dashboard"),
      authEmailRedirect("https://tradeindrc.net", "fr", "recovery"),
    ];
    for (const url of urls) expect(new URL(url).search.length).toBeGreaterThan(1);
  });

  it("ignores a trailing slash on the origin", () => {
    expect(authEmailRedirect("https://tradeindrc.net/", "fr", "recovery")).toBe("https://tradeindrc.net/fr/callback?type=recovery");
  });
});
