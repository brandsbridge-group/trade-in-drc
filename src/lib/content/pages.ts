import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";

/**
 * Typed fetchers for the CMS tables introduced in migration 00017:
 *   page_content   — static editorial pages keyed by slug (About, How It Works,
 *                    Sectors intro, legal slugs). Bilingual JSONB body.
 *   faqs           — bilingual question/answer pairs, optionally categorised.
 *   help_articles  — slug-addressable help-center articles, bilingual JSONB body.
 *
 * All reads run through the request-scoped server client so public RLS policies
 * (published-only) apply. Admin reads happen inside admin pages which already
 * authenticate via the same client — their RLS policy grants full access.
 */

// Canonical 5-locale type (en/fr/tr/es/zh). The pick helpers below fall back to
// English for any locale without a stored value, so non-EN/FR render gracefully.
export type { Locale } from "@/config/locales";
import type { Locale } from "@/config/locales";

export type PageContentRow = Database["public"]["Tables"]["page_content"]["Row"];
export type FaqRow = Database["public"]["Tables"]["faqs"]["Row"];
export type HelpArticleRow = Database["public"]["Tables"]["help_articles"]["Row"];

/**
 * Stable slugs the platform renders as editorial pages. Admin editors target
 * these; the public surfaces resolve them by slug. Keeping the list central
 * lets the admin UI seed missing rows and prevents typos.
 */
export const PAGE_CONTENT_SLUGS = [
  "about",
  "how-it-works",
  "sectors-intro",
  "terms",
  "privacy",
  "cookies",
] as const;

export type PageContentSlug = (typeof PAGE_CONTENT_SLUGS)[number];

export interface LocalizedPage {
  slug: string;
  title: string;
  body: Json;
  status: PageContentRow["status"];
  updatedAt: string;
}

export interface LocalizedFaq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

export interface LocalizedHelpArticle {
  id: string;
  slug: string;
  title: string;
  body: Json;
  category: string | null;
}

function pickTitle(row: PageContentRow | HelpArticleRow, locale: Locale): string {
  return locale === "fr" ? row.title_fr : row.title_en;
}

function pickBody(row: PageContentRow | HelpArticleRow, locale: Locale): Json {
  return locale === "fr" ? row.body_fr : row.body_en;
}

/**
 * Fetch a single published editorial page by slug, localized. Returns null when
 * the page does not exist or is not published (public RLS hides drafts).
 */
export async function fetchPageContent(
  slug: string,
  locale: Locale
): Promise<LocalizedPage | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("page_content")
    .select("slug, title_en, title_fr, body_en, body_fr, status, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[fetchPageContent] query failed", error.code, error.message);
    return null;
  }
  if (!data) return null;

  const row = data as unknown as PageContentRow;
  return {
    slug: row.slug,
    title: pickTitle(row, locale),
    body: pickBody(row, locale),
    status: row.status,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch the full set of CMS pages for the admin editor (drafts included — admin
 * RLS grants full read). Ordered by slug for a stable list.
 */
export async function fetchAllPageContent(): Promise<PageContentRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("page_content")
    .select("*")
    .order("slug", { ascending: true });

  if (error) {
    console.error("[fetchAllPageContent] query failed", error.code, error.message);
    return [];
  }
  return (data ?? []) as unknown as PageContentRow[];
}

/**
 * Fetch a single page_content row by slug (admin editor — drafts included).
 */
export async function fetchPageContentRow(slug: string): Promise<PageContentRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("page_content")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[fetchPageContentRow] query failed", error.code, error.message);
    return null;
  }
  return (data as unknown as PageContentRow) ?? null;
}

/**
 * Fetch published FAQs, localized, ordered by category then sort_order. Public
 * RLS already filters to published rows.
 */
