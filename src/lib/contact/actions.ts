"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Contact-form submission pipeline (Req #35).
 *
 * - Validates input with Zod at the boundary.
 * - Anti-spam: a hidden honeypot field (`company`) that real users never fill.
 * - Rate-limit: per-IP sliding window, enforced against the persisted rows so it
 *   survives across serverless invocations (no in-memory map that resets).
 * - Persists to `contact_submissions` using the service-role admin client so the
 *   insert succeeds for anonymous visitors while RLS keeps reads admin-only.
 *
 * The honeypot trap is intentionally treated as a silent success: bots get a
 * 200-style result and never learn the field is a trap, while no row is written.
 */

const NAME_MAX = 120;
const SUBJECT_MAX = 200;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 4000;

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 5 submissions per hour per IP

const contactSchema = z.object({
  name: z.string().trim().min(1).max(NAME_MAX),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().max(SUBJECT_MAX).optional().or(z.literal("")),
  message: z.string().trim().min(MESSAGE_MIN).max(MESSAGE_MAX),
  locale: z.string().trim().max(8).optional().or(z.literal("")),
  // Honeypot: must be empty for a genuine human submission.
  company: z.string().optional(),
});

export type ContactInput = z.input<typeof contactSchema>;

export interface ContactResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function clientIp(headerList: Headers): string | null {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headerList.get("x-real-ip");
  return real?.trim() || null;
}

export async function submitContactMessage(input: ContactInput): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { success: false, error: "validation_failed", fieldErrors };
  }

  const { name, email, subject, message, locale, company } = parsed.data;

  // Honeypot tripped — bot. Pretend success, persist nothing.
  if (company && company.trim().length > 0) {
    return { success: true };
  }

  const headerList = await headers();
  const ip = clientIp(headerList);

  const supabase = createAdminClient();

  // Per-IP rate-limit against persisted rows (survives cold starts).
  if (ip) {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count, error: countError } = await supabase
      .from("contact_submissions")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", since);

    if (countError) {
      console.error(
        "[submitContactMessage] rate-limit count failed",
        countError.code,
        countError.message
      );
    } else if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return { success: false, error: "rate_limited" };
    }
  }

  const { error: insertError } = await supabase.from("contact_submissions").insert({
    name,
    email,
    subject: subject && subject.length > 0 ? subject : null,
    message,
    locale: locale && locale.length > 0 ? locale : null,
    ip,
    status: "new",
  });

  if (insertError) {
    console.error(
      "[submitContactMessage] insert failed",
      insertError.code,
      insertError.message
    );
    return { success: false, error: "insert_failed" };
  }

  return { success: true };
}
