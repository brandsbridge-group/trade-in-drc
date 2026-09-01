"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Star } from "lucide-react";
import {
    listFeaturedCompanies,
    listFeaturedCandidates,
    addFeaturedCompany,
    setFeaturedActive,
    removeFeaturedCompany,
} from "./actions";
import {
    type FeaturedCompanyRow,
    type CompanyOption,
} from "./constants";

export function FeaturedCompaniesPicker({ locale }: { locale: string }) {
    const t = useTranslations("Admin.settings");
    const [featured, setFeatured] = React.useState<FeaturedCompanyRow[]>([]);
    const [candidates, setCandidates] = React.useState<CompanyOption[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selected, setSelected] = React.useState<string>("");
    const [busy, setBusy] = React.useState(false);

    const load = React.useCallback(async () => {
        try {
            const [rows, options] = await Promise.all([
                listFeaturedCompanies(locale),
                listFeaturedCandidates(locale),
            ]);
            setFeatured(rows);
            setCandidates(options);
        } catch {
            toast.error(t("loadError"));
        } finally {
            setLoading(false);
        }
    }, [locale, t]);

    React.useEffect(() => {
        load();
    }, [load]);

    const handleAdd = async () => {
        if (!selected) return;
        setBusy(true);
        const toastId = "add-featured";
        toast.loading(t("saving"), { id: toastId });
        const result = await addFeaturedCompany(locale, {
            company_id: selected,
            sort_order: featured.length,
            active: true,
        });
        if (!result.ok) {
            toast.error(result.error ?? t("saveError"), { id: toastId });
            setBusy(false);
            return;
        }
        toast.success(t("saved"), { id: toastId });
        setSelected("");
        setBusy(false);
        await load();
    };

    const handleToggle = async (row: FeaturedCompanyRow) => {
        const toastId = `toggle-${row.id}`;
        toast.loading(t("saving"), { id: toastId });
        const result = await setFeaturedActive(locale, {
            id: row.id,
            active: !row.active,
        });
        if (!result.ok) {
            toast.error(result.error ?? t("saveError"), { id: toastId });
            return;
        }
        toast.success(t("saved"), { id: toastId });
        await load();
    };

    const handleRemove = async (id: string) => {
        const toastId = `remove-${id}`;
        toast.loading(t("deleting"), { id: toastId });
        const result = await removeFeaturedCompany(locale, id);
        if (!result.ok) {
            toast.error(result.error ?? t("deleteError"), { id: toastId });
            return;
        }
        toast.success(t("deleted"), { id: toastId });
        await load();
    };

    return (
        <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("featuredHint")}</p>

            <div className="flex items-center gap-2">
                <Select value={selected} onValueChange={setSelected}>
                    <SelectTrigger className="h-9 flex-1 text-sm">
                        <SelectValue placeholder={t("featuredSelectPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                        {candidates.length === 0 ? (
                            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                                {t("featuredNoCandidates")}
                            </div>
                        ) : (
                            candidates.map((c) => (
                                <SelectItem key={c.id} value={c.id} className="text-sm">
                                    {c.name}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
                <Button size="sm" onClick={handleAdd} disabled={!selected || busy}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    {t("featuredAdd")}
                </Button>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-xl" />
                    ))}
                </div>
            ) : featured.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                        <Star className="h-6 w-6 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground">{t("featuredEmpty")}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {featured.map((row) => (
                        <div
                            key={row.id}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-card p-3"
                        >
                            <Star className="h-4 w-4 shrink-0 text-amber-500" />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                {row.companyName}
                            </span>
                            <span className="text-xs text-muted-foreground">#{row.sortOrder}</span>
                            <div className="flex items-center gap-1.5">
                                <Switch
                                    checked={row.active}
                                    onCheckedChange={() => handleToggle(row)}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {row.active ? t("slideActive") : t("slideInactive")}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleRemove(row.id)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
