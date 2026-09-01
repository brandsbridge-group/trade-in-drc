# Seed Image Sourcing — Design

**Date:** 2026-05-18
**Status:** Approved for implementation planning
**Owner:** ortak@lumiostudio.co

## Goal

Replace every `placehold.co` URL in `supabase/seed.sql` with a real, optimized, properly-licensed photo committed to the repo. Make the sourcing repeatable so future expansions of the seed (more products, more companies, more content) are a 5-minute job, not an afternoon of manual searching.

## Why now

The placeholder rectangles undermine the design grammar we just spent eight phases polishing. The home grid, product cards, news/blog/events covers, and company directory all render flat blue squares with white text. To anyone evaluating the platform — investor, partner ministry, press — the visual fidelity drops to "wireframe" the moment they scroll past the hero.

## Scope

In scope:

- **25 product photos** — commodities: copper cathode, copper wire rod, Virunga arabica, roasted coffee, cocoa beans, cocoa nibs, cobalt sulfate, cobalt hydroxide, afrormosia timber, sapele veneer, polished + rough diamonds, crude palm oil, RBD palm olein, cement, washed sand, coltan, cassava flour, garri, rebar, sapele boards, solar panel + battery system, mineral water bottles, mango nectar, plus transport service icon.
- **~20 content covers** — landscape photos for the seeded news, blog, events, and reports rows.
- **15 company monogram logos** — generated locally as gradient SVGs (DRC-blue → DRC-yellow background, white serif initials). Not photographs; this matches TurkishExporter's wordmark-style approach for brand logos.

Out of scope (deferred):

- Wikimedia Commons DRC-authentic photography (would add CC-BY-SA attribution overhead — revisit if government stakeholders push back on stock photos).
- Migration to Supabase Storage `seed-assets` bucket (mirror prod upload path — revisit when image-upload UI ships).
- Company hero-banner field (`cover_url` on `companies` table) — needs schema migration + UI; tracked separately.
- Sector / category icon refresh.

## Architecture

Three artifacts, in this order:

```
scripts/seed-images/
  manifest.json        # declarative source-of-truth: every image we need
  fetch.ts             # re-runnable: reads manifest, downloads, optimizes
  build-logos.ts       # generates 15 monogram SVGs from company names
  README.md            # how to run, where API keys go

public/seed-images/
  products/<slug>.webp        # 1200×1200, ~150 KB each
  content/<slug>.webp         # 1600×900, ~180 KB each
  companies/<slug>.svg        # local SVG monograms, ~1 KB each
  ATTRIBUTIONS.md             # generated trust trail: every photo's photographer + URL + license

supabase/seed.sql
  # bottom UPDATE blocks rewritten to reference /seed-images/... paths
```

### Manifest schema

```jsonc
{
  "products": [
    {
      "id": "d0000000-0000-0000-0000-000000000001",   // matches seed.sql product UUID
      "slug": "copper-cathode",
      "queries": ["copper cathode", "copper sheet stack", "refined copper"],
      "override_url": null,            // optional hand-picked URL when queries fail
      "alt_en": "Stack of refined copper cathodes",
      "alt_fr": "Pile de cathodes de cuivre raffiné"
    },
    // ... 24 more
  ],
  "content": [
    {
      "title_match_en": "DRC Copper Export Reaches Record High",
      "queries": ["copper mine africa", "copper smelting plant"],
      "alt_en": "Open-pit copper mine in central Africa"
    },
    // ... ~19 more
  ],
  "companies": [
    {
      "id": "c0000000-0000-0000-0000-000000000001",
      "slug": "kct",
      "initials": "KCT",
      "name": "Katanga Copper Trading"
    },
    // ... 14 more
  ]
}
```

Manifest is hand-curated. Queries are ordered by preference — fetch script tries them in order until one returns a usable result.

### Fetch script flow (`scripts/seed-images/fetch.ts`)

```
for each entry in manifest.products + manifest.content:
  if public/seed-images/<category>/<slug>.webp exists and not --force:
    skip
  for each query in entry.queries:
    hit Unsplash /search/photos?query=<q>&orientation=<o>&per_page=5
    if no results: try Pexels /v1/search
    if still none: log warning, continue
    pick first result
    download raw image
    sharp resize to target dimensions (1200×1200 for products, 1600×900 for content)
    sharp .webp({ quality: 85 }).pipe(write)
    append to ATTRIBUTIONS.md: {file, photographer, source_url, license, fetched_at}
    break
```

Idempotent. Re-running only fetches missing files. `--force` re-fetches everything. `--only=products` scopes a run.

### Logo builder (`scripts/seed-images/build-logos.ts`)

Generates 15 SVG files. Template:

