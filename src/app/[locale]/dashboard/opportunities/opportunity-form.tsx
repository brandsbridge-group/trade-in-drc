"use client";

import * as React from "react";
import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/content/slug";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OPPORTUNITY_CATEGORIES } from "@/lib/opportunities/categories";
import type { SectorOption } from "@/lib/opportunities/queries";
import type { Opportunity, OpportunityStatus } from "@/lib/opportunities/types";

interface OpportunityFormProps {
  mode: "create" | "edit";
  initial?: Partial<Opportunity>;
  companies: { id: string; name: string }[];
  /**
   * Sector options for the bilingual sector <Select>. Optional so callers that
   * have not yet been wired to fetch sectors keep compiling; when omitted the
   * sector field renders with only the "no sector" option.
   */
  sectors?: SectorOption[];
}

/**
 * Validation schema for an opportunity submission. Mirrors the NOT NULL columns
 * in migration 00007: company_id, category, EN/FR title + summary are required;
 * budget min must not exceed budget max when both are present. Body and sector
 * are optional. Errors are surfaced inline per-field, never silently dropped.
 */
const opportunitySchema = z
  .object({
    company_id: z.string().uuid("validation.companyRequired"),
    category: z.enum(OPPORTUNITY_CATEGORIES),
    title_en: z.string().trim().min(1, "validation.titleEnRequired"),
    title_fr: z.string().trim().min(1, "validation.titleFrRequired"),
    summary_en: z.string().trim().min(1, "validation.summaryEnRequired"),
    summary_fr: z.string().trim().min(1, "validation.summaryFrRequired"),
    slug: z.string().trim().min(1, "validation.slugRequired"),
    budget_min: z.number().nonnegative("validation.budgetNegative").nullable(),
    budget_max: z.number().nonnegative("validation.budgetNegative").nullable(),
    sector_id: dbId().nullable(),
  })
  .refine(
    (v) =>
      v.budget_min === null ||
      v.budget_max === null ||
      v.budget_min <= v.budget_max,
    { path: ["budget_max"], message: "validation.budgetRange" }
  );

type FieldErrors = Partial<Record<string, string>>;

