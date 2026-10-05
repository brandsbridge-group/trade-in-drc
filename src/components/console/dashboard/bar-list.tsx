import type { ReactNode } from "react";
import { SERIES_COLOR } from "@/components/dashboard/overview/activity-chart";

export interface BarListItem {
  key: string;
  label: string;
  /** Drives the bar length. */
  value: number;
  /** Formatted value shown at the end of the row. */
  valueText: string;
  /** Secondary reading under the label (never colour-coded). */
  note?: ReactNode;
}

/**
 * Ranked horizontal bars: one series, one colour, every row labelled with its
 * value (so no tooltip and no legend are needed). Bar length is relative to
 * `max`, which defaults to the largest value.
 */
export function BarList({ items, max }: { items: BarListItem[]; max?: number }) {
  const top = Math.max(max ?? 0, ...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0">
              <span className="block truncate font-medium text-market-navy">{item.label}</span>
              {item.note && <span className="block truncate text-[11.5px] text-slate-500">{item.note}</span>}
            </span>
            <span className="shrink-0 tabular-nums text-slate-600">{item.valueText}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(item.value > 0 ? 2 : 0, (item.value / top) * 100)}%`, backgroundColor: SERIES_COLOR.blue }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
