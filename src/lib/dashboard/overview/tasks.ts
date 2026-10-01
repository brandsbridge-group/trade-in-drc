import type { CompletenessKey } from "./profile-completeness";

/**
 * Builds the "À faire maintenant" list on the dashboard home: what blocks the
 * company or loses it business, one action each, most urgent first.
 * Pure so the ordering rules are unit-tested (tasks.test.ts).
 */

export type TaskTone = "blocking" | "opportunity" | "improve" | "subscription" | "done";

export type TaskKind =
  | "verification_documents"
  | "verification_more_info"
  | "verification_rejected"
  | "verification_pending"
  | "messages_awaiting"
  | "responses_new"
  | "profile_incomplete"
  | "premium_expiring"
  | "premium_expired";

export interface DashboardTask {
  kind: TaskKind;
  tone: TaskTone;
  /** Lower comes first. */
  priority: number;
  companyId?: string;
  companyName?: string;
  /** Free-form values the UI interpolates into its copy. */
  values?: Record<string, string | number>;
}

export interface TaskCompany {
  id: string;
  name: string;
  status: string;
  latestReviewNotes?: string | null;
  premiumExpiresAt?: string | null;
  isPremium?: boolean;
}

export interface TaskInput {
  now: Date;
  companies: TaskCompany[];
  /** Conversations whose latest message was sent by someone else. */
  awaitingReplies: { count: number; oldestAt: string | null };
  /** Responses received on the company's opportunities in the last 7 days. */
  newResponses: number;
  completeness: { percent: number; missing: CompletenessKey[] } | null;
}

/** Visible cards on desktop; the rest is reachable from the list. */
export const MAX_TASKS = 4;
/** A Premium plan this close to expiry gets a renewal card. */
export const PREMIUM_WARNING_DAYS = 30;
/** Below this, profile completion is worth a card. */
export const COMPLETENESS_TARGET = 100;

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

export function buildDashboardTasks(input: TaskInput): DashboardTask[] {
  const tasks: DashboardTask[] = [];

  for (const c of input.companies) {
    const base = { companyId: c.id, companyName: c.name };
    switch (c.status) {
      case "pending_documents":
        tasks.push({ ...base, kind: "verification_documents", tone: "blocking", priority: 10 });
        break;
      case "more_info_requested":
        tasks.push({
          ...base,
          kind: "verification_more_info",
          tone: "blocking",
          priority: 11,
          values: c.latestReviewNotes ? { notes: c.latestReviewNotes } : undefined,
        });
        break;
      case "rejected":
        tasks.push({
          ...base,
          kind: "verification_rejected",
          tone: "blocking",
          priority: 12,
          values: c.latestReviewNotes ? { notes: c.latestReviewNotes } : undefined,
        });
        break;
      case "pending":
        tasks.push({ ...base, kind: "verification_pending", tone: "done", priority: 60 });
        break;
    }

    if (c.isPremium && c.premiumExpiresAt) {
      const days = daysBetween(input.now, new Date(c.premiumExpiresAt));
      if (days < 0) {
        tasks.push({ ...base, kind: "premium_expired", tone: "subscription", priority: 30 });
      } else if (days <= PREMIUM_WARNING_DAYS) {
        tasks.push({ ...base, kind: "premium_expiring", tone: "subscription", priority: 40, values: { days } });
      }
    }
  }

  if (input.awaitingReplies.count > 0) {
    const days = input.awaitingReplies.oldestAt
      ? Math.max(0, daysBetween(new Date(input.awaitingReplies.oldestAt), input.now))
      : 0;
    tasks.push({
      kind: "messages_awaiting",
      tone: "opportunity",
      priority: 20,
      values: { count: input.awaitingReplies.count, days },
    });
  }

  if (input.newResponses > 0) {
    tasks.push({ kind: "responses_new", tone: "opportunity", priority: 21, values: { count: input.newResponses } });
  }

  if (input.completeness && input.completeness.percent < COMPLETENESS_TARGET) {
    tasks.push({
      kind: "profile_incomplete",
      tone: "improve",
      priority: 50,
      values: {
        percent: input.completeness.percent,
        first: input.completeness.missing[0] ?? "",
        second: input.completeness.missing[1] ?? "",
      },
    });
  }

  return tasks.sort((a, b) => a.priority - b.priority);
}
