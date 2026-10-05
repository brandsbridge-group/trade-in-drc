"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, Loader2, MessageSquare, XCircle } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { VERIFICATION_DECISION, VERIFICATION_TIERS, VERIFICATION_TIER } from "@/constants/status";
import type { VerificationTier } from "@/constants/status";
import { submitVerificationDecision } from "@/lib/verifications/actions";

interface DecisionPanelProps {
  companyId: string;
  /** Required documents / identifiers not on file: approving then needs an explicit override. */
  incomplete?: boolean;
  /** Documents the reviewer refused: approving on top of them is almost always a mistake. */
  refusedDocuments?: number;
}

type PanelDecision =
  | typeof VERIFICATION_DECISION.APPROVED
  | typeof VERIFICATION_DECISION.REJECTED
  | typeof VERIFICATION_DECISION.MORE_INFO_REQUESTED;

const DECISION_META: Record<PanelDecision, { labelKey: string; selected: string; icon: React.ElementType; requiresNotes: boolean }> = {
  [VERIFICATION_DECISION.APPROVED]: {
    labelKey: "decision.approve",
    selected: "bg-emerald-600 text-white ring-emerald-600",
    icon: CheckCircle,
    requiresNotes: false,
  },
  [VERIFICATION_DECISION.MORE_INFO_REQUESTED]: {
    labelKey: "decision.requestInfo",
    selected: "bg-amber-500 text-white ring-amber-500",
    icon: MessageSquare,
    requiresNotes: true,
  },
  [VERIFICATION_DECISION.REJECTED]: {
    labelKey: "decision.reject",
    selected: "bg-red-600 text-white ring-red-600",
    icon: XCircle,
    requiresNotes: true,
  },
};

const PANEL_DECISIONS: PanelDecision[] = [
  VERIFICATION_DECISION.APPROVED,
  VERIFICATION_DECISION.MORE_INFO_REQUESTED,
  VERIFICATION_DECISION.REJECTED,
];

// Tiers staff may grant on approval — `none` is excluded because approving to
// "not verified" is meaningless; demotion happens via reject / request-info.
const GRANTABLE_TIERS = VERIFICATION_TIERS.filter((t) => t !== VERIFICATION_TIER.NONE) as VerificationTier[];

const FIELD =
  "w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors focus:border-market-navy";

/** The reviewer's decision on a file: approve (with a tier), ask for more, or reject — each leaves a trail entry. */
export function DecisionPanel({ companyId, incomplete = false, refusedDocuments = 0 }: DecisionPanelProps) {
  const t = useTranslations("Admin.verifications");
  const tBadge = useTranslations("Trust.badge");
  const locale = useLocale();
  const router = useRouter();

  const [selectedDecision, setSelectedDecision] = React.useState<PanelDecision | null>(null);
  const [tier, setTier] = React.useState<VerificationTier>(VERIFICATION_TIER.VERIFIED);
  const [notes, setNotes] = React.useState("");
  const [override, setOverride] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const isApprove = selectedDecision === VERIFICATION_DECISION.APPROVED;
  const needsOverride = isApprove && incomplete;

  const handleSubmit = async () => {
    if (!selectedDecision) return;
    const meta = DECISION_META[selectedDecision];

    if (meta.requiresNotes && !notes.trim()) {
      toast.error(t("errors.notesRequired"));
      return;
    }
    if (needsOverride && !override) {
      toast.error(t("errors.missing_requirements"));
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading(t("submitting"));

    try {
      const result = await submitVerificationDecision({
        companyId,
        decision: selectedDecision,
        tier: isApprove ? tier : undefined,
        notes: notes.trim() || undefined,
        overrideMissing: needsOverride ? override : undefined,
        locale,
      });

      if (!result.ok) {
        toast.error(t(`errors.${result.error ?? "generic"}`), { id: toastId });
        return;
      }

      toast.success(t(`success.${selectedDecision}`), { id: toastId });
      router.push("/console/verifications");
      router.refresh();
    } catch {
      toast.error(t("errors.generic"), { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label={t("decision.title")} className="grid gap-2">
        {PANEL_DECISIONS.map((key) => {
          const meta = DECISION_META[key];
          const Icon = meta.icon;
          const isSelected = selectedDecision === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelectedDecision(key)}
              disabled={submitting}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-semibold ring-1 transition-colors disabled:opacity-60",
                isSelected ? meta.selected : "bg-white text-market-navy ring-slate-200 hover:bg-slate-50"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {t(meta.labelKey)}
            </button>
          );
        })}
      </div>

      {selectedDecision && (
        <div className="space-y-3 border-t border-slate-100 pt-3">
          {isApprove && (
            <div>
              <label htmlFor="decision-tier" className="mb-1 block text-xs font-semibold text-slate-700">
                {t("decision.tierLabel")}
              </label>
              <select id="decision-tier" value={tier} onChange={(e) => setTier(e.target.value as VerificationTier)} disabled={submitting} className={cn(FIELD, "h-10")}>
                {GRANTABLE_TIERS.map((tierOption) => (
                  <option key={tierOption} value={tierOption}>
                    {tBadge(tierOption)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-500">{t("decision.tierHint")}</p>
            </div>
          )}

          {isApprove && refusedDocuments > 0 && (
            <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {t("decision.refusedWarning", { count: refusedDocuments })}
            </p>
          )}

          {needsOverride && (
            <label className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900 ring-1 ring-amber-200">
              <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} disabled={submitting} className="mt-0.5 h-4 w-4 shrink-0 accent-[#0B1F3A]" />
              <span>
                <span className="block font-semibold">{t("decision.incompleteTitle")}</span>
                {t("decision.incompleteOverride")}
              </span>
            </label>
          )}

          <div>
            <label htmlFor="decision-notes" className="mb-1 block text-xs font-semibold text-slate-700">
              {DECISION_META[selectedDecision].requiresNotes ? t("decision.notesRequired") : t("decision.notesOptional")}
            </label>
            <textarea
              id="decision-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("decision.notesPlaceholder")}
              rows={4}
              maxLength={2000}
              disabled={submitting}
              className={cn(FIELD, "resize-y py-2")}
            />
            <p className="mt-1 text-[11px] text-slate-500">{t("decision.notesVisible")}</p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || (needsOverride && !override)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-market-navy px-4 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t("decision.submit")}
          </button>
        </div>
      )}
    </div>
  );
}
