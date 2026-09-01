import { z } from "zod";

const Uuid = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  "must look like a UUID (8-4-4-4-12 hex)",
);
const Slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "must be kebab-case lowercase");
const NonEmptyString = z.string().min(1);
const QueriesOrOverride = z.object({
  queries: z.array(NonEmptyString),
  override_url: z.url().nullable(),
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
