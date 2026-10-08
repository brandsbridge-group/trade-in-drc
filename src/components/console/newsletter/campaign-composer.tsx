"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Check, FlaskConical, ImagePlus, Link as LinkIcon, Loader2, Save, Send, TriangleAlert } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/console/page-header";
import { saveNewsletterCampaign, sendNewsletterTest, type NewsletterOverview } from "@/lib/newsletter/campaign-actions";
import {
  CAMPAIGN_LANGUAGES,
  CAMPAIGN_LIMITS,
  EMPTY_CAMPAIGN,
  areCampaignUrlsValid,
  campaignText,
  isCampaignReady,
  isLanguageReady,
  type CampaignContent,
  type CampaignLanguage,
  type NewsletterCampaign,
} from "@/lib/newsletter/campaign-email";
import { EmailPreview } from "./email-preview";
import { SendReviewDialog } from "./send-review-dialog";
import { GHOST_PILL, NAVY_PILL, campaignPath } from "./constants";

function contentOf(campaign: NewsletterCampaign | null): CampaignContent {
  if (!campaign) return EMPTY_CAMPAIGN;
  const { subject_en, subject_fr, body_en, body_fr, link_url, photo_url } = campaign;
  return { subject_en, subject_fr, body_en, body_fr, link_url, photo_url };
}

function sameContent(a: CampaignContent, b: CampaignContent): boolean {
  return a.subject_en === b.subject_en && a.subject_fr === b.subject_fr && a.body_en === b.body_en && a.body_fr === b.body_fr && a.link_url === b.link_url && a.photo_url === b.photo_url;
}

/**
 * Writing a campaign: one language at a time on the left, the e-mail as it
 * will be delivered on the right. A draft can be saved unfinished; sending
 * needs both languages and goes through the review dialog.
 */
