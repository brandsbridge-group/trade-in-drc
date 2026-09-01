import { describe, it, expect } from "vitest";
import { toExternalHref, toDisplayHost } from "./external-href";

describe("toExternalHref", () => {
  it("assumes https for the scheme-less input people actually type", () => {
    // Rendered raw this became a RELATIVE link (/en/companies/www.example.com).
    expect(toExternalHref("www.cayamedical.com")).toBe("https://www.cayamedical.com");
    expect(toExternalHref("example.com")).toBe("https://example.com");
  });

  it("keeps an explicit http(s) scheme untouched", () => {
    expect(toExternalHref("https://x.com")).toBe("https://x.com");
    expect(toExternalHref("http://x.com")).toBe("http://x.com");
  });

  it("trims surrounding whitespace", () => {
    expect(toExternalHref("  spaced.com  ")).toBe("https://spaced.com");
  });

  it("returns null for empty input so callers can skip the link", () => {
    expect(toExternalHref("")).toBeNull();
    expect(toExternalHref("   ")).toBeNull();
    expect(toExternalHref(null)).toBeNull();
    expect(toExternalHref(undefined)).toBeNull();
  });

  it("refuses non-http(s) schemes rather than prefixing them", () => {
    expect(toExternalHref("javascript:alert(1)")).toBeNull();
    expect(toExternalHref("JavaScript:alert(1)")).toBeNull();
    expect(toExternalHref("data:text/html,<script>")).toBeNull();
    expect(toExternalHref("mailto:a@b.com")).toBeNull();
  });
});

describe("toDisplayHost", () => {
  it("strips the scheme and any trailing slash", () => {
    expect(toDisplayHost("https://www.example.com/")).toBe("www.example.com");
    expect(toDisplayHost("http://example.com")).toBe("example.com");
    expect(toDisplayHost("example.com")).toBe("example.com");
  });

  it("is empty for missing values", () => {
    expect(toDisplayHost(null)).toBe("");
    expect(toDisplayHost(undefined)).toBe("");
  });
});
