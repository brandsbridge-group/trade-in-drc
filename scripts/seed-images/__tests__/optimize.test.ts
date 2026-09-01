import { describe, it, expect } from "vitest";
import { optimizeToWebp } from "../lib/optimize";
import sharp from "sharp";

async function makeRawPng(w: number, h: number): Promise<Buffer> {
  return await sharp({
    create: { width: w, height: h, channels: 3, background: { r: 200, g: 100, b: 50 } },
  }).png().toBuffer();
}

describe("optimizeToWebp", () => {
  it("resizes a 3000x2000 image down to product target 1200x1200", async () => {
    const input = await makeRawPng(3000, 2000);
    const out = await optimizeToWebp(input, "product");
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(1200);
  });

  it("resizes a 3000x2000 image down to content target 1600x900", async () => {
    const input = await makeRawPng(3000, 2000);
    const out = await optimizeToWebp(input, "content");
    const meta = await sharp(out).metadata();
    expect(meta.width).toBe(1600);
    expect(meta.height).toBe(900);
  });

  it("output stays under the 400 KB hard limit for a typical photo", async () => {
    const input = await makeRawPng(2000, 2000);
    const out = await optimizeToWebp(input, "product");
    expect(out.byteLength).toBeLessThan(400 * 1024);
  });

  it("strips metadata", async () => {
    const inputWithExif = await sharp(await makeRawPng(500, 500))
      .withMetadata({ exif: { IFD0: { Copyright: "test" } } })
      .png()
      .toBuffer();
    const out = await optimizeToWebp(inputWithExif, "product");
    const meta = await sharp(out).metadata();
    expect(meta.exif).toBeUndefined();
  });
});
