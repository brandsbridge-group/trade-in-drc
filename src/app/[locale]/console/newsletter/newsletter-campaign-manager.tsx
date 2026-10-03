"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Send, Plus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { NewsletterCampaign } from "@/lib/newsletter/campaign-actions";
import { createNewsletterCampaign, sendNewsletterCampaign } from "@/lib/newsletter/campaign-actions";

export function NewsletterCampaignManager({
  locale,
  campaigns,
}: {
  locale: string;
  campaigns: NewsletterCampaign[];
}) {
  const t = useTranslations("Admin.newsletter");
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);

  async function createCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const result = await createNewsletterCampaign(locale, {
        subject_en: String(form.get("subject_en") ?? ""),
        subject_fr: String(form.get("subject_fr") ?? ""),
        body_en: String(form.get("body_en") ?? ""),
        body_fr: String(form.get("body_fr") ?? ""),
      });
      if (!result.ok) {
        toast.error(t("saveError"));
        return;
      }
      toast.success(t("saved"));
      setShowForm(false);
      router.refresh();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setBusy(false);
    }
  }

  async function sendCampaign(id: string) {
    if (!window.confirm(t("confirmSend"))) return;
    setBusy(true);
    try {
      const result = await sendNewsletterCampaign(locale, id);
      if (result.error === "not_sendable") {
        toast.error(t("alreadySending"));
      } else if (result.error === "recipient_limit") {
        toast.error(t("recipientLimit"));
      } else if (result.sent > 0 || result.ok) {
        toast.success(t("sendSummary", { sent: result.sent, failed: result.failed }));
      } else {
        toast.error(t("sendError"));
      }
      router.refresh();
    } catch {
      toast.error(t("sendError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
      <section className="border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{t("campaigns")}</h2>
          <Button size="sm" onClick={() => setShowForm((visible) => !visible)}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            {showForm ? t("cancel") : t("newCampaign")}
          </Button>
        </div>
        {campaigns.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">{t("empty")}</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {campaigns.map((campaign) => (
              <article key={campaign.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">{locale === "fr" ? campaign.subject_fr : campaign.subject_en}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>{t(`status.${campaign.status}`)}</span>
                    <span>{new Date(campaign.created_at).toLocaleDateString(locale)}</span>
                    <span>{t("deliveryStats", { sent: campaign.sent_count, failed: campaign.failed_count, total: campaign.recipient_count })}</span>
                  </div>
                </div>
                {(campaign.status === "draft" || campaign.status === "failed") && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void sendCampaign(campaign.id)}>
                    <Send className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    {campaign.status === "failed" ? t("retry") : t("send")}
                  </Button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-market-or-dark" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-900">{t("editorTitle")}</h2>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{t("editorHint")}</p>

        {showForm && (
          <form onSubmit={createCampaign} className="mt-4 space-y-3">
            <label className="block text-xs font-medium text-slate-700">
              {t("subjectEn")}
              <Input name="subject_en" required maxLength={180} className="mt-1" />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              {t("bodyEn")}
              <Textarea name="body_en" required minLength={20} maxLength={8000} rows={5} className="mt-1" />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              {t("subjectFr")}
              <Input name="subject_fr" required maxLength={180} className="mt-1" />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              {t("bodyFr")}
              <Textarea name="body_fr" required minLength={20} maxLength={8000} rows={5} className="mt-1" />
            </label>
            <Button type="submit" disabled={busy} className="w-full">
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              {busy ? t("saving") : t("saveDraft")}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
