import type {
  BusinessRequestStatus,
  BusinessRequestIntent,
} from "@/lib/supabase/types";

export interface AdminRequestRow {
  id: string;
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

/** Tailwind classes per status badge. Light theme, brand-aligned. */
export const STATUS_BADGE_CLASS: Record<BusinessRequestStatus, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
  converted: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};
