"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { SEGMENT_KEYS } from "@/lib/marketplace/segments";
import type { SegmentKey } from "@/lib/marketplace/segments";

interface SegmentsFormProps {
    companyId: string;
    initial: SegmentKey[];
}

export function SegmentsForm({ companyId, initial }: SegmentsFormProps) {
    const t = useTranslations("AdminSegments");
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

    const handleSave = async () => {
        const initialSet = new Set(initial);
        const toAdd = SEGMENT_KEYS.filter((k) => checked.has(k) && !initialSet.has(k));
        const toRemove = SEGMENT_KEYS.filter((k) => !checked.has(k) && initialSet.has(k));

        if (toAdd.length === 0 && toRemove.length === 0) {
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
        } catch (err) {
            const message = err instanceof Error ? err.message : t("saveFailed");
            toast.error(message, { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SEGMENT_KEYS.map((key) => (
                    <label
                        key={key}
                        className="flex items-center gap-2 cursor-pointer select-none text-sm capitalize"
                    >
                        <Checkbox
                            checked={checked.has(key)}
                            onCheckedChange={() => toggle(key)}
                            id={`seg-${key}`}
                        />
                        <span>{key.replace(/_/g, " ")}</span>
                    </label>
                ))}
            </div>
            <Button size="sm" className="h-8 text-sm" onClick={handleSave} disabled={saving}>
                {t("save")}
            </Button>
        </div>
    );
}
