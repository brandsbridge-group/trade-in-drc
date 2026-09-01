"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TaxonomyType = "sectors" | "categories" | "hs_codes" | "tags";

interface Sector {
    id: string;
    name_en: string;
    name_fr: string;
    slug: string;
}

interface Category {
    id: string;
    name_en: string;
    name_fr: string;
    slug: string;
    sector_id: string | null;
    sectors: { name_en: string } | null;
}

interface HsCode {
    id: string;
    code: string;
    name_en: string;
    name_fr: string;
    parent_code: string | null;
    sector_id: string | null;
    sectors: { name_en: string } | null;
}

interface Tag {
    id: string;
    slug: string;
    name_en: string;
    name_fr: string;
}

type TaxonomyItem = Sector | Category | HsCode | Tag;

interface TaxonomyEditorProps {
    type: TaxonomyType;
    sectors?: Sector[];
}

const TABLE_NAME = {
    sectors: "sectors",
    categories: "categories",
    hs_codes: "hs_codes",
    tags: "tags",
} as const;

/** Which types expose a parent-sector select. */
const HAS_SECTOR_SELECT: Record<TaxonomyType, boolean> = {
    sectors: false,
    categories: true,
    hs_codes: true,
    tags: false,
};

/** Which types carry a slug column (sectors/categories/tags) vs an HS code. */
const HAS_SLUG: Record<TaxonomyType, boolean> = {
    sectors: true,
    categories: true,
    hs_codes: false,
    tags: true,
};

function generateSlug(nameEn: string): string {
    return nameEn
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
}

interface EditState {
    name_en: string;
    name_fr: string;
    name_tr: string;
    name_zh: string;
    name_es: string;
    slug: string;
    sector_id: string;
    code: string;
    parent_code: string;
}

const EMPTY_EDIT_STATE: EditState = {
    name_en: "",
    name_fr: "",
    name_tr: "",
    name_zh: "",
    name_es: "",
    slug: "",
    sector_id: "",
    code: "",
    parent_code: "",
};

function readSectorId(item: TaxonomyItem): string {
    if ("sector_id" in item && item.sector_id) return item.sector_id;
    return "";
}

function readSectorName(item: TaxonomyItem): string {
    if ("sectors" in item) return item.sectors?.name_en ?? "—";
    return "—";
}

