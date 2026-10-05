import type {
  BusinessRequestStatus,
  BusinessRequestIntent,
} from "@/lib/supabase/types";

export interface AdminRequestRow {
  id: string;
  reference: string | null;
  full_name: string;
  company_name: string | null;
  country: string | null;
  sector: string | null;
  intent: BusinessRequestIntent;
  status: BusinessRequestStatus;
  follow_up_owner: string | null;
  admin_notes: string | null;
  message: string;
  email: string;
  phone: string | null;
  preferred_location: string | null;
  timeline: string | null;
  created_at: string;
  submitter_name: string | null;
  /** Set when the request came from /pricing — which package was asked for. */
  promotion_plan: string | null;
  promotion_amount_usd: number | null;
  /** Company the request is addressed to — only such a request can be forwarded. */
  target_company_id: string | null;
  target_company_name: string | null;
  product_id: string | null;
  product_name: string | null;
  quantity: string | null;
  interest: string | null;
  /** When staff passed it on; from then the company reads it in its dashboard. */
  forwarded_at: string | null;
  /** Answers of the form that created the request (00065); read with `readPartnerRequestDetails`. */
  details: unknown;
  has_attachment: boolean;
  attachment_name: string | null;
}

export const STATUSES: BusinessRequestStatus[] = [
  "new",
  "in_progress",
  "converted",
  "pending",
  "closed",
  "rejected",
];

export const ALL = "__all__";

/** Status pill: soft tinted surface + readable text; the dot carries the hue. */
export const STATUS_BADGE_CLASS: Record<BusinessRequestStatus, string> = {
  new: "bg-blue-50 text-blue-700",
  in_progress: "bg-indigo-50 text-indigo-700",
  converted: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  closed: "bg-slate-100 text-slate-600",
  rejected: "bg-red-50 text-red-700",
};

export const STATUS_DOT_CLASS: Record<BusinessRequestStatus, string> = {
  new: "bg-blue-500",
  in_progress: "bg-indigo-500",
  converted: "bg-emerald-500",
  pending: "bg-amber-500",
  closed: "bg-slate-400",
  rejected: "bg-red-500",
};
