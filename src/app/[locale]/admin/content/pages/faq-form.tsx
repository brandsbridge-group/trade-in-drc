"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { FaqRow } from "@/lib/content/pages";

const TOAST_ID = "faq-save";

interface FaqFormProps {
  initial?: FaqRow;
  mode: "create" | "edit";
}

export function FaqForm({ initial, mode }: FaqFormProps) {
  const t = useTranslations("AdminCms");
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [questionEn, setQuestionEn] = React.useState(initial?.question_en ?? "");
  const [questionFr, setQuestionFr] = React.useState(initial?.question_fr ?? "");
  const [answerEn, setAnswerEn] = React.useState(initial?.answer_en ?? "");
  const [answerFr, setAnswerFr] = React.useState(initial?.answer_fr ?? "");
  const [category, setCategory] = React.useState(initial?.category ?? "");
  const [sortOrder, setSortOrder] = React.useState(String(initial?.sort_order ?? 0));
  const [published, setPublished] = React.useState(initial?.published ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionEn.trim() || !questionFr.trim() || !answerEn.trim() || !answerFr.trim()) {
      toast.error(t("errors.faqRequired"));
      return;
    }
    setSaving(true);
    toast.loading(t("saving"), { id: TOAST_ID });

    try {
      const supabase = createClient();
      const payload = {
        question_en: questionEn.trim(),
        question_fr: questionFr.trim(),
        answer_en: answerEn.trim(),
        answer_fr: answerFr.trim(),
        category: category.trim() || null,
        sort_order: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        published,
      };

      if (mode === "create") {
        const { data, error } = await supabase
          .from("faqs")
          .insert(payload as never)
          .select()
          .single();
        if (error) throw error;
        toast.success(t("created"), { id: TOAST_ID });
        const newRow = data as unknown as FaqRow;
        router.push(`/admin/content/pages/faqs/${newRow.id}`);
      } else {
        const { error } = await supabase
          .from("faqs")
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
      const { error } = await supabase.from("faqs").delete().eq("id", initial.id);
      if (error) throw error;
      toast.success(t("deleted"), { id: TOAST_ID });
      router.push("/admin/content/pages/faqs");
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
          {mode === "create" ? t("faqs.new") : t("faqs.edit")}
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
          <label className="text-xs text-muted-foreground font-medium">{t("fields.category")}</label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t("fields.categoryPlaceholder")} />
        </div>
        <div className="space-y-1 md:col-span-1">
          <label className="text-xs text-muted-foreground font-medium">{t("fields.sortOrder")}</label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <div className="space-y-1 md:col-span-1">
          <label className="text-xs text-muted-foreground font-medium">{t("fields.published")}</label>
          <div className="flex h-9 items-center gap-2">
            <Switch checked={published} onCheckedChange={setPublished} />
            <span className="text-sm text-muted-foreground">
              {published ? t("status.published") : t("status.draft")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">{t("fields.questionEn")}</label>
          <Input value={questionEn} onChange={(e) => setQuestionEn(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">{t("fields.questionFr")}</label>
          <Input value={questionFr} onChange={(e) => setQuestionFr(e.target.value)} required />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">{t("fields.answerEn")}</label>
          <Textarea value={answerEn} onChange={(e) => setAnswerEn(e.target.value)} rows={5} required />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">{t("fields.answerFr")}</label>
          <Textarea value={answerFr} onChange={(e) => setAnswerFr(e.target.value)} rows={5} required />
        </div>
      </div>
    </form>
  );
}
