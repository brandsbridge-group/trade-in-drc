import {
  BarChart3,
  Globe,
  Handshake,
  Headset,
  Inbox,
  Search,
  type LucideIcon,
} from "lucide-react";
import type { Translator } from "./types";

/** Icons for the 6 benefits — order matches `Premium.benefits`. */
const BENEFIT_ICONS: readonly LucideIcon[] = [
  Search, // Priority in Search Results
  Inbox, // Receive Qualified Business Requests
  Globe, // Bilingual Profile (FR/EN)
  Handshake, // B2B Meetings
  Headset, // BrandsBridge Support
  BarChart3, // Visibility Reports
];

interface BenefitItem {
  title: string;
  description: string;
}

/**
 * White 6-up benefits strip (design 12): circular line-icon + title + one-liner.
 */
export function BenefitsStrip({ t }: { t: Translator }) {
  const items = t.raw("benefits") as BenefitItem[];

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1500px] px-4 py-9 md:px-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {items.map((item, i) => {
            const Icon = BENEFIT_ICONS[i] ?? Search;
            return (
              <div key={item.title} className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-market-navy/25 text-market-navy">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-snug text-market-navy">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
