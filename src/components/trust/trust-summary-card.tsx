import type { VerificationSummary } from "@/lib/trust/types";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

const iconByStatus = {
  passed: CheckCircle2,
  pending: AlertCircle,
  failed: XCircle,
} as const;

export async function TrustSummaryCard({
  summary,
  locale,
}: {
  summary: VerificationSummary | null;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "Trust.report" });
  if (!summary || !summary.checks?.length) {
    return <p className="text-muted-foreground">{t("noSummary")}</p>;
  }
  return (
    <ul className="space-y-2">
      {summary.checks.map((c, idx) => {
        const Icon = iconByStatus[c.status];
        const tone =
          c.status === "passed"
            ? "text-emerald-700"
            : c.status === "failed"
              ? "text-red-700"
              : "text-amber-700";
        const note = locale === "fr" ? c.note_fr : c.note_en;
        return (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <Icon className={`w-4 h-4 mt-0.5 ${tone}`} />
            <div>
              <div className="font-medium">{t(`checks.${c.key}`)}</div>
              <div className="text-muted-foreground">
                {t(`status.${c.status}`)}
                {note ? ` — ${note}` : ""}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
