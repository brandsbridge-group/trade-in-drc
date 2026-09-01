"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PageContentRow } from "@/lib/content/pages";
import {
  StructuredBodyEditor,
  jsonToBlocks,
  blocksToJson,
} from "./structured-body-editor";

const STATUS_OPTIONS = ["draft", "published"] as const;
const TOAST_ID = "page-content-save";

interface PageContentFormProps {
  slug: string;
  initial: PageContentRow | null;
}

export function PageContentForm({ slug, initial }: PageContentFormProps) {
  const t = useTranslations("AdminCms");
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);

  const [titleEn, setTitleEn] = React.useState(initial?.title_en ?? "");
  const [titleFr, setTitleFr] = React.useState(initial?.title_fr ?? "");
  const [bodyEn, setBodyEn] = React.useState(() => jsonToBlocks(initial?.body_en));
  const [bodyFr, setBodyFr] = React.useState(() => jsonToBlocks(initial?.body_fr));
  const [status, setStatus] = React.useState<(typeof STATUS_OPTIONS)[number]>(
    (initial?.status as (typeof STATUS_OPTIONS)[number]) ?? "published"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim() || !titleFr.trim()) {
      toast.error(t("errors.titleRequired"));
      return;
    }
    setSaving(true);
    toast.loading(t("saving"), { id: TOAST_ID });

    try {
      const supabase = createClient();
      const payload = {
        slug,
        title_en: titleEn.trim(),
        title_fr: titleFr.trim(),
        body_en: blocksToJson(bodyEn),
        body_fr: blocksToJson(bodyFr),
        status,
      };
      // Upsert on slug so the fixed CMS page is created on first save and
      // updated thereafter without a separate create/edit branch.
      const { error } = await supabase
        .from("page_content")
        .upsert(payload as never, { onConflict: "slug" })
        .select()
        .single();
      if (error) throw error;

      toast.success(t("saved"), { id: TOAST_ID });
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.saveFailed");
      toast.error(message, { id: TOAST_ID });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t(`pageSlugs.${slug}`)}</h2>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? t("savingShort") : t("save")}
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-medium">{t("fields.status")}</label>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as (typeof STATUS_OPTIONS)[number])}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">{t("fields.titleEn")}</label>
          <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} required />
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
