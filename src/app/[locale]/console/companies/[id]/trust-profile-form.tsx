"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  VERIFICATION_CHECK_KEYS,
  VERIFICATION_CHECK_STATUSES,
  verificationSummarySchema,
  parseVerificationSummary,
  normalizeSummary,
  type VerificationCheckKey,
  type VerificationCheckStatus,
} from "@/lib/trust/verification-summary";
import type { VerificationTier, VerificationCheck } from "@/lib/trust/types";

const TIER_OPTIONS: VerificationTier[] = ["none", "basic", "verified", "premium"];

const STATUS_ICON: Record<VerificationCheckStatus, typeof CheckCircle2> = {
  passed: CheckCircle2,
  pending: AlertCircle,
  failed: XCircle,
};

const STATUS_TONE: Record<VerificationCheckStatus, string> = {
  passed: "text-emerald-700",
  pending: "text-amber-700",
  failed: "text-red-700",
};

interface CheckState {
  status: VerificationCheckStatus;
  note_en: string;
  note_fr: string;
}

interface TrustProfileFormProps {
  companyId: string;
  initialTier: VerificationTier | null;
  initialSummary: unknown;
}

function buildInitialChecks(summary: unknown): Record<VerificationCheckKey, CheckState> {
  const parsed = parseVerificationSummary(summary);
  const byKey = new Map(parsed?.checks.map((c) => [c.key, c]) ?? []);
  const state = {} as Record<VerificationCheckKey, CheckState>;
  for (const key of VERIFICATION_CHECK_KEYS) {
    const existing = byKey.get(key);
    state[key] = {
      status: existing?.status ?? "pending",
      note_en: existing?.note_en ?? "",
      note_fr: existing?.note_fr ?? "",
    };
  }
  return state;
}

export function TrustProfileForm({
  companyId,
  initialTier,
  initialSummary,
}: TrustProfileFormProps) {
  const t = useTranslations("Trust.admin");
  const tChecks = useTranslations("Trust.report.checks");
  const tStatus = useTranslations("Trust.report.status");
  const tBadge = useTranslations("Trust.badge");
  const router = useRouter();

  const [tier, setTier] = React.useState<VerificationTier>(initialTier ?? "none");
  const [checks, setChecks] = React.useState<Record<VerificationCheckKey, CheckState>>(
    () => buildInitialChecks(initialSummary)
  );
  const initialNotes = React.useMemo(() => parseVerificationSummary(initialSummary), [initialSummary]);
  const [notesEn, setNotesEn] = React.useState(initialNotes?.notes_en ?? "");
  const [notesFr, setNotesFr] = React.useState(initialNotes?.notes_fr ?? "");
  const [saving, setSaving] = React.useState(false);

  const updateCheck = (key: VerificationCheckKey, patch: Partial<CheckState>) => {
    setChecks((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = "trust-profile-save";
    toast.loading(t("saving"), { id: toastId });

    try {
      // Only persist checks the reviewer actually marked passed/failed; pending
      // ones with no note are treated as "not yet assessed" and omitted.
      const builtChecks: VerificationCheck[] = VERIFICATION_CHECK_KEYS.flatMap((key) => {
        const c = checks[key];
        const hasNote = c.note_en.trim().length > 0 || c.note_fr.trim().length > 0;
        if (c.status === "pending" && !hasNote) return [];
        return [
          {
            key,
            status: c.status,
            ...(c.note_en.trim() ? { note_en: c.note_en.trim() } : {}),
            ...(c.note_fr.trim() ? { note_fr: c.note_fr.trim() } : {}),
          },
        ];
      });

      const candidate = {
        checks: builtChecks,
        ...(notesEn.trim() ? { notes_en: notesEn.trim() } : {}),
        ...(notesFr.trim() ? { notes_fr: notesFr.trim() } : {}),
      };

      const parsed = verificationSummarySchema.safeParse(candidate);
      if (!parsed.success) {
        toast.error(t("invalidSummary"), { id: toastId });
        return;
      }
      const summary = normalizeSummary(parsed.data);

      const supabase = createClient();
      const { error } = await supabase
        .from("companies")
        .update({
          verification_tier: tier,
          verification_summary: summary as never,
        } as never)
        .eq("id", companyId);
      if (error) throw error;

      toast.success(t("saved"), { id: toastId });
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("saveFailed");
      toast.error(message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tier */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("tierLabel")}
        </label>
        <Select value={tier} onValueChange={(v) => setTier(v as VerificationTier)}>
          <SelectTrigger className="h-8 text-sm w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIER_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt} className="text-sm">
                {tBadge(opt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Structured checklist */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("checklistLabel")}
        </label>
        <ul className="space-y-2.5">
          {VERIFICATION_CHECK_KEYS.map((key) => {
            const c = checks[key];
            const Icon = STATUS_ICON[c.status];
            return (
              <li
                key={key}
                className="rounded-lg border border-slate-200 p-3 space-y-2 bg-card"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", STATUS_TONE[c.status])} />
                    <span className="text-sm font-medium">{tChecks(key)}</span>
                  </div>
                  <Select
                    value={c.status}
                    onValueChange={(v) =>
                      updateCheck(key, { status: v as VerificationCheckStatus })
                    }
                  >
                    <SelectTrigger className="h-7 text-xs w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_CHECK_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {tStatus(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Textarea
                    className="text-xs min-h-[44px]"
                    placeholder={t("notePlaceholderEn")}
                    value={c.note_en}
                    onChange={(e) => updateCheck(key, { note_en: e.target.value })}
                    maxLength={500}
                  />
                  <Textarea
                    className="text-xs min-h-[44px]"
                    placeholder={t("notePlaceholderFr")}
                    value={c.note_fr}
                    onChange={(e) => updateCheck(key, { note_fr: e.target.value })}
                    maxLength={500}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Overall public notes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("notesLabelEn")}
          </label>
          <Textarea
            className="text-sm min-h-[60px]"
            value={notesEn}
            onChange={(e) => setNotesEn(e.target.value)}
            maxLength={2000}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("notesLabelFr")}
          </label>
          <Textarea
            className="text-sm min-h-[60px]"
            value={notesFr}
            onChange={(e) => setNotesFr(e.target.value)}
            maxLength={2000}
          />
        </div>
      </div>

      <Button type="submit" size="sm" disabled={saving}>
        {saving ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
