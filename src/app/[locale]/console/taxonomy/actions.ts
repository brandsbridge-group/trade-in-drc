"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbId } from "@/lib/validation/db-id";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireCallerAdmin } from "@/lib/auth/require-caller-admin";
import {
  TAXONOMY_KINDS,
  slugifyTerm,
  validateTerm,
  type TermError,
  type TermField,
  type TermValues,
} from "@/lib/taxonomy/terms";

/**
 * Staff writes on the taxonomy (sectors, categories, HS codes, tags).
 *
 * They run as the signed-in staff member through the cookie-aware client, so
 * RLS stays the judge (00066: staff add and edit, only a super-admin deletes)
 * and the audit trigger records who did it. The database also refuses to
 * change an identifier or to delete an entry in use; these actions turn those
 * refusals into errors the screen can explain.
 */

const text = (max: number) => z.string().trim().max(max);

const valuesSchema = z.object({
  name_en: text(200),
  name_fr: text(200),
  name_es: text(200),
  name_tr: text(200),
  name_zh: text(200),
  slug: text(200),
  code: text(40),
  parent_code: text(40),
  sector_id: z.union([dbId(), z.literal("")]),
});

const saveSchema = z.object({
  kind: z.enum(TAXONOMY_KINDS),
  /** Absent = a new entry. */
  id: dbId().optional(),
  values: valuesSchema,
});

export type SaveTermInput = z.input<typeof saveSchema>;

export interface SaveTermResult {
  ok: boolean;
  error?: "not_authorized" | "validation_failed" | "duplicate" | "parent_unknown" | "write_failed";
  fieldErrors?: Partial<Record<TermField, TermError>>;
}

const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

const orNull = (value: string) => value.trim() || null;

export async function saveTerm(input: SaveTermInput): Promise<SaveTermResult> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation_failed" };

  const { kind, id } = parsed.data;
  const values: TermValues = parsed.data.values;
  const creating = !id;
  const fieldErrors = validateTerm(kind, values, creating);
  if (Object.keys(fieldErrors).length > 0) return { ok: false, error: "validation_failed", fieldErrors };

  const caller = await requireCallerAdmin();
  if (!caller.ok) return { ok: false, error: "not_authorized" };

  const supabase = await createServerSupabaseClient();
  const names = {
    name_en: values.name_en.trim(),
    name_fr: values.name_fr.trim(),
    name_es: orNull(values.name_es),
    name_tr: orNull(values.name_tr),
    name_zh: orNull(values.name_zh),
  };
  // The identifier is only ever written here, at creation.
  const slug = slugifyTerm(values.slug.trim() || values.name_en);

  let error: { code?: string } | null = null;

  if (kind === "sectors") {
    if (creating) {
      const { data: last } = await supabase.from("sectors").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
      ({ error } = await supabase.from("sectors").insert({ ...names, slug, sort_order: (last?.sort_order ?? 0) + 10 }));
    } else {
      ({ error } = await supabase.from("sectors").update(names).eq("id", id));
    }
  } else if (kind === "categories") {
    const sector_id = values.sector_id;
    if (creating) {
      const { data: last } = await supabase
        .from("categories")
        .select("sort_order")
        .eq("sector_id", sector_id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      ({ error } = await supabase.from("categories").insert({ ...names, slug, sector_id, sort_order: (last?.sort_order ?? 0) + 10 }));
    } else {
      ({ error } = await supabase.from("categories").update({ ...names, sector_id }).eq("id", id));
    }
  } else if (kind === "hs_codes") {
    const links = { parent_code: orNull(values.parent_code), sector_id: values.sector_id || null };
    ({ error } = creating
      ? await supabase.from("hs_codes").insert({ ...names, ...links, code: values.code.trim() })
      : await supabase.from("hs_codes").update({ ...names, ...links }).eq("id", id));
  } else {
    ({ error } = creating
      ? await supabase.from("tags").insert({ ...names, slug })
      : await supabase.from("tags").update(names).eq("id", id));
  }

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, error: "duplicate", fieldErrors: { [kind === "hs_codes" ? "code" : "slug"]: "invalid" } };
    }
    if (error.code === FOREIGN_KEY_VIOLATION) {
      return { ok: false, error: "parent_unknown", fieldErrors: { [kind === "hs_codes" ? "parent_code" : "sector_id"]: "invalid" } };
    }
    return { ok: false, error: "write_failed" };
  }

  revalidatePath("/console/taxonomy");
  return { ok: true };
}

const deleteSchema = z.object({ kind: z.enum(TAXONOMY_KINDS), id: dbId() });

export interface DeleteTermResult {
  ok: boolean;
  error?: "not_authorized" | "super_admin_only" | "in_use" | "validation_failed" | "write_failed";
}

export async function deleteTerm(input: z.input<typeof deleteSchema>): Promise<DeleteTermResult> {
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation_failed" };
  const caller = await requireCallerAdmin();
  if (!caller.ok) return { ok: false, error: "not_authorized" };

  const supabase = await createServerSupabaseClient();
  // Same helper as the RLS policy, so the answer here and in the database cannot differ.
  const { data: isSuperAdmin } = await supabase.rpc("is_super_admin");
  if (isSuperAdmin !== true) return { ok: false, error: "super_admin_only" };

  const { data, error } = await supabase.from(parsed.data.kind).delete().eq("id", parsed.data.id).select("id");
  if (error) {
    return { ok: false, error: /taxonomy_in_use/.test(error.message) ? "in_use" : "write_failed" };
  }
  // No row back = RLS filtered the delete out, or the entry was already gone.
  if (!data || data.length === 0) return { ok: false, error: "write_failed" };

  revalidatePath("/console/taxonomy");
  return { ok: true };
}

const reorderSchema = z.object({
  kind: z.enum(["sectors", "categories"]),
  /** Every entry of the list (all sectors, or the categories of one sector), in its new order. */
  ids: z.array(dbId()).min(1).max(300),
});

export interface ReorderTermsResult {
  ok: boolean;
  error?: "not_authorized" | "validation_failed" | "write_failed";
}

export async function reorderTerms(input: z.input<typeof reorderSchema>): Promise<ReorderTermsResult> {
  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation_failed" };
  const caller = await requireCallerAdmin();
  if (!caller.ok) return { ok: false, error: "not_authorized" };

  const { kind, ids } = parsed.data;
  const supabase = await createServerSupabaseClient();
  // The whole list is renumbered: two entries may share an order after older edits.
  const results = await Promise.all(
    ids.map((id, index) => supabase.from(kind).update({ sort_order: (index + 1) * 10 }).eq("id", id))
  );
  if (results.some((result) => result.error)) return { ok: false, error: "write_failed" };

  revalidatePath("/console/taxonomy");
  return { ok: true };
}
