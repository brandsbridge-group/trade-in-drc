import sharp from "sharp";

export type ImageKind = "product" | "content";

const TARGETS: Record<ImageKind, { width: number; height: number }> = {
  product: { width: 1200, height: 1200 },
  content: { width: 1600, height: 900 },
};

const WEBP_QUALITY_STEPS = [85, 75, 65, 55];
const HARD_LIMIT_BYTES = 400 * 1024;

export async function optimizeToWebp(input: Buffer, kind: ImageKind): Promise<Buffer> {
  const { width, height } = TARGETS[kind];
  const resized = sharp(input)
    .rotate()
    .resize({ width, height, fit: "cover", position: "attention" });

  for (const quality of WEBP_QUALITY_STEPS) {
    const out = await resized.clone().webp({ quality }).toBuffer();
    if (out.byteLength <= HARD_LIMIT_BYTES) return out;
  }

  // Last resort: quality 55 result (smallest produced)
  const fallback = await resized.clone().webp({ quality: WEBP_QUALITY_STEPS.at(-1)! }).toBuffer();
  throw new Error(
    `optimized image is ${fallback.byteLength} bytes even at quality ${WEBP_QUALITY_STEPS.at(-1)}, exceeds ${HARD_LIMIT_BYTES} hard limit`,
  );
}