export function TaxonomyEditor({ type, sectors = [] }: TaxonomyEditorProps) {
    const t = useTranslations("Taxonomy");
    const [items, setItems] = React.useState<TaxonomyItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editState, setEditState] = React.useState<EditState>(EMPTY_EDIT_STATE);
    const [showAddForm, setShowAddForm] = React.useState(false);
    const [addState, setAddState] = React.useState<EditState>(EMPTY_EDIT_STATE);
    const [savingId, setSavingId] = React.useState<string | null>(null);
    const [adding, setAdding] = React.useState(false);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);

    const supabase = createClient();
    const hasSlug = HAS_SLUG[type];
    const hasSector = HAS_SECTOR_SELECT[type];
    const isHsCode = type === "hs_codes";

    const fetchItems = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let query;
            if (type === "categories") {
                query = supabase.from("categories").select("*, sectors(name_en)").order("name_en");
            } else if (type === "hs_codes") {
                query = supabase.from("hs_codes").select("*, sectors(name_en)").order("code");
            } else {
                query = supabase.from(TABLE_NAME[type]).select("*").order("name_en");
            }

            const { data, error: queryError } = await query;
            if (queryError) throw queryError;
            setItems((data as TaxonomyItem[]) ?? []);
        } catch (err) {
            const message = err instanceof Error ? err.message : t("errorLoad");
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [type, supabase, t]);

    React.useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleEditStart = (item: TaxonomyItem) => {
        const row = item as unknown as Record<string, unknown>;
        setEditingId(item.id);
        setEditState({
            name_en: item.name_en,
            name_fr: item.name_fr,
            name_tr: (row.name_tr as string | null) ?? "",
            name_zh: (row.name_zh as string | null) ?? "",
            name_es: (row.name_es as string | null) ?? "",
            slug: hasSlug && "slug" in item ? item.slug : "",
            sector_id: hasSector ? readSectorId(item) : "",
            code: isHsCode && "code" in item ? item.code : "",
            parent_code: isHsCode && "parent_code" in item ? item.parent_code ?? "" : "",
        });
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditState(EMPTY_EDIT_STATE);
    };

    function buildPayload(state: EditState): Record<string, string | null> {
        const payload: Record<string, string | null> = {
            name_en: state.name_en.trim(),
            name_fr: state.name_fr.trim(),
            name_tr: state.name_tr.trim() || null,
            name_zh: state.name_zh.trim() || null,
            name_es: state.name_es.trim() || null,
        };
        if (hasSlug) payload.slug = state.slug.trim();
        if (isHsCode) {
            payload.code = state.code.trim();
            payload.parent_code = state.parent_code.trim() || null;
        }
        if (hasSector) payload.sector_id = state.sector_id || null;
        return payload;
    }

    /**
     * Insert/update dispatch narrowed per table. Supabase's typed client cannot
     * infer a single payload shape from the union `TABLE_NAME[type]`, so each
     * branch passes a concrete table literal and casts the (identical) runtime
     * payload to that table's Insert type to satisfy the row-typed builder.
     */
    async function persist(
        action: "insert" | "update",
        state: EditState,
        id?: string
    ): Promise<void> {
        const payload = buildPayload(state);
        type SectorInsert = Database["public"]["Tables"]["sectors"]["Insert"];
        type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
        type HsCodeInsert = Database["public"]["Tables"]["hs_codes"]["Insert"];
        type TagInsert = Database["public"]["Tables"]["tags"]["Insert"];

        let result;
        switch (type) {
            case "sectors":
                result =
                    action === "insert"
                        ? await supabase.from("sectors").insert(payload as unknown as SectorInsert)
                        : await supabase.from("sectors").update(payload as unknown as SectorInsert).eq("id", id as string);
                break;
            case "categories":
                result =
                    action === "insert"
                        ? await supabase.from("categories").insert(payload as unknown as CategoryInsert)
                        : await supabase.from("categories").update(payload as unknown as CategoryInsert).eq("id", id as string);
                break;
            case "hs_codes":
                result =
                    action === "insert"
                        ? await supabase.from("hs_codes").insert(payload as unknown as HsCodeInsert)
                        : await supabase.from("hs_codes").update(payload as unknown as HsCodeInsert).eq("id", id as string);
                break;
            case "tags":
                result =
                    action === "insert"
                        ? await supabase.from("tags").insert(payload as unknown as TagInsert)
                        : await supabase.from("tags").update(payload as unknown as TagInsert).eq("id", id as string);
                break;
        }
        if (result?.error) throw result.error;
    }

    function isStateComplete(state: EditState): boolean {
        if (!state.name_en.trim() || !state.name_fr.trim()) return false;
        if (hasSlug && !state.slug.trim()) return false;
        if (isHsCode && !state.code.trim()) return false;
        return true;
    }

    const handleEditSave = async (id: string) => {
        setSavingId(id);
        const toastId = toast.loading(t("saving"));
        try {
            await persist("update", editState, id);

            toast.success(t("saved"), { id: toastId });
            setEditingId(null);
            setEditState(EMPTY_EDIT_STATE);
            await fetchItems();
        } catch (err) {
            const message = err instanceof Error ? err.message : t("errorSave");
            toast.error(message, { id: toastId });
        } finally {
            setSavingId(null);
        }
    };

    const handleDelete = async (id: string, label: string) => {
        if (!window.confirm(t("confirmDelete", { name: label }))) return;

        setDeletingId(id);
        const toastId = toast.loading(t("deleting"));
        try {
            const { error: deleteError } = await supabase.from(TABLE_NAME[type]).delete().eq("id", id);
            if (deleteError) throw deleteError;
            toast.success(t("deleted"), { id: toastId });
            await fetchItems();
        } catch (err) {
            const message = err instanceof Error ? err.message : t("errorDelete");
            toast.error(message, { id: toastId });
        } finally {
            setDeletingId(null);
        }
    };

    const handleAdd = async () => {
        setAdding(true);
        const toastId = toast.loading(t("adding"));
        try {
            await persist("insert", addState);

            toast.success(t("added"), { id: toastId });
            setShowAddForm(false);
            setAddState(EMPTY_EDIT_STATE);
            await fetchItems();
        } catch (err) {
            const message = err instanceof Error ? err.message : t("errorAdd");
            toast.error(message, { id: toastId });
        } finally {
            setAdding(false);
        }
    };

    const handleAddNameEnChange = (value: string) => {
        setAddState((prev) => ({
            ...prev,
            name_en: value,
            slug: hasSlug ? generateSlug(value) : prev.slug,
        }));
    };

    const handleEditNameEnChange = (value: string) => {
        setEditState((prev) => ({
            ...prev,
            name_en: value,
            slug: hasSlug ? generateSlug(value) : prev.slug,
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("loading")}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center gap-2 py-6 text-sm">
                <p className="text-destructive">{error}</p>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={fetchItems}>
                    {t("retry")}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-end">
                <Button
                    size="sm"
                    variant="outline"
                    className="text-sm h-8"
                    onClick={() => {
                        setShowAddForm(true);
                        setAddState(EMPTY_EDIT_STATE);
                    }}
                    disabled={showAddForm}
                >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {t("add")}
                </Button>
            </div>

            {showAddForm && (
                <div className="border rounded-md p-3 bg-muted/30 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">{t("newEntry")}</p>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                        {isHsCode && (
                            <Input
                                placeholder={t("placeholderCode")}
                                value={addState.code}
                                onChange={(e) => setAddState((p) => ({ ...p, code: e.target.value }))}
                                className="text-sm h-8 font-mono"
                            />
                        )}
                        <Input
                            placeholder={t("placeholderNameEn")}
                            value={addState.name_en}
                            onChange={(e) => handleAddNameEnChange(e.target.value)}
                            className="text-sm h-8"
                        />
                        <Input
                            placeholder={t("placeholderNameFr")}
                            value={addState.name_fr}
                            onChange={(e) => setAddState((p) => ({ ...p, name_fr: e.target.value }))}
                            className="text-sm h-8"
                        />
                        <Input
                            placeholder={t("placeholderNameTr")}
                            value={addState.name_tr}
                            onChange={(e) => setAddState((p) => ({ ...p, name_tr: e.target.value }))}
                            className="text-sm h-8"
                        />
                        <Input
                            placeholder={t("placeholderNameZh")}
                            value={addState.name_zh}
                            onChange={(e) => setAddState((p) => ({ ...p, name_zh: e.target.value }))}
                            className="text-sm h-8"
                        />
                        <Input
                            placeholder={t("placeholderNameEs")}
                            value={addState.name_es}
                            onChange={(e) => setAddState((p) => ({ ...p, name_es: e.target.value }))}
                            className="text-sm h-8"
                        />
                        {hasSlug && (
                            <Input
                                placeholder={t("placeholderSlug")}
                                value={addState.slug}
                                onChange={(e) => setAddState((p) => ({ ...p, slug: e.target.value }))}
                                className="text-sm h-8 font-mono"
                            />
                        )}
                        {isHsCode && (
                            <Input
                                placeholder={t("placeholderParentCode")}
                                value={addState.parent_code}
                                onChange={(e) => setAddState((p) => ({ ...p, parent_code: e.target.value }))}
                                className="text-sm h-8 font-mono"
                            />
                        )}
                    </div>
                    {hasSector && (
                        <select
                            value={addState.sector_id}
                            onChange={(e) => setAddState((p) => ({ ...p, sector_id: e.target.value }))}
                            className="w-full text-sm h-8 border rounded-md px-2 bg-background"
                        >
                            <option value="">{t("noSector")}</option>
                            {sectors.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name_en}
                                </option>
                            ))}
                        </select>
                    )}
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={handleAdd}
                            disabled={adding || !isStateComplete(addState)}
                        >
                            {adding ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                            {t("save")}
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => {
                                setShowAddForm(false);
                                setAddState(EMPTY_EDIT_STATE);
                            }}
                            disabled={adding}
                        >
                            <X className="w-3 h-3 mr-1" />
                            {t("cancel")}
                        </Button>
                    </div>
                </div>
            )}

            {items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("empty")}</p>
            ) : (
                <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                {isHsCode && (
                                    <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">{t("colCode")}</th>
                                )}
                                <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">{t("colNameEn")}</th>
                                <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">{t("colNameFr")}</th>
                                {hasSlug && (
                                    <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">{t("colSlug")}</th>
                                )}
                                {hasSector && (
                                    <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">{t("colSector")}</th>
                                )}
                                <th className="text-right px-3 py-2 font-medium text-xs text-muted-foreground">{t("colActions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {items.map((item) => {
                                const isEditing = editingId === item.id;
                                const isSaving = savingId === item.id;
                                const isDeleting = deletingId === item.id;
                                const rowLabel = "code" in item ? item.code : item.name_en;

                                return (
                                    <tr key={item.id} className="hover:bg-muted/20">
                                        {isHsCode && (
                                            <td className="px-3 py-2 font-mono text-xs">
                                                {isEditing ? (
                                                    <Input
                                                        value={editState.code}
                                                        onChange={(e) => setEditState((p) => ({ ...p, code: e.target.value }))}
                                                        className="text-sm h-7 font-mono"
                                                    />
                                                ) : (
                                                    (item as HsCode).code
                                                )}
                                            </td>
                                        )}
                                        <td className="px-3 py-2">
                                            {isEditing ? (
                                                <Input
                                                    value={editState.name_en}
                                                    onChange={(e) => handleEditNameEnChange(e.target.value)}
                                                    className="text-sm h-7"
                                                />
                                            ) : (
                                                item.name_en
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            {isEditing ? (
                                                <div className="space-y-1">
                                                    <Input
                                                        value={editState.name_fr}
                                                        onChange={(e) => setEditState((p) => ({ ...p, name_fr: e.target.value }))}
                                                        className="text-sm h-7"
                                                    />
                                                    <Input
                                                        placeholder={t("placeholderNameTr")}
                                                        value={editState.name_tr}
                                                        onChange={(e) => setEditState((p) => ({ ...p, name_tr: e.target.value }))}
                                                        className="text-xs h-7"
                                                    />
                                                    <Input
                                                        placeholder={t("placeholderNameZh")}
                                                        value={editState.name_zh}
                                                        onChange={(e) => setEditState((p) => ({ ...p, name_zh: e.target.value }))}
                                                        className="text-xs h-7"
                                                    />
                                                    <Input
                                                        placeholder={t("placeholderNameEs")}
                                                        value={editState.name_es}
                                                        onChange={(e) => setEditState((p) => ({ ...p, name_es: e.target.value }))}
                                                        className="text-xs h-7"
                                                    />
                                                </div>
                                            ) : (
                                                item.name_fr
                                            )}
                                        </td>
                                        {hasSlug && (
                                            <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                                                {isEditing ? (
                                                    <Input
                                                        value={editState.slug}
                                                        onChange={(e) => setEditState((p) => ({ ...p, slug: e.target.value }))}
                                                        className="text-sm h-7 font-mono"
                                                    />
                                                ) : (
                                                    "slug" in item ? item.slug : "—"
                                                )}
                                            </td>
                                        )}
                                        {hasSector && (
                                            <td className="px-3 py-2 text-xs text-muted-foreground">
                                                {isEditing ? (
                                                    <select
                                                        value={editState.sector_id}
                                                        onChange={(e) => setEditState((p) => ({ ...p, sector_id: e.target.value }))}
                                                        className="text-sm h-7 border rounded-md px-2 bg-background w-full"
                                                    >
                                                        <option value="">{t("noSector")}</option>
                                                        {sectors.map((s) => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.name_en}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    readSectorName(item)
                                                )}
                                            </td>
                                        )}
                                        <td className="px-3 py-2 text-right">
                                            {isEditing ? (
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6"
                                                        onClick={() => handleEditSave(item.id)}
                                                        disabled={isSaving || !isStateComplete(editState)}
                                                        title={t("save")}
                                                    >
                                                        {isSaving ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <Check className="w-3 h-3 text-green-600" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6"
                                                        onClick={handleEditCancel}
                                                        disabled={isSaving}
                                                        title={t("cancel")}
                                                    >
                                                        <X className="w-3 h-3 text-muted-foreground" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6"
                                                        onClick={() => handleEditStart(item)}
                                                        disabled={isDeleting || !!editingId}
                                                        title={t("edit")}
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6 text-destructive hover:text-destructive"
                                                        onClick={() => handleDelete(item.id, rowLabel)}
                                                        disabled={isDeleting || !!editingId}
                                                        title={t("delete")}
                                                    >
                                                        {isDeleting ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-3 h-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
