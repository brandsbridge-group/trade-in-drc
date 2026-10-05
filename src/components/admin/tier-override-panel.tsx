"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { VERIFICATION_TIERS } from "@/constants/status";
import type { VerificationTier } from "@/constants/status";
import { setVerificationTier } from "@/lib/verifications/actions";

interface TierOverridePanelProps {
    companyId: string;
    initialTier: VerificationTier;
}

/**
 * Admin company-detail tier override. The trust columns are REVOKE-protected, so
 * the save goes through the `setVerificationTier` server action (service-role).
 * Setting `verified`/`premium` is what renders the public "Verified by Ministry"
 * badge; `none` demotes and clears `verified_at`.
 */
export function TierOverridePanel({
    companyId,
    initialTier,
}: TierOverridePanelProps) {
    const t = useTranslations("Admin.companies");
    const tBadge = useTranslations("Trust.badge");
    const locale = useLocale();
    const router = useRouter();

    const [tier, setTier] = React.useState<VerificationTier>(initialTier);
    const [saving, setSaving] = React.useState(false);

    const handleSave = async () => {
        setSaving(true);
        const toastId = toast.loading(t("tier.saving"));
        try {
            const result = await setVerificationTier({ companyId, tier, locale });
            if (!result.ok) {
                toast.error(t(`tier.errors.${result.error ?? "generic"}`), {
                    id: toastId,
                });
                return;
            }
            toast.success(t("tier.saved"), { id: toastId });
            router.refresh();
        } catch {
            toast.error(t("tier.errors.generic"), { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Select
                value={tier}
                onValueChange={(v) => setTier(v as VerificationTier)}
                disabled={saving}
            >
                <SelectTrigger className="h-9 min-w-0 flex-1 basis-[150px] rounded-full border-slate-200 bg-white px-3.5 text-[13px] shadow-none" aria-label={t("tier.title")}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {VERIFICATION_TIERS.map((tierOption) => (
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
            <button
                type="button"
                onClick={handleSave}
                disabled={saving || tier === initialTier}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-market-navy px-4 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep disabled:opacity-40"
            >
                {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                {t("tier.save")}
            </button>
        </div>
    );
}
