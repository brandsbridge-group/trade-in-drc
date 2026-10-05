import { Check, MessageSquareWarning, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineTone = "sent" | "approved" | "rejected" | "info";

export interface TimelineItem {
  id: string;
  tone: TimelineTone;
  title: string;
  /** Already formatted for the reader. */
  date: string;
  /** Who acted ("Company", a reviewer's name…). */
  actor?: string | null;
  notes?: string | null;
}

const TONE: Record<TimelineTone, { dot: string; Icon: typeof Check }> = {
  sent: { dot: "bg-blue-50 text-blue-700", Icon: Send },
  approved: { dot: "bg-emerald-50 text-emerald-700", Icon: Check },
  rejected: { dot: "bg-red-50 text-red-700", Icon: X },
  info: { dot: "bg-amber-100 text-amber-800", Icon: MessageSquareWarning },
};

/**
 * The trail of a verification file, newest first: who did what, when, and the
 * message that went with it. Shared by the console's review screen and the
 * company's own verification screen (which passes owner-safe notes).
 */
export function VerificationTimeline({ items, empty }: { items: TimelineItem[]; empty: string }) {
  if (items.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">{empty}</p>;
  }
  return (
    <ol className="space-y-0">
      {items.map((item, index) => {
        const tone = TONE[item.tone];
        const last = index === items.length - 1;
        return (
          <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Connector to the next (older) event. */}
            {!last && <span aria-hidden className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-slate-200" />}
            <span className={cn("relative grid h-8 w-8 shrink-0 place-items-center rounded-full", tone.dot)} aria-hidden>
              <tone.Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[13px] font-semibold text-market-navy">{item.title}</p>
              <p className="text-[11.5px] text-slate-500">
                {item.date}
                {item.actor ? ` · ${item.actor}` : ""}
              </p>
              {item.notes && (
                <p className="mt-1.5 whitespace-pre-line rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700">{item.notes}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Tone of an event from its `verification_reviews.decision`. */
export function toneOfDecision(decision: string): TimelineTone {
  if (decision === "approved") return "approved";
  if (decision === "rejected") return "rejected";
  if (decision === "more_info_requested") return "info";
  return "sent";
}
