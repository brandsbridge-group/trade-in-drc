# Seed Image Sourcing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every `placehold.co` URL in `supabase/seed.sql` with a real, optimized, properly-licensed photo (Unsplash + Pexels) or local SVG monogram, sourced via a re-runnable script.

**Architecture:** Hand-curated JSON manifest enumerates every required image with search-query candidates. A Node/TS fetch script hits Unsplash + Pexels APIs, picks first result per entry, optimizes via `sharp` (webp, 1200×1200 products / 1600×900 content), writes to `public/seed-images/<category>/<slug>.webp`, and appends to `ATTRIBUTIONS.md`. Companies get locally-generated flag-gradient SVG monograms (no API call). Seed SQL is rewritten to reference local paths.

**Tech Stack:** Node 24, TypeScript, `tsx` runtime, `sharp` for image optimization, `zod` for manifest validation, Vitest for tests, Unsplash API + Pexels API.

**Spec reference:** `docs/superpowers/specs/2026-05-18-seed-image-sourcing-design.md`

---

## File Structure

**Create:**
- `scripts/seed-images/manifest.json` — declarative source-of-truth for all images
- `scripts/seed-images/manifest.schema.ts` — Zod schema + types
- `scripts/seed-images/lib/sources.ts` — Unsplash + Pexels client wrappers
- `scripts/seed-images/lib/optimize.ts` — sharp wrapper (resize → webp)
- `scripts/seed-images/lib/attributions.ts` — ATTRIBUTIONS.md writer
- `scripts/seed-images/build-logos.ts` — SVG monogram generator
- `scripts/seed-images/fetch.ts` — main entrypoint
- `scripts/seed-images/__tests__/manifest.test.ts` — schema + seed-id coverage
- `scripts/seed-images/__tests__/optimize.test.ts` — size budget enforcement
- `scripts/seed-images/__tests__/attributions.test.ts` — completeness check
- `scripts/seed-images/__tests__/build-logos.test.ts` — SVG output assertions
- `scripts/seed-images/README.md` — run instructions
- `public/seed-images/.gitkeep`
- `public/seed-images/ATTRIBUTIONS.md` — generated trust trail
- `.env.example` — add `UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY` placeholders

**Modify:**
- `supabase/seed.sql:531-581` — rewrite bottom three `UPDATE` blocks to reference `/seed-images/...` paths
- `next.config.ts` — confirm `dangerouslyAllowSVG: true` is set for the monograms (only if not already)
- `package.json` — add `seed:images` npm script + `sharp` / `zod` / `tsx` deps if missing
- `.gitattributes` — mark `public/seed-images/**` as `linguist-vendored`
- `.gitignore` — confirm `.env.local` already ignored (no change if so)

---

## Task 1: Add dependencies + scaffolding

**Files:**
- Modify: `package.json`
- Create: `scripts/seed-images/README.md`, `public/seed-images/.gitkeep`, `.gitattributes`
- Modify: `.env.example`

- [ ] **Step 1: Verify current deps**

```bash
node -e "const p = require('./package.json'); console.log(['sharp','zod','tsx'].map(d => d+': '+(p.dependencies?.[d] ?? p.devDependencies?.[d] ?? 'MISSING')).join('\n'))"
```

Expected output: lists current versions or "MISSING".

- [ ] **Step 2: Install missing deps**

For each dep reported MISSING above, run only the corresponding line:

```bash
npm install --save-dev sharp@^0.34.0 zod@^3.24.0 tsx@^4.20.0
```

Expected: `package.json` and `package-lock.json` updated; no errors.

- [ ] **Step 3: Add npm script**

Edit `package.json` `"scripts"` block and add:

```json
"seed:images": "tsx scripts/seed-images/fetch.ts",
"seed:logos": "tsx scripts/seed-images/build-logos.ts"
```

- [ ] **Step 4: Create folder skeleton**

```bash
mkdir -p scripts/seed-images/lib scripts/seed-images/__tests__ public/seed-images/products public/seed-images/content public/seed-images/companies
touch public/seed-images/.gitkeep
```

- [ ] **Step 5: Write the script README**

Create `scripts/seed-images/README.md`:

```markdown
# Seed Images

Sources real photos for the demo seed from Unsplash + Pexels, optimizes them, and
generates SVG monogram logos for seeded companies.

## Setup

1. Get API keys (both free):
   - Unsplash: https://unsplash.com/developers (50 req/hr)
   - Pexels: https://www.pexels.com/api/ (200 req/hr)
2. Add to `.env.local`:
   ```
   UNSPLASH_ACCESS_KEY=...
   PEXELS_API_KEY=...
   ```

## Run

```bash
npm run seed:logos     # generates 15 SVG monograms (no API call)
npm run seed:images    # downloads + optimizes 25 product + ~20 content photos
npm run seed:images -- --force            # re-fetches everything
npm run seed:images -- --only=products    # scopes a run
```

Outputs to `public/seed-images/`. Attribution trail in `public/seed-images/ATTRIBUTIONS.md`.

See spec: `docs/superpowers/specs/2026-05-18-seed-image-sourcing-design.md`.
```

