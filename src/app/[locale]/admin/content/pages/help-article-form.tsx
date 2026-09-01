"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/content/slug";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { HelpArticleRow } from "@/lib/content/pages";
import {
  StructuredBodyEditor,
  jsonToBlocks,
  blocksToJson,
} from "./structured-body-editor";

const TOAST_ID = "help-article-save";

interface HelpArticleFormProps {
  initial?: HelpArticleRow;
  mode: "create" | "edit";
}

export function HelpArticleForm({ initial, mode }: HelpArticleFormProps) {
  const t = useTranslations("AdminCms");
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [slug, setSlug] = React.useState(initial?.slug ?? "");
  const [titleEn, setTitleEn] = React.useState(initial?.title_en ?? "");
  const [titleFr, setTitleFr] = React.useState(initial?.title_fr ?? "");
  const [bodyEn, setBodyEn] = React.useState(() => jsonToBlocks(initial?.body_en));
  const [bodyFr, setBodyFr] = React.useState(() => jsonToBlocks(initial?.body_fr));
  const [category, setCategory] = React.useState(initial?.category ?? "");
  const [sortOrder, setSortOrder] = React.useState(String(initial?.sort_order ?? 0));
  const [published, setPublished] = React.useState(initial?.published ?? true);

  // Auto-derive slug from the EN title while the slug is empty or still tracks it.
  const handleTitleEnChange = (val: string) => {
    if (!initial?.slug && (slug === "" || slug === slugify(titleEn))) {
      setSlug(slugify(val));
    }
    setTitleEn(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim() || !titleFr.trim() || !slug.trim()) {
      toast.error(t("errors.helpRequired"));
      return;
    }
    setSaving(true);
    toast.loading(t("saving"), { id: TOAST_ID });

    try {
      const supabase = createClient();
      const payload = {
        slug: slugify(slug),
        title_en: titleEn.trim(),
        title_fr: titleFr.trim(),
        body_en: blocksToJson(bodyEn),
        body_fr: blocksToJson(bodyFr),
        category: category.trim() || null,
        sort_order: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        published,
      };

      if (mode === "create") {
        const { data, error } = await supabase
          .from("help_articles")
          .insert(payload as never)
          .select()
          .single();
        if (error) throw error;
        toast.success(t("created"), { id: TOAST_ID });
        const newRow = data as unknown as HelpArticleRow;
        router.push(`/admin/content/pages/help/${newRow.id}`);
      } else {
        const { error } = await supabase
          .from("help_articles")
          .update(payload as never)
          .eq("id", initial!.id)
          .select()
          .single();
        if (error) throw error;
        toast.success(t("saved"), { id: TOAST_ID });
        router.refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.saveFailed");
      toast.error(message, { id: TOAST_ID });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    if (!window.confirm(t("confirmDelete"))) return;
    setDeleting(true);
    toast.loading(t("deleting"), { id: TOAST_ID });
    try {
      const supabase = createClient();
      const { error } = await supabase.from("help_articles").delete().eq("id", initial.id);
      if (error) throw error;
      toast.success(t("deleted"), { id: TOAST_ID });
      router.push("/admin/content/pages/help");
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.deleteFailed");
      toast.error(message, { id: TOAST_ID });
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {mode === "create" ? t("help.new") : t("help.edit")}
        </h2>
        <div className="flex items-center gap-2">
          {mode === "edit" && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t("deletingShort") : t("delete")}
            </Button>
          )}
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? t("savingShort") : t("save")}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1 md:col-span-1">
          <label className="text-xs text-muted-foreground font-medium">{t("fields.slug")}</label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>
        <div className="space-y-1 md:col-span-1">
          <label className="text-xs text-muted-foreground font-medium">{t("fields.category")}</label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t("fields.categoryPlaceholder")} />
        </div>
        <div className="space-y-1 md:col-span-1">
          <label className="text-xs text-muted-foreground font-medium">{t("fields.sortOrder")}</label>
          <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-medium">{t("fields.published")}</label>
        <div className="flex h-9 items-center gap-2">
          <Switch checked={published} onCheckedChange={setPublished} />
          <span className="text-sm text-muted-foreground">
            {published ? t("status.published") : t("status.draft")}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">{t("fields.titleEn")}</label>
          <Input value={titleEn} onChange={(e) => handleTitleEnChange(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">{t("fields.titleFr")}</label>
          <Input value={titleFr} onChange={(e) => setTitleFr(e.target.value)} required />
        </div>
      </div>

      <StructuredBodyEditor
        label={t("fields.bodyEn")}
        blocks={bodyEn}
        onChange={setBodyEn}
        addLabel={t("addParagraph")}
        emptyLabel={t("noParagraphs")}
        paragraphPlaceholder={t("paragraphPlaceholder")}
      />
      <StructuredBodyEditor
        label={t("fields.bodyFr")}
        blocks={bodyFr}
        onChange={setBodyFr}
        addLabel={t("addParagraph")}
        emptyLabel={t("noParagraphs")}
        paragraphPlaceholder={t("paragraphPlaceholder")}
      />
    </form>
  );
}
