import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AttributionLog } from "../lib/attributions";

let logPath: string;

beforeEach(() => {
  logPath = join(mkdtempSync(join(tmpdir(), "attr-")), "ATTRIBUTIONS.md");
});

describe("AttributionLog", () => {
  it("writes a header on first record", async () => {
    const log = new AttributionLog(logPath);
    await log.record({
      file: "products/copper-cathode.webp",
      photographer: "Jane Doe",
      sourceUrl: "https://unsplash.com/photos/abc",
      license: "Unsplash License",
      fetchedAt: "2026-05-18",
    });
    await log.flush();
    const content = readFileSync(logPath, "utf8");
    expect(content).toContain("# Seed image attributions");
    expect(content).toContain("products/copper-cathode.webp");
    expect(content).toContain("Jane Doe");
    expect(content).toContain("Unsplash License");
  });

  it("deduplicates entries with the same file path", async () => {
    const log = new AttributionLog(logPath);
    const entry = {
      file: "products/x.webp",
      photographer: "A",
      sourceUrl: "https://unsplash.com/photos/1",
      license: "Unsplash License",
      fetchedAt: "2026-05-18",
    };
    await log.record(entry);
    await log.record({ ...entry, photographer: "B" });
    await log.flush();
    const content = readFileSync(logPath, "utf8");
    expect(content.match(/products\/x\.webp/g)?.length).toBe(1);
    expect(content).toContain("B");
    expect(content).not.toContain("photographer: A");
  });

  it("groups entries by category folder", async () => {
    const log = new AttributionLog(logPath);
    await log.record({
      file: "products/a.webp", photographer: "A",
      sourceUrl: "https://x", license: "Unsplash License", fetchedAt: "2026-05-18",
    });
    await log.record({
      file: "content/b.webp", photographer: "B",
      sourceUrl: "https://y", license: "Pexels License", fetchedAt: "2026-05-18",
    });
    await log.flush();
    const content = readFileSync(logPath, "utf8");
    // Alphabetical sort: "content" < "products", so content section appears first
    expect(content.indexOf("## content")).toBeGreaterThan(-1);
    expect(content.indexOf("## content")).toBeLessThan(content.indexOf("## products"));
  });
});