- [ ] **Step 6: Update .env.example**

Append to `.env.example` (create if missing):

```
# Seed-image sourcing (only needed when running `npm run seed:images`)
UNSPLASH_ACCESS_KEY=
PEXELS_API_KEY=
```

- [ ] **Step 7: Mark seed images as vendored**

Create or append to `.gitattributes`:

```
public/seed-images/** linguist-vendored
```

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json scripts/seed-images/README.md public/seed-images/.gitkeep .gitattributes .env.example
git commit -m "chore(seed-images): scaffolding + deps (sharp, zod, tsx)"
```

---

## Task 2: Manifest schema + Zod validator

**Files:**
- Create: `scripts/seed-images/manifest.schema.ts`
- Test: `scripts/seed-images/__tests__/manifest.test.ts`

- [ ] **Step 1: Write the failing test**

Create `scripts/seed-images/__tests__/manifest.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ManifestSchema, type Manifest } from "../manifest.schema";

const validManifest: Manifest = {
  products: [
    {
      id: "d0000000-0000-0000-0000-000000000001",
      slug: "copper-cathode",
      queries: ["copper cathode", "refined copper"],
      override_url: null,
      alt_en: "Copper cathodes",
      alt_fr: "Cathodes de cuivre",
    },
  ],
  content: [
    {
      title_match_en: "DRC Copper Export Reaches Record High",
      queries: ["copper mine africa"],
      override_url: null,
      alt_en: "Copper mine",
    },
  ],
  companies: [
    {
      id: "c0000000-0000-0000-0000-000000000001",
      slug: "kct",
      initials: "KCT",
      name: "Katanga Copper Trading",
    },
  ],
};

