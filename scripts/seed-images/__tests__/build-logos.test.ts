import { describe, it, expect } from "vitest";
import { buildMonogramSvg } from "../build-logos";

describe("buildMonogramSvg", () => {
  it("embeds the initials", () => {
    const svg = buildMonogramSvg("KCT");
    expect(svg).toContain(">KCT<");
  });

  it("uses a 200x200 viewBox", () => {
    expect(buildMonogramSvg("AB")).toContain('viewBox="0 0 200 200"');
  });

  it("includes DRC flag colors in the gradient", () => {
    const svg = buildMonogramSvg("XX");
    expect(svg).toContain("#0047AB");
    expect(svg).toContain("#FCD116");
  });

  it("scales font down for 4-letter initials", () => {
    const two = buildMonogramSvg("AB");
    const four = buildMonogramSvg("ABCD");
    const sizeOf = (svg: string) => Number(svg.match(/font-size="(\d+)"/)?.[1]);
    expect(sizeOf(four)).toBeLessThan(sizeOf(two));
  });

  it("rejects empty initials", () => {
    expect(() => buildMonogramSvg("")).toThrow();
  });

  it("rejects initials longer than 4 chars", () => {
    expect(() => buildMonogramSvg("ABCDE")).toThrow();
  });
});