export function CampaignComposer({
  locale,
  campaign,
  overview,
}: {
  locale: string;
  campaign: NewsletterCampaign | null;
  overview: NewsletterOverview;
}) {
  const t = useTranslations("Admin.newsletter");
  const router = useRouter();
  const [content, setContent] = useState<CampaignContent>(() => contentOf(campaign));
  const [saved, setSaved] = useState<CampaignContent>(() => contentOf(campaign));
  const [campaignId, setCampaignId] = useState<string | null>(campaign?.id ?? null);
  const [language, setLanguage] = useState<CampaignLanguage>(locale === "fr" ? "fr" : "en");
  const [busy, setBusy] = useState<"save" | "test" | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const dirty = !sameContent(content, saved);
  const empty = Object.values(content).every((value) => value.trim() === "");
  const ready = isCampaignReady(content);
  const bothLanguagesReady = CAMPAIGN_LANGUAGES.every((option) => isLanguageReady(content, option));
  const fallbackLanguage = ready && !bothLanguagesReady
    ? CAMPAIGN_LANGUAGES.find((option) => isLanguageReady(content, option))
    : undefined;
  const { subject, body } = campaignText(content, language);

  // Leaving with unsaved text: the browser asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function edit(field: "subject" | "body", value: string) {
    setContent((current) => ({ ...current, [`${field}_${language}`]: value }));
  }

  /** Saves the draft and returns its id, or null when it could not be saved. */
  async function save(quiet = false): Promise<string | null> {
    setBusy("save");
    try {
      const snapshot = content;
      const result = await saveNewsletterCampaign(locale, snapshot, campaignId ?? undefined);
      if (!result.ok) {
        toast.error(t(result.error === "not_editable" ? "composer.notEditable" : "composer.saveError"));
        return null;
      }
      setSaved(snapshot);
      if (!campaignId) {
        setCampaignId(result.id);
        // The draft now has an address; the page stays as it is (no reload).
        window.history.replaceState(null, "", `/${locale}${campaignPath(result.id)}`);
      }
      if (!quiet) toast.success(t("composer.saved"));
      return result.id;
    } catch {
      toast.error(t("composer.saveError"));
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function sendTest() {
    setBusy("test");
    try {
      const result = await sendNewsletterTest(locale, content, [language]);
      if (result.ok) toast.success(t("composer.testSent", { email: result.to, language: t(`preview.language.${language}`) }));
      else toast.error(t(`composer.testErrors.${result.error}`));
    } catch {
      toast.error(t("composer.testErrors.send_failed"));
    } finally {
      setBusy(null);
    }
  }

  async function review() {
    const id = dirty || !campaignId ? await save(true) : campaignId;
    if (id) setReviewing(true);
  }

  const urlsValid = areCampaignUrlsValid(content);
  const subjectLength = subject.trim().length;
  const bodyLength = body.trim().length;

  return (
    <div className="space-y-4">
      <Link
        href={ROUTES.CONSOLE_NEWSLETTER}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-market-navy"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("composer.back")}
      </Link>

      {/* The actions wrap under the title on a phone (PageHeader's own action slot does not shrink). */}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <PageHeader title={t(campaignId ? "composer.editTitle" : "composer.newTitle")} subtitle={t("composer.subtitle")} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-slate-500" aria-live="polite">
            {empty ? "" : t(dirty ? "composer.unsaved" : "composer.savedState")}
          </span>
          <button
            type="button"
            onClick={sendTest}
            disabled={busy !== null || !subject.trim() || !body.trim() || overview.blocker !== null}
            className={GHOST_PILL}
          >
            {busy === "test" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FlaskConical className="size-4" aria-hidden />}
            {t("composer.sendTest")}
          </button>
          <button type="button" onClick={() => void save()} disabled={busy !== null || !dirty || empty} className={GHOST_PILL}>
            {busy === "save" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
            {t("composer.saveDraft")}
          </button>
          <button type="button" onClick={review} disabled={busy !== null} aria-describedby="campaign-readiness" className={NAVY_PILL}>
            <Send className="size-4" aria-hidden />
            {t("composer.review")}
          </button>
        </div>
      </div>

      {overview.blocker && (
        <p className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800 ring-1 ring-amber-200/70">
          <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden />
          {t(`notReady.${overview.blocker}`)}
        </p>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <section className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200/70 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label={t("composer.languageTabs")} className="inline-flex gap-0.5 rounded-xl bg-slate-200/70 p-1">
              {CAMPAIGN_LANGUAGES.map((option) => {
                const done = isLanguageReady(content, option);
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={language === option}
                    onClick={() => setLanguage(option)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                      language === option ? "bg-white font-semibold text-market-navy ring-1 ring-slate-200" : "text-slate-600 hover:text-market-navy"
                    )}
                  >
                    {t(`preview.language.${option}`)}
                    {done ? (
                      <Check className="size-3.5 text-emerald-600" aria-hidden />
                    ) : (
                      <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
                    )}
                    <span className="sr-only">{t(done ? "composer.languageReady" : "composer.languageMissing")}</span>
                  </button>
                );
              })}
            </div>
            <p id="campaign-readiness" className={cn("text-xs", ready ? "text-emerald-700" : "text-slate-500")} aria-live="polite">
              {!urlsValid
                ? t("composer.invalidUrl")
                : bothLanguagesReady
                  ? t("composer.bothReady")
                  : fallbackLanguage
                    ? t("composer.fallbackWillBeUsed", { language: t(`preview.language.${fallbackLanguage}`) })
                    : t("composer.languageMissing")}
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="campaign-subject" className="text-[13px] font-semibold text-market-navy">
                {t("composer.subject")}
              </label>
              <span className="text-xs tabular-nums text-slate-400">
                {subjectLength}/{CAMPAIGN_LIMITS.subjectMax}
              </span>
            </div>
            <Input
              id="campaign-subject"
              lang={language}
              value={subject}
              maxLength={CAMPAIGN_LIMITS.subjectMax}
              onChange={(event) => edit("subject", event.target.value)}
              placeholder={t("composer.subjectPlaceholder")}
              className="mt-1.5"
            />
            <p className="mt-1.5 text-xs text-slate-500">{t("composer.subjectHint")}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="campaign-link-url" className="flex items-center gap-1.5 text-[13px] font-semibold text-market-navy">
                <LinkIcon className="size-3.5" aria-hidden />
                {t("composer.linkUrl")}
              </label>
              <Input
                id="campaign-link-url"
                type="url"
                value={content.link_url}
                onChange={(event) => setContent((current) => ({ ...current, link_url: event.target.value }))}
                placeholder="https://example.com"
                className="mt-1.5"
              />
              <p className="mt-1.5 text-xs text-slate-500">{t("composer.linkUrlHint")}</p>
            </div>
            <div>
              <label htmlFor="campaign-photo-url" className="flex items-center gap-1.5 text-[13px] font-semibold text-market-navy">
                <ImagePlus className="size-3.5" aria-hidden />
                {t("composer.photoUrl")}
              </label>
              <Input
                id="campaign-photo-url"
                type="url"
                value={content.photo_url}
                onChange={(event) => setContent((current) => ({ ...current, photo_url: event.target.value }))}
                placeholder="https://example.com/photo.jpg"
                className="mt-1.5"
              />
              <p className="mt-1.5 text-xs text-slate-500">{t("composer.photoUrlHint")}</p>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="campaign-body" className="text-[13px] font-semibold text-market-navy">
                {t("composer.body")}
              </label>
              <span className="text-xs tabular-nums text-slate-400">
                {bodyLength}/{CAMPAIGN_LIMITS.bodyMax}
              </span>
            </div>
            <Textarea
              id="campaign-body"
              lang={language}
              value={body}
              maxLength={CAMPAIGN_LIMITS.bodyMax}
              onChange={(event) => edit("body", event.target.value)}
              placeholder={t("composer.bodyPlaceholder")}
              rows={16}
              className="mt-1.5 min-h-[320px] leading-relaxed"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              {bodyLength > 0 && bodyLength < CAMPAIGN_LIMITS.bodyMin
                ? t("composer.bodyTooShort", { min: CAMPAIGN_LIMITS.bodyMin })
                : t("composer.bodyHint")}
            </p>
          </div>
        </section>

        <div className="xl:sticky xl:top-4">
          <EmailPreview language={language} subject={subject} body={body} linkUrl={content.link_url} photoUrl={content.photo_url} sender={overview.sender} />
        </div>
      </div>

      {reviewing && campaignId && (
        <SendReviewDialog
          locale={locale}
          campaign={{
            id: campaignId,
            status: "draft",
            failed_count: 0,
            subject_en: content.subject_en,
            subject_fr: content.subject_fr,
            body_en: content.body_en,
            body_fr: content.body_fr,
            link_url: content.link_url,
            photo_url: content.photo_url,
          }}
          overview={overview}
          onClose={() => setReviewing(false)}
          onStarted={() => router.push(ROUTES.CONSOLE_NEWSLETTER)}
        />
      )}
    </div>
  );
}
