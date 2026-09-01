"use server";

import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import {
  GENERAL_SETTINGS_KEY,
  DEFAULT_GENERAL_SETTINGS,
  generalSettingsSchema,
  carouselSchema,
  featuredSchema,
  type ActionResult,
  type GeneralSettings,
  type CarouselSlideInput,
  type CarouselSlideRow,
  type CompanyOption,
  type FeaturedCompanyRow,
} from "./constants";

/**
 * Admin settings server actions (cluster C4): general site settings (key/value),
 * homepage carousel slides, and featured-companies curation. All three tables
 * (00016) are admin-write via RLS `is_admin()`; we additionally re-gate every
 * action with `requireAdmin` and write an `audit_log` row (00015) for the trail.
 *
 * Reads use the request-scoped server client (RLS-aware). Writes + audit use the
 * service-role admin client, which never leaves this server module.
 *
 * Constants, types, and Zod schemas live in `./constants` — a "use server"
 * module may only export async functions.
 */

async function getActorId(locale: string): Promise<string> {
  const actor = await requireAdmin(locale);
  return actor.id;
}

async function writeAudit(params: {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  metadata?: Json;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_log").insert({
    actor_id: params.actorId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    summary: params.summary,
    metadata: params.metadata ?? {},
  });
  if (error) {
    throw new Error(`Audit write failed: ${error.message}`);
  }
}

// --- General site settings -------------------------------------------------

export async function getGeneralSettings(locale: string): Promise<GeneralSettings> {
  await requireAdmin(locale);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", GENERAL_SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load settings: ${error.message}`);
  }

  const parsed = generalSettingsSchema.safeParse(data?.value);
  return parsed.success ? parsed.data : DEFAULT_GENERAL_SETTINGS;
}

export async function saveGeneralSettings(
  locale: string,
  input: GeneralSettings
): Promise<ActionResult> {
  const parsed = generalSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const actorId = await getActorId(locale);
  const admin = createAdminClient();

  const { error } = await admin
    .from("site_settings")
    .upsert(
      { key: GENERAL_SETTINGS_KEY, value: parsed.data },
      { onConflict: "key" }
    );
  if (error) {
    return { ok: false, error: error.message };
  }

  await writeAudit({
    actorId,
    action: "settings.general.update",
    entityType: "site_settings",
    entityId: null,
    summary: "General site settings updated",
  });

  revalidatePath(`/${locale}/admin/settings`);
  revalidatePath(`/${locale}`);
  return { ok: true };
}

// --- Carousel slides -------------------------------------------------------

export async function listCarouselSlides(locale: string): Promise<CarouselSlideRow[]> {
  await requireAdmin(locale);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("carousel_slides")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    throw new Error(`Failed to load slides: ${error.message}`);
  }
  return (data ?? []).map((s) => ({
    id: s.id,
    title_en: s.title_en,
    title_fr: s.title_fr,
    subtitle_en: s.subtitle_en ?? "",
    subtitle_fr: s.subtitle_fr ?? "",
    image_url: s.image_url,
    cta_label_en: s.cta_label_en ?? "",
    cta_label_fr: s.cta_label_fr ?? "",
    cta_href: s.cta_href ?? "",
    sort_order: s.sort_order,
    active: s.active,
  }));
}

export async function saveCarouselSlide(
  locale: string,
  input: CarouselSlideInput
): Promise<ActionResult> {
  const parsed = carouselSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const actorId = await getActorId(locale);
  const admin = createAdminClient();
  const { id, ...fields } = parsed.data;

  // Normalize empty optional strings to NULL so the public read stays clean.
  const payload = {
    title_en: fields.title_en,
    title_fr: fields.title_fr,
    subtitle_en: fields.subtitle_en || null,
    subtitle_fr: fields.subtitle_fr || null,
    image_url: fields.image_url,
    cta_label_en: fields.cta_label_en || null,
    cta_label_fr: fields.cta_label_fr || null,
    cta_href: fields.cta_href || null,
    sort_order: fields.sort_order,
    active: fields.active,
  };

  const { error } = id
    ? await admin.from("carousel_slides").update(payload).eq("id", id)
    : await admin.from("carousel_slides").insert(payload);

  if (error) {
    return { ok: false, error: error.message };
  }

  await writeAudit({
    actorId,
    action: id ? "carousel.slide.update" : "carousel.slide.create",
    entityType: "carousel_slides",
    entityId: id ?? null,
    summary: id ? `Slide updated: ${fields.title_en}` : `Slide created: ${fields.title_en}`,
  });

  revalidatePath(`/${locale}/admin/settings`);
  revalidatePath(`/${locale}`);
  return { ok: true };
}

