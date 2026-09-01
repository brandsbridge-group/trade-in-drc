import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { ManifestSchema, type Manifest } from "./manifest.schema";
import { searchUnsplash, searchPexels, downloadBytes, type SourcedPhoto } from "./lib/sources";
import { optimizeToWebp, type ImageKind } from "./lib/optimize";
import { AttributionLog } from "./lib/attributions";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type Args = { force: boolean; only: "products" | "content" | "all" };

function parseArgs(argv: string[]): Args {
  const a: Args = { force: false, only: "all" };
  for (const v of argv.slice(2)) {
    if (v === "--force") a.force = true;
    else if (v.startsWith("--only=")) {
      const val = v.slice("--only=".length);
      if (val !== "products" && val !== "content") throw new Error(`unknown --only=${val}`);
      a.only = val;
    }
  }
  return a;
}

async function fetchOne(
  queries: string[],
  overrideUrl: string | null,
  orientation: "landscape" | "squarish" | "square",
): Promise<SourcedPhoto | null> {
  if (overrideUrl) {
    return {
      imageUrl: overrideUrl,
      photographer: "manual override",
      sourceUrl: overrideUrl,
      license: "Unsplash License",
    };
  }
  for (const q of queries) {
    const unsplashOrientation = orientation === "square" ? "squarish" : orientation;
    const u = await searchUnsplash(q, unsplashOrientation as "landscape" | "squarish");
    if (u) return u;
    const pexelsOrientation = orientation === "squarish" ? "square" : orientation;
    const p = await searchPexels(q, pexelsOrientation as "landscape" | "square");
    if (p) return p;
  }
  return null;
}

async function processEntry(args: {
  slug: string;
  category: "products" | "content";
  queries: string[];
  overrideUrl: string | null;
  log: AttributionLog;
  force: boolean;
}): Promise<void> {
  const kind: ImageKind = args.category === "products" ? "product" : "content";
  const orientation = kind === "product" ? "squarish" : "landscape";
  const outPath = resolve(
    __dirname,
    "../../public/seed-images",
    args.category,
    `${args.slug}.webp`,
  );
  if (existsSync(outPath) && !args.force) {
    console.log(`SKIP ${args.category}/${args.slug} (exists)`);
    return;
  }
  const photo = await fetchOne(args.queries, args.overrideUrl, orientation);
  if (!photo) {
    console.warn(`MISS ${args.category}/${args.slug} — no results for queries ${args.queries.join(", ")}`);
    return;
  }
  const raw = await downloadBytes(photo.imageUrl);
  const optimized = await optimizeToWebp(raw, kind);
  await mkdir(resolve(outPath, ".."), { recursive: true });
  await writeFile(outPath, optimized);
  await args.log.record({
    file: `${args.category}/${args.slug}.webp`,
    photographer: photo.photographer,
    sourceUrl: photo.sourceUrl,
    license: photo.license,
    fetchedAt: new Date().toISOString().slice(0, 10),
  });
  console.log(`OK   ${args.category}/${args.slug} (${(optimized.byteLength / 1024).toFixed(0)} KB) ← ${photo.photographer}`);
}

function contentSlug(titleEn: string): string {
  return titleEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const manifest: Manifest = ManifestSchema.parse(
    JSON.parse(readFileSync(resolve(__dirname, "manifest.json"), "utf8")),
  );
  const logPath = resolve(__dirname, "../../public/seed-images/ATTRIBUTIONS.md");
  const log = new AttributionLog(logPath);

  if (args.only === "all" || args.only === "products") {
    for (const p of manifest.products) {
      await processEntry({
        slug: p.slug,
        category: "products",
        queries: p.queries,
        overrideUrl: p.override_url,
        log,
        force: args.force,
      });
    }
  }

  if (args.only === "all" || args.only === "content") {
    for (const c of manifest.content) {
      await processEntry({
        slug: contentSlug(c.title_match_en),
        category: "content",
        queries: c.queries,
        overrideUrl: c.override_url,
        log,
        force: args.force,
      });
    }
  }

  await log.flush();
  console.log(`\nATTRIBUTIONS.md written → ${logPath}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
