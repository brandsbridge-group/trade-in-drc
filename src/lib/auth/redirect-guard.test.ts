import { describe, it, expect } from "vitest";
import { resolveSafeRedirect } from "./redirect-guard";

const ORIGIN = "https://tradeindrc.example";
const FALLBACK = "/en/dashboard";

describe("resolveSafeRedirect", () => {
  it("allows a same-origin relative path and adds the locale prefix", () => {
    expect(resolveSafeRedirect("/register-company", "en", ORIGIN, FALLBACK)).toBe(
      "/en/register-company"
    );
  });

  it("keeps a same-origin path that already carries the locale prefix", () => {
    expect(resolveSafeRedirect("/en/register-company", "en", ORIGIN, FALLBACK)).toBe(
      "/en/register-company"
    );
  });

  it("preserves the query string on a same-origin path", () => {
    expect(
      resolveSafeRedirect("/register-company?step=2", "en", ORIGIN, FALLBACK)
    ).toBe("/en/register-company?step=2");
  });

  it("rejects an absolute URL to a different origin and falls back", () => {
    expect(
      resolveSafeRedirect("https://evil.com/steal", "en", ORIGIN, FALLBACK)
    ).toBe(FALLBACK);
  });

  it("rejects a protocol-relative URL and falls back", () => {
    expect(resolveSafeRedirect("//evil.com", "en", ORIGIN, FALLBACK)).toBe(FALLBACK);
  });

  it("rejects a protocol-relative URL with a path and falls back", () => {
    expect(resolveSafeRedirect("//evil.com/phish", "en", ORIGIN, FALLBACK)).toBe(
      FALLBACK
    );
  });

  it("falls back when redirect is null", () => {
    expect(resolveSafeRedirect(null, "en", ORIGIN, FALLBACK)).toBe(FALLBACK);
  });

  it("falls back when redirect is an empty string", () => {
    expect(resolveSafeRedirect("", "en", ORIGIN, FALLBACK)).toBe(FALLBACK);
  });

  it("falls back on an unparseable value", () => {
    expect(resolveSafeRedirect("http://[::1", "en", ORIGIN, FALLBACK)).toBe(FALLBACK);
  });

  it("normalises a bare path missing the locale prefix for a different locale", () => {
    expect(resolveSafeRedirect("/dashboard", "fr", ORIGIN, FALLBACK)).toBe(
      "/fr/dashboard"
    );
  });

  // Exotic inputs that browsers/WHATWG URL parsers have historically been
  // tricked by — backslash-as-slash normalisation, triple-slash, scheme
  // relative refs, userinfo tricks, subdomain suffix tricks, and header/NUL
  // injection via percent-encoding. Each must resolve to the fallback OR a
  // same-origin path — never to another origin.
  describe("exotic / malformed redirect values never escape the origin", () => {
    const assertSameOriginOrFallback = (redirect: string) => {
      const result = resolveSafeRedirect(redirect, "en", ORIGIN, FALLBACK);
      // The result itself must always be same-origin when resolved against
      // ORIGIN — this is the actual security property under test.
      expect(new URL(result, ORIGIN).origin).toBe(ORIGIN);
    };

    it("rejects a backslash-based protocol-relative URL (/\\evil.com)", () => {
      assertSameOriginOrFallback("/\\evil.com");
      expect(resolveSafeRedirect("/\\evil.com", "en", ORIGIN, FALLBACK)).toBe(
        FALLBACK
      );
    });

    it("rejects a leading-backslash protocol-relative URL (\\/evil.com)", () => {
      assertSameOriginOrFallback("\\/evil.com");
      expect(resolveSafeRedirect("\\/evil.com", "en", ORIGIN, FALLBACK)).toBe(
        FALLBACK
      );
    });

    it("rejects a triple-slash URL (///evil.com)", () => {
      assertSameOriginOrFallback("///evil.com");
      expect(resolveSafeRedirect("///evil.com", "en", ORIGIN, FALLBACK)).toBe(
        FALLBACK
      );
    });

    it("treats a scheme-relative value (https:evil.com) as a same-origin path, not evil.com", () => {
      assertSameOriginOrFallback("https:evil.com");
      expect(resolveSafeRedirect("https:evil.com", "en", ORIGIN, FALLBACK)).toBe(
        "/en/evil.com"
      );
    });

    it("treats a scheme-relative value with one slash (https:/evil.com) as a same-origin path", () => {
      assertSameOriginOrFallback("https:/evil.com");
      expect(resolveSafeRedirect("https:/evil.com", "en", ORIGIN, FALLBACK)).toBe(
        "/en/evil.com"
      );
    });

    it("keeps a percent-encoded double-slash (%2f%2fevil.com) as a literal same-origin path segment", () => {
      assertSameOriginOrFallback("%2f%2fevil.com");
      expect(
        resolveSafeRedirect("%2f%2fevil.com", "en", ORIGIN, FALLBACK)
      ).toBe("/en/%2f%2fevil.com");
    });

    it("keeps a dot-segment protocol-relative attempt (/..//evil.com) same-origin", () => {
      assertSameOriginOrFallback("/..//evil.com");
      expect(resolveSafeRedirect("/..//evil.com", "en", ORIGIN, FALLBACK)).toBe(
        "/en//evil.com"
      );
    });

    it("rejects a userinfo@host trick (https://tradeindrc.com@evil.com/x)", () => {
      assertSameOriginOrFallback("https://tradeindrc.com@evil.com/x");
      expect(
        resolveSafeRedirect(
          "https://tradeindrc.com@evil.com/x",
          "en",
          ORIGIN,
          FALLBACK
        )
      ).toBe(FALLBACK);
    });

    it("rejects a look-alike subdomain suffix trick (https://tradeindrc.com.evil.com/x)", () => {
      assertSameOriginOrFallback("https://tradeindrc.com.evil.com/x");
      expect(
        resolveSafeRedirect(
          "https://tradeindrc.com.evil.com/x",
          "en",
          ORIGIN,
          FALLBACK
        )
      ).toBe(FALLBACK);
    });

    it("keeps a CRLF header-injection attempt (%0d%0a) as an inert same-origin path segment", () => {
      assertSameOriginOrFallback("/en/a%0d%0aSet-Cookie:x=1");
      expect(
        resolveSafeRedirect("/en/a%0d%0aSet-Cookie:x=1", "en", ORIGIN, FALLBACK)
      ).toBe("/en/a%0d%0aSet-Cookie:x=1");
    });

    it("keeps a NUL-byte injection attempt (%00) as an inert same-origin path segment", () => {
      assertSameOriginOrFallback("/en/a%00b");
      expect(resolveSafeRedirect("/en/a%00b", "en", ORIGIN, FALLBACK)).toBe(
        "/en/a%00b"
      );
    });
  });
});