export async function fetchPublishedFaqs(locale: Locale): Promise<LocalizedFaq[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("id, question_en, question_fr, answer_en, answer_fr, category, sort_order")
    .eq("published", true)
    .order("category", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[fetchPublishedFaqs] query failed", error.code, error.message);
    return [];
  }

  return ((data ?? []) as unknown as FaqRow[]).map((row) => ({
    id: row.id,
    question: locale === "fr" ? row.question_fr : row.question_en,
    answer: locale === "fr" ? row.answer_fr : row.answer_en,
    category: row.category,
  }));
}

/**
 * Fetch all FAQs for the admin editor (drafts included).
 */
export async function fetchAllFaqs(): Promise<FaqRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .order("category", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[fetchAllFaqs] query failed", error.code, error.message);
    return [];
  }
  return (data ?? []) as unknown as FaqRow[];
}

/**
 * Fetch a single FAQ row by id (admin editor).
 */
export async function fetchFaqRow(id: string): Promise<FaqRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[fetchFaqRow] query failed", error.code, error.message);
    return null;
  }
  return (data as unknown as FaqRow) ?? null;
}

/**
 * Fetch published help articles, localized, ordered by category then sort_order.
 */
export async function fetchPublishedHelpArticles(
  locale: Locale
): Promise<LocalizedHelpArticle[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("help_articles")
    .select("id, slug, title_en, title_fr, body_en, body_fr, category, sort_order")
    .eq("published", true)
    .order("category", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[fetchPublishedHelpArticles] query failed", error.code, error.message);
    return [];
  }

  return ((data ?? []) as unknown as HelpArticleRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: locale === "fr" ? row.title_fr : row.title_en,
    body: locale === "fr" ? row.body_fr : row.body_en,
    category: row.category,
  }));
}

/**
 * Fetch a single published help article by slug, localized. Returns null when
 * the article does not exist or is unpublished.
 */
export async function fetchPublishedHelpArticle(
  slug: string,
  locale: Locale
): Promise<LocalizedHelpArticle | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("help_articles")
    .select("id, slug, title_en, title_fr, body_en, body_fr, category, sort_order")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error("[fetchPublishedHelpArticle] query failed", error.code, error.message);
    return null;
  }
  if (!data) return null;

  const row = data as unknown as HelpArticleRow;
  return {
    id: row.id,
    slug: row.slug,
    title: locale === "fr" ? row.title_fr : row.title_en,
    body: locale === "fr" ? row.body_fr : row.body_en,
    category: row.category,
  };
}

/**
 * Fetch all help articles for the admin editor (drafts included).
 */
export async function fetchAllHelpArticles(): Promise<HelpArticleRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("help_articles")
    .select("*")
    .order("category", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[fetchAllHelpArticles] query failed", error.code, error.message);
    return [];
  }
  return (data ?? []) as unknown as HelpArticleRow[];
}

/**
 * Fetch a single help article row by id (admin editor — drafts included).
 */
export async function fetchHelpArticleRow(id: string): Promise<HelpArticleRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("help_articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[fetchHelpArticleRow] query failed", error.code, error.message);
    return null;
  }
  return (data as unknown as HelpArticleRow) ?? null;
}

/**
 * Render a JSONB body to plain paragraphs. The CMS stores body as a structured
 * JSON document; the editor persists `{ blocks: [{ type, text }] }`. This
 * normalizes the stored shape into an ordered list of paragraph strings so the
 * public renderers stay simple and resilient to empty / legacy shapes.
 */
export function bodyToParagraphs(body: Json): string[] {
  if (!body || typeof body !== "object") return [];

  // Structured editor shape: { blocks: [{ type: "paragraph", text: "..." }] }
  if (!Array.isArray(body)) {
    const blocks = (body as Record<string, unknown>).blocks;
    if (Array.isArray(blocks)) {
      return blocks
        .map((b) =>
          b && typeof b === "object" && "text" in b
            ? String((b as Record<string, unknown>).text ?? "")
            : ""
        )
        .filter((t) => t.trim().length > 0);
    }
    // Legacy single-string shape: { text: "..." }
    const text = (body as Record<string, unknown>).text;
    if (typeof text === "string" && text.trim().length > 0) {
      return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    }
  }
  return [];
}
