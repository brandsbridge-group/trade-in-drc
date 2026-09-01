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
