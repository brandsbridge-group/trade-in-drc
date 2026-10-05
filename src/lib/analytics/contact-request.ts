import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Counts one "contact request" for a company: a buyer wrote to it, whatever the
 * door — a direct message, a quote request on a product, the contact form of
 * its public page. This is what the dashboard's contact figures are made of
 * (`owner_dashboard_metrics`, `console_dashboard_metrics`).
 *
 * A plain module, NOT a server action: it writes with the service-role client
 * (analytics_events accepts no other writer) and must only be called from a
 * server action that has already validated the request. Best-effort — a failed
 * count is logged and never breaks the request that triggered it.
 */
export async function recordContactRequest(companyId: string): Promise<void> {
  try {
    const visitorId = (await cookies()).get("visitor_id")?.value ?? null;
    const { error } = await createAdminClient().from("analytics_events").insert({
      entity_type: "company",
      entity_id: companyId,
      event_type: "contact_request",
      visitor_id: visitorId,
    });
    if (error) console.error("[recordContactRequest]", error.code, error.message);
  } catch (err) {
    console.error("[recordContactRequest]", err);
  }
}
