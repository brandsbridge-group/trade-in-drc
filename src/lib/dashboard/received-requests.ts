import { createClient } from "@/lib/supabase/client";

/**
 * Buyer requests a company has received: a quote request on one of its
 * products, or a contact request from its public page — only once staff has
 * forwarded it (migration 00062).
 *
 * Owners cannot read `business_requests` (its rows hold staff-only notes), so
 * everything goes through the `company_received_requests()` and
 * `mark_received_requests_seen()` SECURITY DEFINER functions.
 */

export interface ReceivedRequest {
  id: string;
  reference: string | null;
  full_name: string;
  company_name: string | null;
  country: string | null;
  email: string;
  phone: string | null;
  quantity: string | null;
  interest: string | null;
  preferred_location: string | null;
  timeline: string | null;
  message: string;
  created_at: string;
  forwarded_at: string;
  /** NULL until the company opens its received requests. */
  supplier_seen_at: string | null;
  target_company_id: string;
  target_company_name: string;
  product_id: string | null;
  product_name: string | null;
  product_name_en: string | null;
  product_name_fr: string | null;
}

export type ReceivedRequestKind = "quote" | "contact";

export const receivedRequestsKey = (userId: string | undefined) => ["received-requests", userId] as const;

export async function fetchReceivedRequests(): Promise<ReceivedRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("company_received_requests");
  if (error) throw new Error(`company_received_requests failed: ${error.message}`);
  return (data ?? []) as ReceivedRequest[];
}

export async function markReceivedRequestsSeen(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("mark_received_requests_seen");
  if (error) throw new Error(`mark_received_requests_seen failed: ${error.message}`);
}

/** A request about a product is a quote request; anything else asks for contact. */
export function requestKind(request: Pick<ReceivedRequest, "product_id" | "quantity">): ReceivedRequestKind {
  return request.product_id || request.quantity ? "quote" : "contact";
}

/** Requests the company has not opened yet. */
export function unseenRequests<T extends Pick<ReceivedRequest, "supplier_seen_at">>(requests: T[]): T[] {
  return requests.filter((r) => !r.supplier_seen_at);
}

export const RECEIVED_VIEWS = ["all", "new", "quote", "contact"] as const;
export type ReceivedView = (typeof RECEIVED_VIEWS)[number];

type Filterable = Pick<
  ReceivedRequest,
  "id" | "product_id" | "quantity" | "full_name" | "company_name" | "country" | "email" | "reference" | "message" | "product_name" | "product_name_en" | "product_name_fr"
>;

function matchesView(request: Filterable, view: ReceivedView, newIds: ReadonlySet<string>): boolean {
  if (view === "all") return true;
  if (view === "new") return newIds.has(request.id);
  return requestKind(request) === view;
}

/**
 * The inbox's tabs and search box. "New" is what was unopened when the page
 * loaded (`newIds`), not the live flag: opening the page marks everything as
 * seen, and the tab must not empty itself under the reader.
 */
export function filterReceivedRequests<T extends Filterable>(
  requests: T[],
  options: { view: ReceivedView; query: string; newIds: ReadonlySet<string> }
): T[] {
  const q = options.query.trim().toLowerCase();
  return requests.filter((r) => {
    if (!matchesView(r, options.view, options.newIds)) return false;
    if (!q) return true;
    return [r.full_name, r.company_name, r.country, r.email, r.reference, r.message, r.product_name, r.product_name_en, r.product_name_fr]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
}

export function receivedViewCounts(requests: Filterable[], newIds: ReadonlySet<string>): Record<ReceivedView, number> {
  const counts = { all: 0, new: 0, quote: 0, contact: 0 };
  for (const r of requests) {
    for (const view of RECEIVED_VIEWS) if (matchesView(r, view, newIds)) counts[view] += 1;
  }
  return counts;
}

/** Product name in the reader's language, falling back to the name as typed. */
export function productLabel(
  request: Pick<ReceivedRequest, "product_name" | "product_name_en" | "product_name_fr">,
  locale: string
): string | null {
  const localized = locale === "fr" ? request.product_name_fr : request.product_name_en;
  return localized?.trim() || request.product_name?.trim() || null;
}

/** `mailto:` link that opens a reply to the buyer, with the subject filled in. */
export function replyMailto(email: string, subject: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
