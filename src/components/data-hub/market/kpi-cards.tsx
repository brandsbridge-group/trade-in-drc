import { DollarSign, Upload, Download, Users, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface KpiCardData {
  key: string;
  label: string;
  value: string;
  deltaPct: number | null;
  period: string;
}

/** Icon + accent tint per known metric key; falls back to a neutral trend. */
const KPI_STYLE: Record<string, { icon: LucideIcon; tint: string; fg: string }> = {
  total_trade_value: { icon: DollarSign, tint: "bg-slate-100", fg: "text-market-navy" },
  exports: { icon: Upload, tint: "bg-emerald-50", fg: "text-emerald-600" },
  imports: { icon: Download, tint: "bg-red-50", fg: "text-market-red" },
  active_companies: { icon: Users, tint: "bg-indigo-50", fg: "text-indigo-600" },
};

function formatDelta(delta: number): string {
  const rounded = Math.round(delta * 10) / 10;
  return `${rounded}%`;
}

/** Four KPI metric cards from `market_metrics`. */
export function KpiCards({ metrics }: { metrics: KpiCardData[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m) => {
        const style = KPI_STYLE[m.key] ?? {
          icon: TrendingUp,
          tint: "bg-slate-100",
          fg: "text-market-navy",
        };
        const Icon = style.icon;
        return (
          <div
            key={m.key}
            className="rounded-lg border border-slate-200 bg-white p-4 transition-shadow duration-150 hover:shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.tint} ${style.fg}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500">
                  {m.label}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="font-display text-2xl font-bold text-market-navy">
                    {m.value}
                  </span>
                  {m.deltaPct != null && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                      ▲ {formatDelta(m.deltaPct)}
                    </span>
                  )}
                </div>
                {m.period && (
                  <div className="mt-1 text-[0.7rem] text-slate-400">
                    {m.period}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
