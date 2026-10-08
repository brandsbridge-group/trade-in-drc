import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createUnsubscribeToken,
  hashToken,
  isUnsubscribeToken,
  unsubscribeUrl,
  verifyUnsubscribeToken,
} from "./tokens";

const SUBSCRIBER = "3f0c2a44-9b1e-4c57-8a55-0d2a6a1f7e10";
const OTHER = "9d8b7c66-1a2b-4c3d-8e4f-5a6b7c8d9e0f";

describe("newsletter unsubscribe tokens", () => {
  const previous = process.env.NEWSLETTER_TOKEN_SECRET;
  beforeEach(() => {
    process.env.NEWSLETTER_TOKEN_SECRET = "test-secret";
  });
  afterEach(() => {
    process.env.NEWSLETTER_TOKEN_SECRET = previous;
  });

  it("gives a subscriber the same token every time, so old links keep working", () => {
    expect(createUnsubscribeToken(SUBSCRIBER)).toBe(createUnsubscribeToken(SUBSCRIBER));
    expect(verifyUnsubscribeToken(createUnsubscribeToken(SUBSCRIBER))).toBe(SUBSCRIBER);
  });

  it("rejects a signature moved to another subscriber", () => {
    const signature = createUnsubscribeToken(SUBSCRIBER).split(".")[1];
    expect(verifyUnsubscribeToken(`${OTHER}.${signature}`)).toBeNull();
  });

  it("rejects a token signed with another key", () => {
    const token = createUnsubscribeToken(SUBSCRIBER);
    process.env.NEWSLETTER_TOKEN_SECRET = "another-secret";
    expect(verifyUnsubscribeToken(token)).toBeNull();
  });

  it("rejects anything that is not a token", () => {
    for (const value of ["", "abc", SUBSCRIBER, `${SUBSCRIBER}.`, `${SUBSCRIBER}.${"z".repeat(64)}`]) {
      expect(verifyUnsubscribeToken(value)).toBeNull();
      expect(isUnsubscribeToken(value)).toBe(false);
    }
  });

  it("still recognises the random tokens of e-mails sent before signed links", () => {
    const legacy = "a".repeat(64);
    expect(isUnsubscribeToken(legacy)).toBe(true);
    expect(verifyUnsubscribeToken(legacy)).toBeNull();
    expect(hashToken(legacy)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("builds the link the List-Unsubscribe header and the e-mail footer share", () => {
    const url = new URL(unsubscribeUrl("https://example.org", SUBSCRIBER, "fr"));
    expect(url.pathname).toBe("/api/newsletter/unsubscribe");
    expect(url.searchParams.get("locale")).toBe("fr");
    expect(verifyUnsubscribeToken(url.searchParams.get("token") ?? "")).toBe(SUBSCRIBER);
  });
});