export function OpportunityForm({
  mode,
  initial,
  companies,
  sectors = [],
}: OpportunityFormProps) {
  const router = useRouter();
  const t = useTranslations("Opportunities");
  const locale = useLocale();
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<FieldErrors>({});

  const [companyId, setCompanyId] = React.useState(initial?.company_id ?? companies[0]?.id ?? "");
  const [category, setCategory] = React.useState(initial?.category ?? OPPORTUNITY_CATEGORIES[0]);
  const [titleEn, setTitleEn] = React.useState(initial?.title_en ?? "");
  const [titleFr, setTitleFr] = React.useState(initial?.title_fr ?? "");
  const [summaryEn, setSummaryEn] = React.useState(initial?.summary_en ?? "");
  const [summaryFr, setSummaryFr] = React.useState(initial?.summary_fr ?? "");
  const [bodyEn, setBodyEn] = React.useState(initial?.body_en ?? "");
  const [bodyFr, setBodyFr] = React.useState(initial?.body_fr ?? "");
  const [slug, setSlug] = React.useState(initial?.slug ?? "");
  const [deadlineAt, setDeadlineAt] = React.useState(
    initial?.deadline_at ? initial.deadline_at.slice(0, 16) : ""
  );
  const [budgetMin, setBudgetMin] = React.useState(
    initial?.budget_min != null ? String(initial.budget_min) : ""
  );
  const [budgetMax, setBudgetMax] = React.useState(
    initial?.budget_max != null ? String(initial.budget_max) : ""
  );
  const [budgetCurrency, setBudgetCurrency] = React.useState(
    initial?.budget_currency ?? "USD"
  );
  const [region, setRegion] = React.useState(initial?.region ?? "");
  const [sectorId, setSectorId] = React.useState(initial?.sector_id ?? "");

  // Auto-derive slug from title_en when slug is empty or was auto-derived
  const handleTitleEnChange = (val: string) => {
    setTitleEn(val);
    if (!initial?.slug || slug === slugify(titleEn)) {
      setSlug(slugify(val));
    }
  };

  const handleSave = async (status: OpportunityStatus) => {
    const parsed = opportunitySchema.safeParse({
      company_id: companyId,
      category,
      title_en: titleEn,
      title_fr: titleFr,
      summary_en: summaryEn,
      summary_fr: summaryFr,
      slug: slug || slugify(titleEn),
      budget_min: budgetMin ? Number(budgetMin) : null,
      budget_max: budgetMax ? Number(budgetMax) : null,
      sector_id: sectorId || null,
    });

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in fieldErrors)) {
          fieldErrors[key] = t(issue.message as Parameters<typeof t>[0]);
        }
      }
      setErrors(fieldErrors);
      toast.error(t("validation.fixErrors"));
      return;
    }
    setErrors({});

    const payload: Record<string, unknown> = {
      ...parsed.data,
      body_en: bodyEn,
      body_fr: bodyFr,
      deadline_at: deadlineAt || null,
      budget_currency: budgetCurrency || null,
      region: region || null,
      status,
    };

    setSaving(true);
    try {
      const supabase = createClient();

      if (mode === "create") {
        const { data, error } = await supabase
          .from("opportunities")
          .insert(payload as never)
          .select("id")
          .single();

        if (error) throw error;
        toast.success(status === "draft" ? t("form.savedDraft") : t("form.submittedReview"));
        router.push(`/dashboard/opportunities/${data.id}`);
      } else {
        const { error } = await supabase
          .from("opportunities")
          .update(payload as never)
          .eq("id", initial!.id!)
          .select("id")
          .single();

        if (error) throw error;
        toast.success(status === "draft" ? t("form.saved") : t("form.submittedReview"));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("form.genericError");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
      {/* Company */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t("form.company")}</label>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger>
            <SelectValue placeholder={t("form.selectCompany")} />
          </SelectTrigger>
          <SelectContent>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.company_id && (
          <p className="text-xs text-destructive">{errors.company_id}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t("fields.category")}</label>
        <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPPORTUNITY_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {t(`categories.${cat}` as Parameters<typeof t>[0])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Titles */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("form.titleEn")}</label>
          <Input
            value={titleEn}
            onChange={(e) => handleTitleEnChange(e.target.value)}
            placeholder={t("form.titleEnPlaceholder")}
            aria-invalid={Boolean(errors.title_en)}
          />
          {errors.title_en && (
            <p className="text-xs text-destructive">{errors.title_en}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("form.titleFr")}</label>
          <Input
            value={titleFr}
            onChange={(e) => setTitleFr(e.target.value)}
            placeholder={t("form.titleFrPlaceholder")}
            aria-invalid={Boolean(errors.title_fr)}
          />
          {errors.title_fr && (
            <p className="text-xs text-destructive">{errors.title_fr}</p>
          )}
        </div>
      </div>

      {/* Summaries */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("form.summaryEn")}</label>
          <Textarea
            value={summaryEn}
            onChange={(e) => setSummaryEn(e.target.value)}
            placeholder={t("form.summaryEnPlaceholder")}
            rows={3}
            aria-invalid={Boolean(errors.summary_en)}
          />
          {errors.summary_en && (
            <p className="text-xs text-destructive">{errors.summary_en}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("form.summaryFr")}</label>
          <Textarea
            value={summaryFr}
            onChange={(e) => setSummaryFr(e.target.value)}
            placeholder={t("form.summaryFrPlaceholder")}
            rows={3}
            aria-invalid={Boolean(errors.summary_fr)}
          />
          {errors.summary_fr && (
            <p className="text-xs text-destructive">{errors.summary_fr}</p>
          )}
        </div>
      </div>

      {/* Bodies */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("form.bodyEn")}</label>
          <Textarea
            value={bodyEn}
            onChange={(e) => setBodyEn(e.target.value)}
            placeholder={t("form.bodyEnPlaceholder")}
            rows={6}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("form.bodyFr")}</label>
          <Textarea
            value={bodyFr}
            onChange={(e) => setBodyFr(e.target.value)}
            placeholder={t("form.bodyFrPlaceholder")}
            rows={6}
          />
        </div>
      </div>

      {/* Slug */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t("fields.slug")}</label>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={t("form.slugPlaceholder")}
          aria-invalid={Boolean(errors.slug)}
        />
        {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
      </div>

      {/* Deadline */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t("fields.deadline")}</label>
        <Input
          type="datetime-local"
          value={deadlineAt}
          onChange={(e) => setDeadlineAt(e.target.value)}
        />
      </div>

      {/* Budget */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("form.budgetMin")}</label>
          <Input
            type="number"
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("form.budgetMax")}</label>
          <Input
            type="number"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            placeholder="0"
            aria-invalid={Boolean(errors.budget_max)}
          />
          {errors.budget_max && (
            <p className="text-xs text-destructive">{errors.budget_max}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("form.currency")}</label>
          <Input
            value={budgetCurrency}
            onChange={(e) => setBudgetCurrency(e.target.value)}
            placeholder="USD"
          />
        </div>
      </div>

      {/* Region */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t("fields.region")}</label>
        <Input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder={t("form.regionPlaceholder")}
        />
      </div>

      {/* Sector */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t("fields.sector")}</label>
        <Select
          value={sectorId || "none"}
          onValueChange={(v) => setSectorId(v === "none" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("fields.sectorPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("fields.sectorNone")}</SelectItem>
            {sectors.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {pickLocalized(s, "name", locale as Locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.sector_id && (
          <p className="text-xs text-destructive">{errors.sector_id}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={() => handleSave("draft")}
        >
          {t("form.saveDraft")}
        </Button>
        <Button
          type="button"
          disabled={saving}
          onClick={() => handleSave("pending_review")}
        >
          {t("form.submitForReview")}
        </Button>
      </div>
    </form>
  );
}
