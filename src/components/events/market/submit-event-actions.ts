"use server";

import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/content/slug";
import { EVENT_TYPES } from "./event-constants";

const submitEventSchema = z.object({
  eventName: z.string().trim().min(2).max(200),
  eventType: z.enum(EVENT_TYPES),
  sectorId: dbId().optional().or(z.literal("")),
  date: z.string().trim().min(1).max(40),
  location: z.string().trim().min(2).max(160),
  organizer: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(200),
});

export type SubmitEventInput = z.infer<typeof submitEventSchema>;

interface Result {
  ok: boolean;
  error?: "invalid" | "server";
}

/**
 * Compose a stable, collision-resistant slug from the event name plus a suffix
 * derived from the supplied date (no Math.random / Date.now at render time).
 */
function buildSlug(eventName: string, date: string): string {
  const base = slugify(eventName) || "event";
  const suffix = slugify(date).slice(0, 12) || "tbd";
  return `${base}-${suffix}`;
}

function toStartTimestamp(date: string): string | null {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/**
 * Events-hub "Submit an Event" rail (design 13). Anonymous-friendly: inserts a
 * `draft` content_items row (type='event') via the service-role client so it
 * lands in the admin moderation queue at /admin/content/event. author_id is
 * NULL; the organizer email is captured in the body text for the reviewer.
 */
export async function submitEvent(input: SubmitEventInput): Promise<Result> {
  const parsed = submitEventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;

  const startAt = toStartTimestamp(d.date);
  const bodyEn = `Submitted event. Organizer: ${d.organizer}. Contact: ${d.email}.`;
  const bodyFr = `Événement soumis. Organisateur : ${d.organizer}. Contact : ${d.email}.`;
  const excerpt = `${d.organizer} — ${d.location}`.slice(0, 300);

  const admin = createAdminClient();
  const { error } = await admin.from("content_items").insert({
    type: "event",
    status: "draft",
    slug: buildSlug(d.eventName, d.date),
    title_en: d.eventName,
    title_fr: d.eventName,
    excerpt_en: excerpt,
    excerpt_fr: excerpt,
    body_en: bodyEn,
    body_fr: bodyFr,
    author_id: null,
    published_at: null,
    event_type: d.eventType,
    event_start_at: startAt,
    event_location: d.location,
    organizer: d.organizer,
    sector_id: d.sectorId || null,
  });

  if (error) {
    console.error("[submitEvent]", error.code, error.message);
    return { ok: false, error: "server" };
  }
  return { ok: true };
}
