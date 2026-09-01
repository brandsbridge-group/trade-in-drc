"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/design";
import { MediaManager } from "@/components/dashboard/media-manager";

interface SectorOption {
    id: string;
    name_en: string;
    name_fr: string;
}

interface TagOption {
    id: string;
    name_en: string;
    name_fr: string;
}

interface HsCodeOption {
    id: string;
    code: string;
    name_en: string;
    name_fr: string;
}

interface CompanyForm {
    name: string;
    sectorId: string;
    province: string;
    city: string;
    description: string;
    capacity: string;
    moq: string;
    leadTime: string;
    certifications: string;
    markets: string;
    languages: string;
}

const EMPTY_FORM: CompanyForm = {
    name: "",
    sectorId: "",
    province: "",
    city: "",
    description: "",
    capacity: "",
    moq: "",
    leadTime: "",
    certifications: "",
    markets: "",
    languages: "",
};

/** text[] column -> comma-separated string for the form. */
const arrayToText = (value: string[] | null | undefined): string =>
    value?.join(", ") ?? "";

/** comma-separated form value -> trimmed text[] for the DB. */
const textToArray = (value: string): string[] =>
    value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

export default function EditCompanyPage() {
    const t = useTranslations("Dashboard.editCompany");
    const locale = useLocale();
    const params = useParams();
    const router = useRouter();
    const companyId = params.id as string;

    const localizedName = React.useCallback(
        (row: { name_en: string; name_fr: string }) =>
            locale === "fr" ? row.name_fr : row.name_en,
        [locale],
    );

    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [formData, setFormData] = React.useState<CompanyForm>(EMPTY_FORM);
    const [sectors, setSectors] = React.useState<SectorOption[]>([]);
    const [tags, setTags] = React.useState<TagOption[]>([]);
    const [hsCodes, setHsCodes] = React.useState<HsCodeOption[]>([]);
    const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);
    const [selectedHsCodeIds, setSelectedHsCodeIds] = React.useState<string[]>([]);
    // Snapshot of join-table rows loaded from the DB, used to diff on save.
    const initialTagIds = React.useRef<string[]>([]);
    const initialHsCodeIds = React.useRef<string[]>([]);

    React.useEffect(() => {
        const load = async () => {
            try {
                const supabase = createClient();

                const { data: authData } = await supabase.auth.getUser();
                const currentUserId = authData.user?.id;

                const [
                    companyRes,
                    sectorsRes,
                    tagsRes,
                    hsCodesRes,
                    companyTagsRes,
                    companyHsRes,
                ] = await Promise.all([
                    supabase.from("companies").select("*").eq("id", companyId).single(),
                    supabase
                        .from("sectors")
                        .select("id, name_en, name_fr")
                        .order("name_en", { ascending: true }),
                    supabase
                        .from("tags")
                        .select("id, name_en, name_fr")
                        .order("name_en", { ascending: true }),
                    supabase
                        .from("hs_codes")
                        .select("id, code, name_en, name_fr")
                        .order("code", { ascending: true }),
                    supabase
                        .from("company_tags")
                        .select("tag_id")
                        .eq("company_id", companyId),
                    supabase
                        .from("company_hs_codes")
                        .select("hs_code_id")
                        .eq("company_id", companyId),
                ]);

                if (companyRes.error) throw companyRes.error;
                const company = companyRes.data;
                if (!company) throw new Error("Company not found");

                // Ownership guard — only the owner may edit.
                if (!currentUserId || company.owner_id !== currentUserId) {
                    toast.error(t("ownershipDenied"));
                    router.push("/dashboard");
                    return;
                }

                setSectors(sectorsRes.data ?? []);
                setTags(tagsRes.data ?? []);
                setHsCodes(hsCodesRes.data ?? []);

                const loadedTagIds = (companyTagsRes.data ?? []).map((r) => r.tag_id);
                const loadedHsCodeIds = (companyHsRes.data ?? []).map(
                    (r) => r.hs_code_id,
                );
                initialTagIds.current = loadedTagIds;
                initialHsCodeIds.current = loadedHsCodeIds;
                setSelectedTagIds(loadedTagIds);
                setSelectedHsCodeIds(loadedHsCodeIds);

                setFormData({
                    name: company.name ?? "",
                    sectorId: company.sector_id ?? "",
                    province: company.province ?? "",
                    city: company.city ?? "",
                    description: company.description ?? "",
                    capacity: company.production_capacity ?? "",
                    moq: company.moq ?? "",
                    leadTime: company.lead_time ?? "",
                    certifications: arrayToText(company.certifications),
                    markets: arrayToText(company.markets),
                    languages: arrayToText(company.spoken_languages),
                });
            } catch (error) {
                console.error("Error loading company:", error);
                toast.error(t("loadError"));
            } finally {
                setLoading(false);
            }
        };

        if (companyId) {
            load();
        }
    }, [companyId, router, t]);

    const handleSave = async () => {
        setSaving(true);
        const toastId = toast.loading(t("saving"));
        try {
            const supabase = createClient();

            // NOTE: trust columns (status, verification_tier, verified_at,
            // verification_summary) are intentionally omitted — owners cannot
            // write them (column-level REVOKE, migration 00011).
            const { data: updated, error: updateError } = await supabase
                .from("companies")
                .update({
                    name: formData.name,
                    sector_id: formData.sectorId || null,
                    province: formData.province || null,
                    city: formData.city || null,
                    description: formData.description || null,
                    production_capacity: formData.capacity || null,
                    moq: formData.moq || null,
                    lead_time: formData.leadTime || null,
                    certifications: textToArray(formData.certifications),
                    markets: textToArray(formData.markets),
                    spoken_languages: textToArray(formData.languages),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", companyId)
                .select("id");

            if (updateError) throw updateError;
            if (!updated || updated.length === 0) {
                // RLS or ownership prevented the write — do NOT report success.
                toast.error(t("updateError"), { id: toastId });
                return;
            }

            // Diff and sync the owner-writable join tables.
            await syncJoin(
                supabase,
                "company_tags",
                companyId,
                initialTagIds.current,
                selectedTagIds,
            );
            await syncJoin(
                supabase,
                "company_hs_codes",
                companyId,
                initialHsCodeIds.current,
                selectedHsCodeIds,
            );

            initialTagIds.current = selectedTagIds;
            initialHsCodeIds.current = selectedHsCodeIds;

            toast.success(t("updateSuccess"), { id: toastId });
            router.push("/dashboard");
        } catch (error) {
            console.error("Error updating company:", error);
            toast.error(t("updateError"), { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const toggleTag = (id: string) =>
        setSelectedTagIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    const toggleHsCode = (id: string) =>
        setSelectedHsCodeIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            <Link
                href="/dashboard"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t("backToDashboard")}
            </Link>
            <PageHeader
                title={t("title")}
                action={
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {t("saveChanges")}
                    </Button>
                }
            />

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="mt-4 bg-card border border-slate-200 rounded-2xl p-4 space-y-6"
            >
                {/* Basic Info */}
                <section>
                    <h2 className="text-sm font-semibold mb-3">{t("basicInfo")}</h2>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>{t("companyName")}</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>{t("sector")}</Label>
                                <Select
                                    value={formData.sectorId}
                                    onValueChange={(v) =>
                                        setFormData({ ...formData, sectorId: v })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("sectorPlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sectors.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {localizedName(s)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>{t("province")}</Label>
                                <Input
                                    value={formData.province}
                                    onChange={(e) =>
                                        setFormData({ ...formData, province: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>{t("city")}</Label>
                            <Input
                                value={formData.city}
                                onChange={(e) =>
                                    setFormData({ ...formData, city: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t("description")}</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                rows={4}
                            />
                        </div>
                    </div>
                </section>

                {/* Capacity */}
                <section>
                    <h2 className="text-sm font-semibold mb-3">{t("exportCapacity")}</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label>{t("productionCapacity")}</Label>
                            <Input
                                value={formData.capacity}
                                onChange={(e) =>
                                    setFormData({ ...formData, capacity: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t("minimumOrder")}</Label>
                            <Input
                                value={formData.moq}
                                onChange={(e) =>
                                    setFormData({ ...formData, moq: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t("leadTime")}</Label>
                            <Input
                                value={formData.leadTime}
                                onChange={(e) =>
                                    setFormData({ ...formData, leadTime: e.target.value })
                                }
                            />
                        </div>
                    </div>
                </section>

                {/* Certifications, Markets, Languages (text[] as comma-separated) */}
                <section>
                    <h2 className="text-sm font-semibold mb-3">{t("listsHeading")}</h2>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>{t("certifications")}</Label>
                            <Input
                                value={formData.certifications}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        certifications: e.target.value,
                                    })
                                }
                                placeholder={t("commaSeparatedPlaceholder")}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t("exportMarkets")}</Label>
                            <Input
                                value={formData.markets}
                                onChange={(e) =>
                                    setFormData({ ...formData, markets: e.target.value })
                                }
                                placeholder={t("commaSeparatedPlaceholder")}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t("languages")}</Label>
                            <Input
                                value={formData.languages}
                                onChange={(e) =>
                                    setFormData({ ...formData, languages: e.target.value })
                                }
                                placeholder={t("commaSeparatedPlaceholder")}
                            />
                        </div>
                    </div>
                </section>

                {/* Tags (multi-select from admin-managed reference table) */}
                <section>
                    <h2 className="text-sm font-semibold mb-1">{t("tags")}</h2>
                    <p className="text-xs text-muted-foreground mb-3">
                        {t("tagsHint")}
                    </p>
                    {tags.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            {t("noTagsAvailable")}
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {tags.map((tag) => (
                                <div key={tag.id} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`tag-${tag.id}`}
                                        checked={selectedTagIds.includes(tag.id)}
                                        onCheckedChange={() => toggleTag(tag.id)}
                                    />
                                    <label
                                        htmlFor={`tag-${tag.id}`}
                                        className="text-sm cursor-pointer"
                                    >
                                        {localizedName(tag)}
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* HS codes (multi-select from admin-managed reference table) */}
                <section>
                    <h2 className="text-sm font-semibold mb-1">{t("hsCode")}</h2>
                    <p className="text-xs text-muted-foreground mb-3">
                        {t("hsCodeHint")}
                    </p>
                    {hsCodes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            {t("noHsCodesAvailable")}
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {hsCodes.map((hs) => (
                                <div key={hs.id} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`hs-${hs.id}`}
                                        checked={selectedHsCodeIds.includes(hs.id)}
                                        onCheckedChange={() => toggleHsCode(hs.id)}
                                    />
                                    <label
                                        htmlFor={`hs-${hs.id}`}
                                        className="text-sm cursor-pointer"
                                    >
                                        {hs.code} — {localizedName(hs)}
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Media (logo, gallery, brochures, video embeds) */}
                <section>
                    <h2 className="text-sm font-semibold mb-1">{t("media")}</h2>
                    <p className="text-xs text-muted-foreground mb-3">
                        {t("mediaHint")}
                    </p>
                    <MediaManager companyId={companyId} />
                </section>
            </motion.div>
        </div>
    );
}

/**
 * Diffs the owner's selected reference IDs against what was loaded and
 * applies the delta to a join table: deletes removed rows, inserts added ones.
 * Owners can write these join tables (RLS permits owner-of-company inserts/deletes).
 */
async function syncJoin(
    supabase: ReturnType<typeof createClient>,
    table: "company_tags" | "company_hs_codes",
    companyId: string,
    initialIds: string[],
    selectedIds: string[],
): Promise<void> {
    const toAdd = selectedIds.filter((id) => !initialIds.includes(id));
    const toRemove = initialIds.filter((id) => !selectedIds.includes(id));

    if (table === "company_tags") {
        if (toRemove.length > 0) {
            const { error } = await supabase
                .from("company_tags")
                .delete()
                .eq("company_id", companyId)
                .in("tag_id", toRemove);
            if (error) throw error;
        }
        if (toAdd.length > 0) {
            const { error } = await supabase
                .from("company_tags")
                .insert(toAdd.map((id) => ({ company_id: companyId, tag_id: id })));
            if (error) throw error;
        }
    } else {
        if (toRemove.length > 0) {
            const { error } = await supabase
                .from("company_hs_codes")
                .delete()
                .eq("company_id", companyId)
                .in("hs_code_id", toRemove);
            if (error) throw error;
        }
        if (toAdd.length > 0) {
            const { error } = await supabase
                .from("company_hs_codes")
                .insert(
                    toAdd.map((id) => ({ company_id: companyId, hs_code_id: id })),
                );
            if (error) throw error;
        }
    }
}
