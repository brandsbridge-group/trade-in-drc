"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/content/slug";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AssetUploader } from "@/components/admin/asset-uploader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReportKind } from "@/lib/data-hub/kinds";
import type { Report, ReportStatus } from "@/lib/data-hub/types";

const STATUS_OPTIONS: ReportStatus[] = ["draft", "published", "archived"];

interface Sector {
  id: string;
  name_en: string;
  name_fr: string;
}

interface ReportFormProps {
  kind: ReportKind;
  mode: "create" | "edit";
  initial?: Partial<Report>;
  sectors: Sector[];
}

export function ReportForm({ kind, mode, initial, sectors }: ReportFormProps) {
  const t = useTranslations("DataHub");
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [titleEn, setTitleEn] = React.useState(initial?.title_en ?? "");
  const [titleFr, setTitleFr] = React.useState(initial?.title_fr ?? "");
  const [summaryEn, setSummaryEn] = React.useState(initial?.summary_en ?? "");
  const [summaryFr, setSummaryFr] = React.useState(initial?.summary_fr ?? "");
  const [bodyEn, setBodyEn] = React.useState(initial?.body_en ?? "");
  const [bodyFr, setBodyFr] = React.useState(initial?.body_fr ?? "");
  const [attachmentUrl, setAttachmentUrl] = React.useState(initial?.attachment_url ?? "");
  const [sectorId, setSectorId] = React.useState(initial?.sector_id ?? "");
  const [slug, setSlug] = React.useState(initial?.slug ?? "");
  const [status, setStatus] = React.useState<ReportStatus>(initial?.status ?? "draft");

  const handleTitleEnChange = (val: string) => {
    setTitleEn(val);
    if (!initial?.slug || slug === slugify(titleEn)) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        kind,
        title_en: titleEn,
        title_fr: titleFr,
        summary_en: summaryEn || null,
        summary_fr: summaryFr || null,
        body_en: bodyEn,
        body_fr: bodyFr,
        attachment_url: attachmentUrl || null,
        sector_id: sectorId || null,
        slug: slug || slugify(titleEn),
        status,
      };

      if (mode === "create") {
        const { data, error } = await supabase
          .from("reports")
          .insert(payload as never)
          .select()
          .single();
        if (error) throw error;
        toast.success(t("admin.saved"));
        const newReport = data as unknown as Report;
        router.push(`/admin/data-hub/reports/${kind}/${newReport.id}`);
      } else {
        const { error } = await supabase
          .from("reports")
          .update(payload as never)
          .eq("id", initial!.id!)
          .select()
          .single();
        if (error) throw error;
        toast.success(t("admin.saved"));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("admin.deleteConfirm"))) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", initial!.id!);
      if (error) throw error;
      toast.success(t("admin.deleted"));
      router.push(`/admin/data-hub/reports/${kind}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      toast.error(message);
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {mode === "create"
            ? t(`admin.newKind.${kind}`)
            : t(`admin.editKind.${kind}`)}
        </h2>
        <div className="flex gap-2">
          {mode === "edit" && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t("admin.deleting") : t("admin.delete")}
            </Button>
          )}
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? t("admin.saving") : t("admin.save")}
          </Button>
        </div>
      </div>

      {/* Status + Slug row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("fields.status")}</label>
          <Select value={status} onValueChange={(v) => setStatus(v as ReportStatus)}>
            <SelectTrigger className="h-8 text-sm">
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
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("fields.slug")}</label>
          <Input
            className="h-8 text-sm"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={t("admin.slugPlaceholder")}
          />
        </div>
      </div>

      {/* Sector */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">{t("fields.sector")}</label>
        <Select value={sectorId || "__none__"} onValueChange={(v) => setSectorId(v === "__none__" ? "" : v)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder={t("admin.none")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">{t("admin.none")}</SelectItem>
            {sectors.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Titles */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("fields.title")} (EN)</label>
          <Input
            className="h-8 text-sm"
            value={titleEn}
            onChange={(e) => handleTitleEnChange(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("fields.title")} (FR)</label>
          <Input
            className="h-8 text-sm"
            value={titleFr}
            onChange={(e) => setTitleFr(e.target.value)}
          />
        </div>
      </div>

      {/* Summaries */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("fields.summary")} (EN)</label>
          <Textarea
            className="text-sm min-h-[60px]"
            value={summaryEn}
            onChange={(e) => setSummaryEn(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("fields.summary")} (FR)</label>
          <Textarea
            className="text-sm min-h-[60px]"
            value={summaryFr}
            onChange={(e) => setSummaryFr(e.target.value)}
          />
        </div>
      </div>

      {/* Bodies */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("fields.body")} (EN)</label>
          <Textarea
            className="text-sm min-h-[160px] font-mono"
            value={bodyEn}
            onChange={(e) => setBodyEn(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("fields.body")} (FR)</label>
          <Textarea
            className="text-sm min-h-[160px] font-mono"
            value={bodyFr}
            onChange={(e) => setBodyFr(e.target.value)}
          />
        </div>
      </div>

      {/* Attachment (PDF / document upload or external URL) */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">{t("fields.attachment")}</label>
        <AssetUploader
          folder="report-attachments"
          value={attachmentUrl}
          onChange={setAttachmentUrl}
          preview="file"
          accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx"
        />
      </div>
    </form>
  );
}
