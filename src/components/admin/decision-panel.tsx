"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, MessageSquare, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import {
    VERIFICATION_DECISION,
    VERIFICATION_TIERS,
    VERIFICATION_TIER,
} from "@/constants/status";
import type { VerificationTier } from "@/constants/status";
import { submitVerificationDecision } from "@/lib/verifications/actions";

interface DecisionPanelProps {
    companyId: string;
}

type PanelDecision =
    | typeof VERIFICATION_DECISION.APPROVED
    | typeof VERIFICATION_DECISION.REJECTED
    | typeof VERIFICATION_DECISION.MORE_INFO_REQUESTED;

const DECISION_META: Record<
    PanelDecision,
    { labelKey: string; color: string; icon: React.ElementType; requiresNotes: boolean }
> = {
    [VERIFICATION_DECISION.APPROVED]: {
        labelKey: "decision.approve",
        color: "bg-green-600 hover:bg-green-700 text-white",
        icon: CheckCircle,
        requiresNotes: false,
    },
    [VERIFICATION_DECISION.REJECTED]: {
        labelKey: "decision.reject",
        color: "bg-red-600 hover:bg-red-700 text-white",
        icon: XCircle,
        requiresNotes: true,
    },
    [VERIFICATION_DECISION.MORE_INFO_REQUESTED]: {
        labelKey: "decision.requestInfo",
        color: "bg-amber-500 hover:bg-amber-600 text-white",
        icon: MessageSquare,
        requiresNotes: true,
    },
};

const PANEL_DECISIONS: PanelDecision[] = [
    VERIFICATION_DECISION.APPROVED,
    VERIFICATION_DECISION.REJECTED,
    VERIFICATION_DECISION.MORE_INFO_REQUESTED,
];

// Tiers an admin may grant on approval — `none` is excluded because approving to
// "not verified" is meaningless; demotion happens via reject / request-info.
const GRANTABLE_TIERS = VERIFICATION_TIERS.filter(
    (t) => t !== VERIFICATION_TIER.NONE
) as VerificationTier[];

export function DecisionPanel({ companyId }: DecisionPanelProps) {
    const t = useTranslations("Admin.verifications");
    const tBadge = useTranslations("Trust.badge");
    const locale = useLocale();
    const router = useRouter();

    const [selectedDecision, setSelectedDecision] =
        React.useState<PanelDecision | null>(null);
    const [tier, setTier] = React.useState<VerificationTier>(
        VERIFICATION_TIER.VERIFIED
    );
    const [notes, setNotes] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);

    const handleSubmit = async () => {
        if (!selectedDecision) return;
        const meta = DECISION_META[selectedDecision];

        if (meta.requiresNotes && !notes.trim()) {
            toast.error(t("errors.notesRequired"));
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading(t("submitting"));

        try {
            const result = await submitVerificationDecision({
                companyId,
                decision: selectedDecision,
                tier:
                    selectedDecision === VERIFICATION_DECISION.APPROVED
                        ? tier
                        : undefined,
                notes: notes.trim() || undefined,
                locale,
            });

            if (!result.ok) {
                toast.error(t(`errors.${result.error ?? "generic"}`), { id: toastId });
                return;
            }

            toast.success(t(`success.${selectedDecision}`), { id: toastId });
            router.push("/admin/verifications");
            router.refresh();
        } catch {
            toast.error(t("errors.generic"), { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    const isApprove = selectedDecision === VERIFICATION_DECISION.APPROVED;

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t("decision.title")}</h3>

            <div className="flex flex-col gap-2">
                {PANEL_DECISIONS.map((key) => {
                    const meta = DECISION_META[key];
                    const Icon = meta.icon;
                    const isSelected = selectedDecision === key;
                    return (
                        <Button
                            key={key}
                            variant="outline"
                            size="sm"
                            className={isSelected ? meta.color : ""}
                            onClick={() => setSelectedDecision(key)}
                            disabled={submitting}
                        >
                            <Icon className="w-4 h-4 mr-1" />
                            {t(meta.labelKey)}
                        </Button>
                    );
                })}
            </div>

            {selectedDecision && (
                <div className="space-y-2">
                    {isApprove && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                                {t("decision.tierLabel")}
                            </label>
                            <Select
                                value={tier}
                                onValueChange={(v) => setTier(v as VerificationTier)}
                                disabled={submitting}
                            >
                                <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {GRANTABLE_TIERS.map((tierOption) => (
                                        <SelectItem
                                            key={tierOption}
                                            value={tierOption}
                                            className="text-sm"
                                        >
                                            {tBadge(tierOption)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-muted-foreground">
                                {t("decision.tierHint")}
                            </p>
                        </div>
                    )}

                    <label className="text-xs font-medium text-muted-foreground">
                        {DECISION_META[selectedDecision].requiresNotes
                            ? t("decision.notesRequired")
                            : t("decision.notesOptional")}
                    </label>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t("decision.notesPlaceholder")}
                        className="text-sm min-h-[80px]"
                        maxLength={2000}
                        disabled={submitting}
                    />
                    <Button
                        size="sm"
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : null}
                        {t("decision.submit")}
                    </Button>
                </div>
            )}
        </div>
    );
}