```svg
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0047AB"/>
      <stop offset="100%" stop-color="#FCD116"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="24" fill="url(#g)"/>
  <text x="100" y="118" font-family="Inter, sans-serif" font-weight="700" font-size="64"
        text-anchor="middle" fill="white">KCT</text>
</svg>
```

No external dependency. Initials come from `manifest.companies[].initials`. The gradient uses DRC flag colors (blue → yellow) to read as a sovereign trade portal rather than generic SaaS.

### Seed update

Three `UPDATE` blocks at the bottom of `seed.sql` are rewritten:

```sql
UPDATE public.companies SET logo_url = '/seed-images/companies/' || u.slug || '.svg'
  FROM (VALUES ('c0000000-...', 'kct'), ...) AS u(id, slug)
  WHERE public.companies.id = u.id::uuid;

UPDATE public.products SET images = ARRAY['/seed-images/products/' || u.slug || '.webp']
  FROM (VALUES ('d0000000-...', 'copper-cathode'), ...) AS u(id, slug)
  WHERE public.products.id = u.id::uuid;

UPDATE public.content_items SET cover_url = '/seed-images/content/' || slug || '.webp'
  WHERE status = 'published' AND cover_url LIKE '%placehold.co%';
```

## API keys

Add to `.env.local` (gitignored), with `.env.example` documenting names:

```
UNSPLASH_ACCESS_KEY=        # https://unsplash.com/developers (50 req/hr free)
PEXELS_API_KEY=             # https://www.pexels.com/api/ (200 req/hr free)
```

`fetch.ts` reads from `process.env`. Fails early with a clear message if missing.

## Licensing trail

Even though Unsplash and Pexels licenses don't require attribution, we generate `public/seed-images/ATTRIBUTIONS.md` and commit it. Format:

```markdown
# Seed image attributions

Generated by `scripts/seed-images/fetch.ts` on 2026-05-18.
All photos sourced under the Unsplash License or Pexels License — free for
commercial use, no attribution required. We credit photographers as courtesy.

## Products
- products/copper-cathode.webp — Photo by Jane Doe on Unsplash (https://unsplash.com/photos/...)
- products/virunga-arabica.webp — Photo by John Smith on Pexels (https://www.pexels.com/photo/...)
...
```

This is our trust trail if a government stakeholder asks "where did these come from?"

## Image optimization

Every photo:

- Resized to fixed target (products 1200×1200, content 1600×900) using `sharp` `.cover` fit so faces/subjects don't get squashed.
- Re-encoded as WebP at quality 85 (visually lossless at typical viewing size, ~5× smaller than JPEG).
- Metadata stripped (no EXIF, no GPS).
- Target size: products ≤200 KB, content ≤250 KB. Hard-fail the script if any output exceeds 400 KB.

Total budget: ~10 MB of repo bloat. Acceptable for a project of this size.

## Frontend integration

No frontend code changes required. Existing components already render `images[0]` for products and `cover_url` for content. We're swapping the URL strings, not the data shape. SVG monograms work because `<Image>` and `<img>` both accept SVG sources; we'll set `unoptimized` on `next/image` for SVGs to skip pointless re-encoding.

One exception: `next.config` needs to confirm SVG is allowed via `dangerouslyAllowSVG: true`. Since these SVGs are generated by our own build script (no untrusted input), this is safe. Document this in `next.config.ts` with an inline comment.

## Testing plan

- **Script tests** (`scripts/seed-images/__tests__/fetch.test.ts`):
  - Manifest schema validation (every product UUID in manifest matches one in `seed.sql`).
  - File-size budget check (no `.webp` over 400 KB).
  - Attributions completeness (every output file has an entry in `ATTRIBUTIONS.md`).
- **Seed integrity**: after running fetch + applying seed locally, `SELECT count(*) FROM products WHERE images[1] LIKE '/seed-images/%'` must return 25.
- **Visual smoke**: spin up `npm run dev`, hit `/products`, `/companies`, `/news`, confirm no broken-image icons. (Document, not automated.)
- **Build check**: `npm run build` must still pass (catches missing assets via `next/image` warnings if any).

## Risks

1. **Unsplash search returns irrelevant photos for niche terms** (coltan, garri, afrormosia). Mitigation: manifest has 2-3 query candidates per entry; if all fail, we drop in a hand-picked URL override field (`override_url?: string`).
2. **Repo bloat creeps over time as more seed rows land.** Mitigation: `.gitattributes` filter to mark `public/seed-images/**` as `linguist-vendored` (keeps GitHub language-stats clean); revisit Supabase Storage when total exceeds 20 MB.
3. **API quotas during dev.** Both APIs cache aggressively if we call `--only` filters. Script logs remaining quota header per request.

## Open questions

None. All decisions locked via brainstorming session.

## Next step

Hand off to `superpowers:writing-plans` to produce a task-by-task implementation plan (manifest authoring → script scaffolding → API integration → optimization → seed rewrite → tests → commit).
