"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
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
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <Select
                    value={tier}
                    onValueChange={(v) => setTier(v as VerificationTier)}
                    disabled={saving}
                >
                    <SelectTrigger className="h-8 text-sm w-44">
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
                <Button
                    size="sm"
                    className="h-8 text-sm"
                    onClick={handleSave}
                    disabled={saving || tier === initialTier}
                >
                    {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                    {t("tier.save")}
                </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">{t("tier.hint")}</p>
        </div>
    );
}
