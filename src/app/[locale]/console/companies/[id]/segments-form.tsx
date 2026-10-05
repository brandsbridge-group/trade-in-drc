"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { SEGMENT_KEYS } from "@/lib/marketplace/segments";
import type { SegmentKey } from "@/lib/marketplace/segments";

interface SegmentsFormProps {
    companyId: string;
    initial: SegmentKey[];
}

/**
 * The marketplace segments a company is listed under, as toggle chips. Writes
 * go through the browser client; RLS limits them to staff.
 */
export function SegmentsForm({ companyId, initial }: SegmentsFormProps) {
    const t = useTranslations("AdminSegments");
    const tSegment = useTranslations("Market.segments");
    const router = useRouter();
    const [checked, setChecked] = React.useState<Set<SegmentKey>>(new Set(initial));
    const [saving, setSaving] = React.useState(false);

    const toggle = (key: SegmentKey) => {
        setChecked((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const initialSet = new Set(initial);
    const toAdd = SEGMENT_KEYS.filter((k) => checked.has(k) && !initialSet.has(k));
    const toRemove = SEGMENT_KEYS.filter((k) => !checked.has(k) && initialSet.has(k));
    const changed = toAdd.length > 0 || toRemove.length > 0;

    const handleSave = async () => {
        if (!changed) {
            toast.info(t("noChanges"));
            return;
        }

        const toastId = "segments-save";
        setSaving(true);
        toast.loading(t("saving"), { id: toastId });

        try {
            const supabase = createClient();

            if (toRemove.length > 0) {
                const { error } = await supabase
                    .from("company_segments")
                    .delete()
                    .eq("company_id", companyId)
                    .in("segment_key", toRemove);
                if (error) throw error;
            }

            if (toAdd.length > 0) {
                const { error } = await supabase
                    .from("company_segments")
                    .insert(toAdd.map((segment_key) => ({ company_id: companyId, segment_key })));
                if (error) throw error;
            }

            toast.success(t("saved"), { id: toastId });
            // The page holds the saved list: reload it so "changed" compares against the new state.
            router.refresh();
        } catch {
            toast.error(t("saveFailed"), { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
                {SEGMENT_KEYS.map((key) => {
                    const on = checked.has(key);
                    return (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggle(key)}
                            disabled={saving}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
                                on ? "bg-market-navy text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                            )}
                        >
                            {on && <Check className="size-3" aria-hidden />}
                            {tSegment(key)}
                        </button>
                    );
                })}
            </div>
            <button
                type="button"
                onClick={handleSave}
                disabled={saving || !changed}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-market-navy px-4 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep disabled:opacity-40"
            >
                {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {t("save")}
            </button>
        </div>
    );
}
