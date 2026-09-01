import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ManifestSchema } from "./manifest.schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
