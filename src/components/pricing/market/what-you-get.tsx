import { Check } from "lucide-react";
import type { Translator } from "./types";

/**
 * "What You Get as a Premium Local Partner" card (design 12): 6 green-check
 * bullets in a bordered white card.
 */
export function WhatYouGet({ t }: { t: Translator }) {
  const items = t.raw("whatYouGet.items") as string[];

  return (
    <div className="h-full rounded-[0.75rem] border border-slate-200 bg-white p-6 sm:p-7">
      <h2 className="font-display text-xl font-bold tracking-tight text-market-navy">
        {t("whatYouGet.title")}
      </h2>
      <ul className="mt-5 space-y-3.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span className="text-sm leading-relaxed text-slate-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