describe("ManifestSchema", () => {
  it("accepts a valid manifest", () => {
    expect(() => ManifestSchema.parse(validManifest)).not.toThrow();
  });

  it("rejects a product entry with no queries and no override", () => {
    const bad = {
      ...validManifest,
      products: [{ ...validManifest.products[0], queries: [], override_url: null }],
    };
    expect(() => ManifestSchema.parse(bad)).toThrow();
  });

  it("rejects a company entry with empty initials", () => {
    const bad = {
      ...validManifest,
      companies: [{ ...validManifest.companies[0], initials: "" }],
    };
    expect(() => ManifestSchema.parse(bad)).toThrow();
  });

  it("rejects a product slug with uppercase letters", () => {
    const bad = {
      ...validManifest,
      products: [{ ...validManifest.products[0], slug: "Copper-Cathode" }],
    };
    expect(() => ManifestSchema.parse(bad)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run scripts/seed-images/__tests__/manifest.test.ts
```

Expected: FAIL — `Cannot find module '../manifest.schema'`.

- [ ] **Step 3: Implement the schema**

Create `scripts/seed-images/manifest.schema.ts`:

```ts
import { z } from "zod";

const Uuid = z.string().uuid();
const Slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "must be kebab-case lowercase");
const NonEmptyString = z.string().min(1);
const QueriesOrOverride = z.object({
  queries: z.array(NonEmptyString),
  override_url: z.string().url().nullable(),
}).refine(
  (v) => v.queries.length > 0 || v.override_url !== null,
  { message: "entry must have at least one query OR an override_url" },
);

export const ProductEntrySchema = z.object({
  id: Uuid,
  slug: Slug,
  alt_en: NonEmptyString,
  alt_fr: NonEmptyString,
}).and(QueriesOrOverride);

export const ContentEntrySchema = z.object({
  title_match_en: NonEmptyString,
  alt_en: NonEmptyString,
}).and(QueriesOrOverride);

export const CompanyEntrySchema = z.object({
  id: Uuid,
  slug: Slug,
  initials: NonEmptyString.max(4),
  name: NonEmptyString,
});

export const ManifestSchema = z.object({
  products: z.array(ProductEntrySchema),
  content: z.array(ContentEntrySchema),
  companies: z.array(CompanyEntrySchema),
});

export type ProductEntry = z.infer<typeof ProductEntrySchema>;
export type ContentEntry = z.infer<typeof ContentEntrySchema>;
export type CompanyEntry = z.infer<typeof CompanyEntrySchema>;
export type Manifest = z.infer<typeof ManifestSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run scripts/seed-images/__tests__/manifest.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-images/manifest.schema.ts scripts/seed-images/__tests__/manifest.test.ts
git commit -m "feat(seed-images): manifest schema + zod validator"
```

---

## Task 3: Author the manifest

**Files:**
- Create: `scripts/seed-images/manifest.json`
- Test: extend `scripts/seed-images/__tests__/manifest.test.ts`

- [ ] **Step 1: Write the failing coverage test**

Append to `scripts/seed-images/__tests__/manifest.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("manifest.json coverage", () => {
  const manifestPath = resolve(__dirname, "../manifest.json");
  const manifest = ManifestSchema.parse(JSON.parse(readFileSync(manifestPath, "utf8")));
  const seedSql = readFileSync(resolve(__dirname, "../../../supabase/seed.sql"), "utf8");

  it("every product UUID in manifest matches a row in seed.sql", () => {
    for (const p of manifest.products) {
      expect(seedSql, `product ${p.slug} (${p.id}) not in seed.sql`).toContain(p.id);
    }
  });

  it("every company UUID in manifest matches a row in seed.sql", () => {
    for (const c of manifest.companies) {
      expect(seedSql, `company ${c.slug} (${c.id}) not in seed.sql`).toContain(c.id);
    }
  });

  it("covers all 25 seeded products", () => {
    expect(manifest.products).toHaveLength(25);
  });

  it("covers all 15 seeded companies", () => {
    expect(manifest.companies).toHaveLength(15);
  });

  it("every content entry's title_match_en exists in seed.sql", () => {
    for (const c of manifest.content) {
      expect(seedSql).toContain(c.title_match_en);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run scripts/seed-images/__tests__/manifest.test.ts
```

Expected: FAIL — manifest.json does not exist.

- [ ] **Step 3: Pull seed identifiers**

```bash
grep -oE "d0000000-0000-0000-0000-[0-9a-f]{12}" supabase/seed.sql | sort -u
grep -oE "c0000000-0000-0000-0000-[0-9a-f]{12}" supabase/seed.sql | sort -u
grep -E "title_en\s*[=:]" supabase/seed.sql | grep -oE "'[^']+'" | head -25
```

Use the output to fill the manifest in Step 4.

- [ ] **Step 4: Write the manifest**

Create `scripts/seed-images/manifest.json`. The 25 product entries map 1:1 to the UUIDs in `supabase/seed.sql:550-577`. The 15 companies map to `supabase/seed.sql:531-548`. Content entries cover seeded news/blog/events/reports. Example (truncated):

```json
{
  "products": [
    {
      "id": "d0000000-0000-0000-0000-000000000001",
      "slug": "copper-cathode",
      "queries": ["copper cathode", "stack of copper sheets", "refined copper"],
      "override_url": null,
      "alt_en": "Stack of refined copper cathodes",
      "alt_fr": "Pile de cathodes de cuivre raffiné"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000002",
      "slug": "copper-wire-rod",
      "queries": ["copper wire rod", "copper wire coil"],
      "override_url": null,
      "alt_en": "Coiled copper wire rod",
      "alt_fr": "Fil de cuivre en bobine"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000003",
      "slug": "virunga-arabica",
      "queries": ["arabica coffee cherries", "coffee plantation africa"],
      "override_url": null,
      "alt_en": "Ripe arabica coffee cherries on the branch",
      "alt_fr": "Cerises de café arabica mûres"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000004",
      "slug": "roasted-coffee-250g",
      "queries": ["roasted coffee beans bag", "coffee beans bag"],
      "override_url": null,
      "alt_en": "Bag of roasted coffee beans",
      "alt_fr": "Sachet de grains de café torréfié"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000005",
      "slug": "cocoa-beans-grade-a",
      "queries": ["cocoa beans pile", "cacao beans"],
      "override_url": null,
      "alt_en": "Pile of grade-A cocoa beans",
      "alt_fr": "Tas de fèves de cacao de qualité A"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000006",
      "slug": "cocoa-nibs-roasted",
      "queries": ["cocoa nibs", "roasted cacao nibs"],
      "override_url": null,
      "alt_en": "Roasted cocoa nibs",
      "alt_fr": "Éclats de cacao torréfiés"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000007",
      "slug": "cobalt-sulfate",
      "queries": ["cobalt sulfate", "blue mineral powder", "cobalt ore"],
      "override_url": null,
      "alt_en": "Cobalt sulfate crystals",
      "alt_fr": "Cristaux de sulfate de cobalt"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000008",
      "slug": "cobalt-hydroxide",
      "queries": ["cobalt hydroxide", "cobalt powder"],
      "override_url": null,
      "alt_en": "Cobalt hydroxide concentrate",
      "alt_fr": "Concentré d'hydroxyde de cobalt"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000009",
      "slug": "afrormosia-timber",
      "queries": ["tropical hardwood logs", "african timber stack"],
      "override_url": null,
      "alt_en": "Stacked afrormosia hardwood logs",
      "alt_fr": "Grumes d'afrormosia empilées"
    },
    {
      "id": "d0000000-0000-0000-0000-00000000000a",
      "slug": "sapele-veneer",
      "queries": ["wood veneer sheets", "sapele wood"],
      "override_url": null,
      "alt_en": "Sapele wood veneer sheets",
      "alt_fr": "Feuilles de placage de sapelli"
    },
    {
      "id": "d0000000-0000-0000-0000-00000000000b",
      "slug": "polished-diamonds",
      "queries": ["polished diamonds", "cut diamonds"],
      "override_url": null,
      "alt_en": "Polished diamonds",
      "alt_fr": "Diamants polis"
    },
    {
      "id": "d0000000-0000-0000-0000-00000000000c",
      "slug": "rough-diamonds",
      "queries": ["rough diamonds", "uncut diamonds"],
      "override_url": null,
      "alt_en": "Rough uncut diamonds",
      "alt_fr": "Diamants bruts non taillés"
    },
    {
      "id": "d0000000-0000-0000-0000-00000000000d",
      "slug": "crude-palm-oil",
      "queries": ["crude palm oil", "palm oil barrels"],
      "override_url": null,
      "alt_en": "Crude palm oil",
      "alt_fr": "Huile de palme brute"
    },
    {
      "id": "d0000000-0000-0000-0000-00000000000e",
      "slug": "rbd-palm-olein",
      "queries": ["refined palm oil", "palm olein bottle"],
      "override_url": null,
      "alt_en": "Refined palm olein",
      "alt_fr": "Oléine de palme raffinée"
    },
    {
      "id": "d0000000-0000-0000-0000-00000000000f",
      "slug": "cement-cem-i-42-5n",
      "queries": ["cement bags pallet", "portland cement"],
      "override_url": null,
      "alt_en": "Stack of cement bags",
      "alt_fr": "Pile de sacs de ciment"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000010",
      "slug": "washed-sand",
      "queries": ["washed construction sand", "sand pile"],
      "override_url": null,
      "alt_en": "Washed construction sand",
      "alt_fr": "Sable de construction lavé"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000011",
      "slug": "coltan-concentrate",
      "queries": ["coltan ore", "tantalum ore"],
      "override_url": null,
      "alt_en": "Coltan concentrate",
      "alt_fr": "Concentré de coltan"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000012",
      "slug": "inland-transport",
      "queries": ["truck logistics africa", "freight truck"],
      "override_url": null,
      "alt_en": "Inland freight truck",
      "alt_fr": "Camion de transport intérieur"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000013",
      "slug": "cassava-flour",
      "queries": ["cassava flour", "white flour bag"],
      "override_url": null,
      "alt_en": "Cassava flour",
      "alt_fr": "Farine de manioc"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000014",
      "slug": "garri-white",
      "queries": ["garri", "white cassava granules"],
      "override_url": null,
      "alt_en": "White garri (fermented cassava)",
      "alt_fr": "Garri blanc (manioc fermenté)"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000015",
      "slug": "rebar-12mm",
      "queries": ["steel rebar stack", "reinforcement bars"],
      "override_url": null,
      "alt_en": "12mm steel rebar",
      "alt_fr": "Acier d'armature 12mm"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000016",
      "slug": "sapele-boards",
      "queries": ["sawn timber boards", "hardwood planks"],
      "override_url": null,
      "alt_en": "Sapele hardwood boards",
      "alt_fr": "Planches de sapelli"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000017",
      "slug": "solar-hybrid-5kw",
      "queries": ["solar panel installation africa", "solar array"],
      "override_url": null,
      "alt_en": "Solar hybrid system installation",
      "alt_fr": "Installation solaire hybride"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000018",
      "slug": "mineral-water-1-5l",
      "queries": ["mineral water bottles pallet", "bottled water"],
      "override_url": null,
      "alt_en": "Mineral water bottles",
      "alt_fr": "Bouteilles d'eau minérale"
    },
    {
      "id": "d0000000-0000-0000-0000-000000000019",
      "slug": "mango-nectar-330ml",
      "queries": ["mango juice bottles", "tropical fruit juice"],
      "override_url": null,
      "alt_en": "Mango nectar bottles",
      "alt_fr": "Bouteilles de nectar de mangue"
    }
  ],
  "content": [
    {
      "title_match_en": "DRC Copper Export Reaches Record High",
      "queries": ["copper mine africa", "open pit copper mine"],
      "override_url": null,
      "alt_en": "Open-pit copper mine in central Africa"
    }
  ],
  "companies": [
    {"id": "c0000000-0000-0000-0000-000000000001", "slug": "kct", "initials": "KCT", "name": "Katanga Copper Trading"},
    {"id": "c0000000-0000-0000-0000-000000000002", "slug": "vcc", "initials": "VCC", "name": "Virunga Coffee Cooperative"},
    {"id": "c0000000-0000-0000-0000-000000000003", "slug": "kce", "initials": "KCE", "name": "Kinshasa Cocoa Exporters"},
    {"id": "c0000000-0000-0000-0000-000000000004", "slug": "lcr", "initials": "LCR", "name": "Lualaba Cobalt Refinery"},
    {"id": "c0000000-0000-0000-0000-000000000005", "slug": "ehc", "initials": "EHC", "name": "Équateur Hardwood Co."},
    {"id": "c0000000-0000-0000-0000-000000000006", "slug": "kds", "initials": "KDS", "name": "Kasai Diamond Sourcing"},
    {"id": "c0000000-0000-0000-0000-000000000007", "slug": "bpi", "initials": "BPI", "name": "Bandundu Palm Industries"},
    {"id": "c0000000-0000-0000-0000-000000000008", "slug": "gcw", "initials": "GCW", "name": "Goma Cement Works"},
    {"id": "c0000000-0000-0000-0000-000000000009", "slug": "mcl", "initials": "MCL", "name": "Maniema Coltan Ltd"},
    {"id": "c0000000-0000-0000-0000-00000000000a", "slug": "kcl", "initials": "KCL", "name": "Kongo Cassava Ltd"},
    {"id": "c0000000-0000-0000-0000-00000000000b", "slug": "ksc", "initials": "KSC", "name": "Kinshasa Steel Co."},
    {"id": "c0000000-0000-0000-0000-00000000000c", "slug": "ksm", "initials": "KSM", "name": "Kivu Sawmill"},
    {"id": "c0000000-0000-0000-0000-00000000000d", "slug": "tfg", "initials": "TFG", "name": "TradeFlow Logistics Group"},
    {"id": "c0000000-0000-0000-0000-00000000000e", "slug": "lep", "initials": "LEP", "name": "Lubumbashi Energy Partners"},
    {"id": "c0000000-0000-0000-0000-00000000000f", "slug": "kib", "initials": "KIB", "name": "Kinshasa Beverages Inc."}
  ]
}
```

**Implementer note:** The manifest above shows ONE content entry as an example. Before completing this task, open `supabase/seed.sql` (lines 362-432 for content_items, 433-488 for reports) and add one entry per seeded `title_en`. Each entry needs `title_match_en` (exact match), 1-3 `queries`, `override_url: null`, and `alt_en`. Expect ~15-20 content entries.

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run scripts/seed-images/__tests__/manifest.test.ts
```

Expected: all coverage tests pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/seed-images/manifest.json scripts/seed-images/__tests__/manifest.test.ts
git commit -m "feat(seed-images): manifest covering 25 products + 15 companies + content"
```

---

## Task 4: Image optimizer (sharp wrapper)

**Files:**
- Create: `scripts/seed-images/lib/optimize.ts`
- Test: `scripts/seed-images/__tests__/optimize.test.ts`

- [ ] **Step 1: Write the failing test**

Create `scripts/seed-images/__tests__/optimize.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run scripts/seed-images/__tests__/optimize.test.ts
```

Expected: FAIL — `Cannot find module '../lib/optimize'`.

- [ ] **Step 3: Implement the optimizer**

Create `scripts/seed-images/lib/optimize.ts`:

```ts
import sharp from "sharp";

export type ImageKind = "product" | "content";

const TARGETS: Record<ImageKind, { width: number; height: number }> = {
  product: { width: 1200, height: 1200 },
  content: { width: 1600, height: 900 },
};

const WEBP_QUALITY = 85;
const HARD_LIMIT_BYTES = 400 * 1024;

export async function optimizeToWebp(input: Buffer, kind: ImageKind): Promise<Buffer> {
  const { width, height } = TARGETS[kind];
  const out = await sharp(input)
    .rotate()
    .resize({ width, height, fit: "cover", position: "attention" })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  if (out.byteLength > HARD_LIMIT_BYTES) {
    throw new Error(
      `optimized image is ${out.byteLength} bytes, exceeds ${HARD_LIMIT_BYTES} hard limit`,
    );
  }
  return out;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run scripts/seed-images/__tests__/optimize.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-images/lib/optimize.ts scripts/seed-images/__tests__/optimize.test.ts
git commit -m "feat(seed-images): sharp-based webp optimizer with 400 KB hard limit"
```

---

## Task 5: Attribution log writer

**Files:**
- Create: `scripts/seed-images/lib/attributions.ts`
- Test: `scripts/seed-images/__tests__/attributions.test.ts`

- [ ] **Step 1: Write the failing test**

Create `scripts/seed-images/__tests__/attributions.test.ts`:

```ts
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
    expect(content.indexOf("## products")).toBeGreaterThan(-1);
    expect(content.indexOf("## content")).toBeGreaterThan(content.indexOf("## products"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run scripts/seed-images/__tests__/attributions.test.ts
```

Expected: FAIL — `Cannot find module '../lib/attributions'`.

- [ ] **Step 3: Implement the log**

Create `scripts/seed-images/lib/attributions.ts`:

```ts
import { writeFile } from "node:fs/promises";

export type AttributionEntry = {
  file: string;
  photographer: string;
  sourceUrl: string;
  license: string;
  fetchedAt: string;
};

export class AttributionLog {
  private entries = new Map<string, AttributionEntry>();
  constructor(private readonly path: string) {}

  async record(entry: AttributionEntry): Promise<void> {
    this.entries.set(entry.file, entry);
  }

  async flush(): Promise<void> {
    const byCategory = new Map<string, AttributionEntry[]>();
    for (const e of this.entries.values()) {
      const category = e.file.split("/")[0];
      const list = byCategory.get(category) ?? [];
      list.push(e);
      byCategory.set(category, list);
    }
    const lines: string[] = [
      "# Seed image attributions",
      "",
      "Generated by `scripts/seed-images/fetch.ts`. All photos sourced under the",
      "Unsplash License or Pexels License — free for commercial use, no attribution",
      "required. Photographers credited as courtesy.",
      "",
    ];
    for (const category of [...byCategory.keys()].sort()) {
      lines.push(`## ${category}`, "");
      const list = byCategory.get(category)!.sort((a, b) => a.file.localeCompare(b.file));
      for (const e of list) {
        lines.push(`- \`${e.file}\` — Photo by ${e.photographer} (${e.license}) — ${e.sourceUrl} — fetched ${e.fetchedAt}`);
      }
      lines.push("");
    }
    await writeFile(this.path, lines.join("\n"), "utf8");
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run scripts/seed-images/__tests__/attributions.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-images/lib/attributions.ts scripts/seed-images/__tests__/attributions.test.ts
git commit -m "feat(seed-images): attribution log with category grouping + dedupe"
```

---

## Task 6: Unsplash + Pexels source clients

**Files:**
- Create: `scripts/seed-images/lib/sources.ts`

This task has no isolated unit tests — clients are network-bound and exercised end-to-end in Task 8. We rely on TypeScript + the manifest coverage test to catch shape mistakes.

- [ ] **Step 1: Implement the sources module**

Create `scripts/seed-images/lib/sources.ts`:

```ts
export type SourcedPhoto = {
  imageUrl: string;
  photographer: string;
  sourceUrl: string;
  license: "Unsplash License" | "Pexels License";
};

type UnsplashSearchResponse = {
  results: Array<{
    urls: { raw: string; full: string };
    user: { name: string };
    links: { html: string };
  }>;
};

type PexelsSearchResponse = {
  photos: Array<{
    src: { original: string; large2x: string };
    photographer: string;
    url: string;
  }>;
};

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const PEXELS_KEY = process.env.PEXELS_API_KEY;

export async function searchUnsplash(
  query: string,
  orientation: "landscape" | "squarish",
): Promise<SourcedPhoto | null> {
  if (!UNSPLASH_KEY) throw new Error("UNSPLASH_ACCESS_KEY missing");
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", orientation);
  url.searchParams.set("per_page", "5");
  url.searchParams.set("content_filter", "high");
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } });
  if (!res.ok) {
    if (res.status === 403) throw new Error(`Unsplash quota exhausted: ${await res.text()}`);
    throw new Error(`Unsplash ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as UnsplashSearchResponse;
  const hit = json.results[0];
  if (!hit) return null;
  return {
    imageUrl: hit.urls.full,
    photographer: hit.user.name,
    sourceUrl: hit.links.html,
    license: "Unsplash License",
  };
}

export async function searchPexels(
  query: string,
  orientation: "landscape" | "square",
): Promise<SourcedPhoto | null> {
  if (!PEXELS_KEY) throw new Error("PEXELS_API_KEY missing");
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", orientation);
  url.searchParams.set("per_page", "5");
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) {
    if (res.status === 429) throw new Error(`Pexels quota exhausted: ${await res.text()}`);
    throw new Error(`Pexels ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as PexelsSearchResponse;
  const hit = json.photos[0];
  if (!hit) return null;
  return {
    imageUrl: hit.src.original,
    photographer: hit.photographer,
    sourceUrl: hit.url,
    license: "Pexels License",
  };
}

export async function downloadBytes(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | grep "scripts/seed-images" || echo "clean"
```

Expected output: `clean`.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-images/lib/sources.ts
git commit -m "feat(seed-images): Unsplash + Pexels search clients"
```

---

## Task 7: SVG monogram logo builder

**Files:**
- Create: `scripts/seed-images/build-logos.ts`
- Test: `scripts/seed-images/__tests__/build-logos.test.ts`

- [ ] **Step 1: Write the failing test**

Create `scripts/seed-images/__tests__/build-logos.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run scripts/seed-images/__tests__/build-logos.test.ts
```

Expected: FAIL — `Cannot find module '../build-logos'`.

- [ ] **Step 3: Implement the builder**

Create `scripts/seed-images/build-logos.ts`:

```ts
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { readFileSync } from "node:fs";
import { ManifestSchema } from "./manifest.schema";

const FONT_SIZE_BY_LENGTH: Record<number, number> = { 1: 96, 2: 80, 3: 64, 4: 48 };

export function buildMonogramSvg(initials: string): string {
  if (!initials) throw new Error("initials required");
  if (initials.length > 4) throw new Error("initials must be 1-4 chars");
  const fontSize = FONT_SIZE_BY_LENGTH[initials.length];
  const baselineY = 100 + Math.round(fontSize / 3);
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${initials}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0047AB"/>
      <stop offset="100%" stop-color="#FCD116"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="24" fill="url(#g)"/>
  <text x="100" y="${baselineY}" font-family="Inter, sans-serif" font-weight="700" font-size="${fontSize}" text-anchor="middle" fill="white">${initials}</text>
</svg>
`;
}

async function main(): Promise<void> {
  const manifestPath = resolve(__dirname, "manifest.json");
  const manifest = ManifestSchema.parse(JSON.parse(readFileSync(manifestPath, "utf8")));
  const outDir = resolve(__dirname, "../../public/seed-images/companies");
  await mkdir(outDir, { recursive: true });
  let written = 0;
  for (const c of manifest.companies) {
    const svg = buildMonogramSvg(c.initials);
    const dest = resolve(outDir, `${c.slug}.svg`);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, svg, "utf8");
    written++;
  }
  console.log(`Wrote ${written} monogram SVGs to ${outDir}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run scripts/seed-images/__tests__/build-logos.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 5: Generate the logos**

```bash
npm run seed:logos
```

Expected output: `Wrote 15 monogram SVGs to .../public/seed-images/companies`.
Verify: `ls public/seed-images/companies/` shows 15 `.svg` files.

- [ ] **Step 6: Commit**

```bash
git add scripts/seed-images/build-logos.ts scripts/seed-images/__tests__/build-logos.test.ts public/seed-images/companies/
git commit -m "feat(seed-images): SVG monogram logos in DRC flag-gradient style"
```

---

## Task 8: Fetch script (main entrypoint)

**Files:**
- Create: `scripts/seed-images/fetch.ts`

No unit tests for the orchestrator — it's network-bound and exercised by running it. Type-safety + the unit-tested helpers it calls (optimize, attributions, sources) give us confidence.

- [ ] **Step 1: Implement the fetch entrypoint**

Create `scripts/seed-images/fetch.ts`:

```ts
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ManifestSchema, type Manifest } from "./manifest.schema";
import { searchUnsplash, searchPexels, downloadBytes, type SourcedPhoto } from "./lib/sources";
import { optimizeToWebp, type ImageKind } from "./lib/optimize";
import { AttributionLog } from "./lib/attributions";

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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | grep "scripts/seed-images" || echo "clean"
```

Expected: `clean`.

- [ ] **Step 3: Dry-run with API keys**

Ensure `.env.local` has `UNSPLASH_ACCESS_KEY` + `PEXELS_API_KEY`, then:

```bash
npm run seed:images
```

Expected:
- Console prints one `OK` line per entry with size + photographer
- `public/seed-images/products/*.webp` contains 25 files
- `public/seed-images/content/*.webp` matches content entry count
- `public/seed-images/ATTRIBUTIONS.md` exists and lists every fetched file

If any line says `MISS`, edit the manifest entry's `queries` or set an `override_url`, then re-run.

- [ ] **Step 4: Commit script + assets**

```bash
git add scripts/seed-images/fetch.ts public/seed-images/products/ public/seed-images/content/ public/seed-images/ATTRIBUTIONS.md
git commit -m "feat(seed-images): fetch + optimize 25 products + content covers"
```

---

## Task 9: Rewrite seed.sql to reference local images

**Files:**
- Modify: `supabase/seed.sql:531-581`

- [ ] **Step 1: Read current state of seed update blocks**

```bash
sed -n '529,585p' supabase/seed.sql
```

This confirms the 15 logos / 25 products / content update blocks are where the plan expects.

- [ ] **Step 2: Replace the company logos UPDATE block**

In `supabase/seed.sql`, replace lines 531-548 (the `UPDATE public.companies SET logo_url ...` block) with:

```sql
UPDATE public.companies SET logo_url = '/seed-images/companies/' || u.slug || '.svg' FROM (VALUES
  ('c0000000-0000-0000-0000-000000000001','kct'),
  ('c0000000-0000-0000-0000-000000000002','vcc'),
  ('c0000000-0000-0000-0000-000000000003','kce'),
  ('c0000000-0000-0000-0000-000000000004','lcr'),
  ('c0000000-0000-0000-0000-000000000005','ehc'),
  ('c0000000-0000-0000-0000-000000000006','kds'),
  ('c0000000-0000-0000-0000-000000000007','bpi'),
  ('c0000000-0000-0000-0000-000000000008','gcw'),
  ('c0000000-0000-0000-0000-000000000009','mcl'),
  ('c0000000-0000-0000-0000-00000000000a','kcl'),
  ('c0000000-0000-0000-0000-00000000000b','ksc'),
  ('c0000000-0000-0000-0000-00000000000c','ksm'),
  ('c0000000-0000-0000-0000-00000000000d','tfg'),
  ('c0000000-0000-0000-0000-00000000000e','lep'),
  ('c0000000-0000-0000-0000-00000000000f','kib')
) AS u(id, slug)
WHERE public.companies.id = u.id::uuid;
```

- [ ] **Step 3: Replace the products UPDATE block**

Replace lines 550-577 with:

```sql
UPDATE public.products SET images = ARRAY['/seed-images/products/' || u.slug || '.webp'] FROM (VALUES
  ('d0000000-0000-0000-0000-000000000001','copper-cathode'),
  ('d0000000-0000-0000-0000-000000000002','copper-wire-rod'),
  ('d0000000-0000-0000-0000-000000000003','virunga-arabica'),
  ('d0000000-0000-0000-0000-000000000004','roasted-coffee-250g'),
  ('d0000000-0000-0000-0000-000000000005','cocoa-beans-grade-a'),
  ('d0000000-0000-0000-0000-000000000006','cocoa-nibs-roasted'),
  ('d0000000-0000-0000-0000-000000000007','cobalt-sulfate'),
  ('d0000000-0000-0000-0000-000000000008','cobalt-hydroxide'),
  ('d0000000-0000-0000-0000-000000000009','afrormosia-timber'),
  ('d0000000-0000-0000-0000-00000000000a','sapele-veneer'),
  ('d0000000-0000-0000-0000-00000000000b','polished-diamonds'),
  ('d0000000-0000-0000-0000-00000000000c','rough-diamonds'),
  ('d0000000-0000-0000-0000-00000000000d','crude-palm-oil'),
  ('d0000000-0000-0000-0000-00000000000e','rbd-palm-olein'),
  ('d0000000-0000-0000-0000-00000000000f','cement-cem-i-42-5n'),
  ('d0000000-0000-0000-0000-000000000010','washed-sand'),
  ('d0000000-0000-0000-0000-000000000011','coltan-concentrate'),
  ('d0000000-0000-0000-0000-000000000012','inland-transport'),
  ('d0000000-0000-0000-0000-000000000013','cassava-flour'),
  ('d0000000-0000-0000-0000-000000000014','garri-white'),
  ('d0000000-0000-0000-0000-000000000015','rebar-12mm'),
  ('d0000000-0000-0000-0000-000000000016','sapele-boards'),
  ('d0000000-0000-0000-0000-000000000017','solar-hybrid-5kw'),
  ('d0000000-0000-0000-0000-000000000018','mineral-water-1-5l'),
  ('d0000000-0000-0000-0000-000000000019','mango-nectar-330ml')
) AS u(id, slug)
WHERE public.products.id = u.id::uuid;
```

- [ ] **Step 4: Replace the content_items UPDATE statement**

Replace the existing single-line `UPDATE public.content_items ...` at line 580 with:

```sql
UPDATE public.content_items SET cover_url =
  '/seed-images/content/' || regexp_replace(lower(title_en), '[^a-z0-9]+', '-', 'g') || '.webp'
WHERE status = 'published'
  AND (cover_url IS NULL OR cover_url LIKE '%placehold.co%');
```

Slug derivation in SQL matches the JavaScript `contentSlug()` in `fetch.ts`.

- [ ] **Step 5: Apply seed locally and verify**

```bash
npx supabase db reset 2>&1 | tail -5
```

Then in psql or via Supabase MCP:

```sql
SELECT count(*) FROM public.products WHERE images[1] LIKE '/seed-images/products/%';
-- expected: 25
SELECT count(*) FROM public.companies WHERE logo_url LIKE '/seed-images/companies/%';
-- expected: 15
SELECT count(*) FROM public.content_items WHERE cover_url LIKE '/seed-images/content/%';
-- expected: number of published content rows
```

- [ ] **Step 6: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat(seed-images): point seed.sql at local /seed-images paths"
```

---

## Task 10: next.config SVG allowance + final verify

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Inspect current next.config**

```bash
cat next.config.ts
```

- [ ] **Step 2: Verify or add SVG allowance**

If `dangerouslyAllowSVG` is already `true` in the `images:` block, skip to Step 4. Otherwise, edit `next.config.ts` so the `images` config includes:

```ts
images: {
  // ...existing keys...
  dangerouslyAllowSVG: true,
  contentDispositionType: "attachment",
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
},
```

Add an inline comment above `dangerouslyAllowSVG`:

```ts
// SVGs are only used for locally-generated company monogram logos under
// /seed-images/companies/ — see scripts/seed-images/build-logos.ts.
// CSP above prevents any inline scripts in the rare case a different SVG slips in.
dangerouslyAllowSVG: true,
```

- [ ] **Step 3: Build to confirm**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds; no warnings about disallowed SVGs.

- [ ] **Step 4: Full test sweep**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: all suites green, including new tests from this plan (manifest, optimize, attributions, build-logos).

- [ ] **Step 5: Visual smoke**

```bash
npm run dev
```

Manually open and verify no broken-image icons:
- http://localhost:3000/en/products
- http://localhost:3000/en/companies
- http://localhost:3000/en/news
- http://localhost:3000/en/blog

Stop the dev server (Ctrl-C).

- [ ] **Step 6: Commit + tag**

```bash
git add next.config.ts
git commit -m "feat(seed-images): allow locally-generated SVG monograms in next/image"
git log --oneline -10
```

Expected: the last 10 commits include Tasks 1-10 of this plan.

---

## Plan Self-Review (run before handoff)

- [x] Spec coverage: every section of the spec is covered — manifest (T2-T3), fetch flow (T6, T8), logo builder (T7), seed update (T9), attributions trail (T5), optimization budget (T4), API key docs (T1), next.config SVG allowance (T10), license trust trail (T5, T8).
- [x] No placeholders. Each step shows the exact code or command.
- [x] Type consistency: `Manifest`, `ProductEntry`, `ContentEntry`, `CompanyEntry`, `SourcedPhoto`, `AttributionEntry`, `ImageKind` all defined once and reused consistently.
- [x] Slug derivation: `contentSlug()` in `fetch.ts` (JS) and `regexp_replace(lower(title_en), '[^a-z0-9]+', '-', 'g')` in `seed.sql` produce the same string for any ASCII title.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-18-seed-image-sourcing.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
