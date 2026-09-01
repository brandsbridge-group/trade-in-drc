"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Eye, ShieldCheck, Inbox, TrendingUp, type LucideIcon } from "lucide-react";

const ICONS: LucideIcon[] = [Eye, ShieldCheck, Inbox, TrendingUp];

interface BenefitItem {
  title: string;
  body: string;
}

/** Design 6 bottom benefits strip: 4 icon + title + one-liner cells. */
export function BenefitsStrip() {
  const t = useTranslations("RegisterCompany");
  const items = t.raw("benefits.items") as BenefitItem[];

  return (
    <section className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid w-full max-w-[1500px] gap-6 px-4 py-10 md:grid-cols-4 md:divide-x md:divide-slate-200 md:px-6">
        {items.map((item, i) => {
          const Icon = ICONS[i] ?? Eye;
          return (
            <div key={item.title} className="flex flex-col items-start gap-2 md:px-6">
              <span className="flex size-10 items-center justify-center rounded-full border border-market-navy/20 text-market-navy">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="text-sm font-bold text-market-navy">{item.title}</h3>
              <p className="text-xs leading-relaxed text-slate-600">{item.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