export async function deleteCarouselSlide(
  locale: string,
  id: string
): Promise<ActionResult> {
  const parsed = dbId().safeParse(id);
  if (!parsed.success) {
    return { ok: false, error: "Invalid slide id" };
  }
  const actorId = await getActorId(locale);
  const admin = createAdminClient();
  const { error } = await admin.from("carousel_slides").delete().eq("id", parsed.data);
  if (error) {
    return { ok: false, error: error.message };
  }
  await writeAudit({
    actorId,
    action: "carousel.slide.delete",
    entityType: "carousel_slides",
    entityId: parsed.data,
    summary: "Slide deleted",
  });
  revalidatePath(`/${locale}/admin/settings`);
  revalidatePath(`/${locale}`);
  return { ok: true };
}

// --- Featured companies ----------------------------------------------------

/** Verified companies eligible to be featured (excludes already-featured ones). */
export async function listFeaturedCandidates(locale: string): Promise<CompanyOption[]> {
  await requireAdmin(locale);
  const admin = createAdminClient();

  const [{ data: companies, error: cErr }, { data: featured, error: fErr }] =
    await Promise.all([
      admin
        .from("companies")
        .select("id, name")
        .eq("status", "verified")
        .order("name", { ascending: true }),
      admin.from("featured_companies").select("company_id"),
    ]);

  if (cErr) throw new Error(`Failed to load companies: ${cErr.message}`);
  if (fErr) throw new Error(`Failed to load featured: ${fErr.message}`);

  const featuredIds = new Set((featured ?? []).map((f) => f.company_id));
  return (companies ?? [])
    .filter((c) => !featuredIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name }));
}

export async function listFeaturedCompanies(locale: string): Promise<FeaturedCompanyRow[]> {
  await requireAdmin(locale);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("featured_companies")
    .select("id, company_id, sort_order, active, companies(name)")
    .order("sort_order", { ascending: true });
  if (error) {
    throw new Error(`Failed to load featured companies: ${error.message}`);
  }
  return (data ?? []).map((f) => {
    const company = Array.isArray(f.companies) ? f.companies[0] : f.companies;
    return {
      id: f.id,
      companyId: f.company_id,
      companyName: (company as { name: string } | null)?.name ?? "—",
      sortOrder: f.sort_order,
      active: f.active,
    };
  });
}

export async function addFeaturedCompany(
  locale: string,
  input: { company_id: string; sort_order: number; active: boolean }
): Promise<ActionResult> {
  const parsed = featuredSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const actorId = await getActorId(locale);
  const admin = createAdminClient();
  const { error } = await admin.from("featured_companies").insert(parsed.data);
  if (error) {
    return { ok: false, error: error.message };
  }
  await writeAudit({
    actorId,
    action: "featured.company.add",
    entityType: "featured_companies",
    entityId: parsed.data.company_id,
    summary: "Company featured on homepage",
  });
  revalidatePath(`/${locale}/admin/settings`);
  revalidatePath(`/${locale}`);
  return { ok: true };
}

export async function setFeaturedActive(
  locale: string,
  input: { id: string; active: boolean }
): Promise<ActionResult> {
  const parsed = z
    .object({ id: dbId(), active: z.boolean() })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input" };
  }
  const actorId = await getActorId(locale);
  const admin = createAdminClient();
  const { error } = await admin
    .from("featured_companies")
    .update({ active: parsed.data.active })
    .eq("id", parsed.data.id);
  if (error) {
    return { ok: false, error: error.message };
  }
  await writeAudit({
    actorId,
    action: "featured.company.toggle",
    entityType: "featured_companies",
    entityId: parsed.data.id,
    summary: parsed.data.active ? "Feature activated" : "Feature deactivated",
  });
  revalidatePath(`/${locale}/admin/settings`);
  revalidatePath(`/${locale}`);
  return { ok: true };
}

export async function removeFeaturedCompany(
  locale: string,
  id: string
): Promise<ActionResult> {
  const parsed = dbId().safeParse(id);
  if (!parsed.success) {
    return { ok: false, error: "Invalid id" };
  }
  const actorId = await getActorId(locale);
  const admin = createAdminClient();
  const { error } = await admin.from("featured_companies").delete().eq("id", parsed.data);
  if (error) {
    return { ok: false, error: error.message };
  }
  await writeAudit({
    actorId,
    action: "featured.company.remove",
    entityType: "featured_companies",
    entityId: parsed.data,
    summary: "Company unfeatured",
  });
  revalidatePath(`/${locale}/admin/settings`);
  revalidatePath(`/${locale}`);
  return { ok: true };
}
