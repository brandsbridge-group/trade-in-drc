"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, Save, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { toExternalHref } from "@/lib/url/external-href";
import { applyDraft, changedFields, readLocalDraft, writeLocalDraft } from "@/lib/drafts/local-draft";
import { MediaManager } from "@/components/dashboard/media-manager";
import { CardSkeleton } from "@/components/dashboard/overview/overview-card";
import { fetchOwnerContent } from "@/lib/dashboard/overview/queries";
import {
  COMPLETENESS_SECTION,
  MIN_DESCRIPTION_LENGTH,
  profileCompleteness,
  type EditorSection,
} from "@/lib/dashboard/overview/profile-completeness";

interface RefOption {
  id: string;
  name_en: string;
  name_fr: string;
}

interface HsCodeOption extends RefOption {
  code: string;
}

interface CompanyForm {
  name: string;
  sectorId: string;
  province: string;
  city: string;
  description: string;
  website: string;
  capacity: string;
  moq: string;
  leadTime: string;
  certifications: string;
  markets: string;
  languages: string;
  contactEmail: string;
  contactPhone: string;
}

const EMPTY_FORM: CompanyForm = {
  name: "",
  sectorId: "",
  province: "",
  city: "",
  description: "",
  website: "",
  capacity: "",
  moq: "",
  leadTime: "",
  certifications: "",
  markets: "",
  languages: "",
  contactEmail: "",
  contactPhone: "",
};

/** Sections saved from this form (media saves itself as files are added). */
type FormSection = Exclude<EditorSection, "media">;

/** Fields of each block: what its Save writes and what its "n/total" counts. */
const SECTION_FIELDS: Record<FormSection, (keyof CompanyForm)[]> = {
  presentation: ["name", "sectorId", "province", "city", "description", "website"],
  commerce: ["capacity", "moq", "leadTime", "certifications", "markets", "languages"],
  contact: ["contactEmail", "contactPhone"],
};

/** text[] column -> comma-separated string for the form. */
const arrayToText = (value: string[] | null | undefined): string => value?.join(", ") ?? "";

/** comma-separated form value -> trimmed text[] for the DB. */
const textToArray = (value: string): string[] =>
  value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id));

/** Unsaved edits of one company, kept in this browser (see `local-draft.ts`). */
const draftKey = (companyId: string) => `tidrc:company-edit:draft:v1:${companyId}`;

interface EditorDraft {
  form?: Partial<CompanyForm>;
  tagIds?: string[];
  hsCodeIds?: string[];
}

function ProgressRing({ percent }: { percent: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-14 w-14 shrink-0 place-items-center" aria-hidden>
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" className="stroke-slate-200" />
        <circle
          cx="28" cy="28" r={r} fill="none" strokeWidth="5" strokeLinecap="round"
          className="stroke-market-or-dark" strokeDasharray={`${(percent / 100) * c} ${c}`}
        />
      </svg>
      <span className="text-xs font-bold tabular-nums text-market-navy">{percent}%</span>
    </div>
  );
}

interface SectionCardProps {
  id: EditorSection | "verification";
  title: string;
  hint: string;
  /** "n/total filled" pill; omitted for blocks that are not a list of fields. */
  filled?: { done: number; total: number };
  /** Omitted for blocks that save themselves (media) or only link elsewhere. */
  save?: { onSave: () => void; saving: boolean; dirty: boolean };
  children: React.ReactNode;
}

/** One block of the editor: its own progress and its own Save. */
function SectionCard({ id, title, hint, filled, save, children }: SectionCardProps) {
  const t = useTranslations("Dashboard.editCompany");
  const complete = filled && filled.done === filled.total;
  return (
    // scroll-mt: the dashboard top bar is sticky, an anchor must land below it.
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 rounded-2xl bg-white p-5 ring-1 ring-slate-200/70">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="font-display text-base font-semibold text-market-navy">{title}</h2>
          <p className="text-xs text-slate-500">{hint}</p>
        </div>
        {filled && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
              complete ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
            )}
          >
            {complete && <Check className="h-3 w-3" aria-hidden />}
            {t("filled", filled)}
          </span>
        )}
      </div>
      {children}
      {save && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className={cn("min-w-0 flex-1 text-xs", save.dirty ? "text-amber-700" : "text-slate-400")}>
            {save.dirty ? `${t("unsaved")} ${t("draft.kept")}` : t("upToDate")}
          </p>
          <button
            type="button"
            onClick={save.onSave}
            disabled={save.saving || !save.dirty}
            className="inline-flex items-center gap-2 rounded-full bg-market-navy px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {save.saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
            {t("save")}
          </button>
        </div>
      )}
    </section>
  );
}

/**
 * Company profile editor, in blocks: presentation, commerce, contact, media —
 * each with its own progress and Save, so the profile is completed a block at
 * a time. The completeness header links to the block holding each missing
 * item (same anchors as the dashboard home's "complete your profile" row).
 * Legal identifiers and documents live on the verification screen.
 */
export default function EditCompanyPage() {
  const t = useTranslations("Dashboard.editCompany");
  const tMissing = useTranslations("DashboardOverview.missing");
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const companyId = params.id as string;

  const localizedName = React.useCallback(
    (row: { name_en: string; name_fr: string }) => (locale === "fr" ? row.name_fr : row.name_en),
    [locale]
  );

  const [loading, setLoading] = React.useState(true);
  const [savingSection, setSavingSection] = React.useState<FormSection | null>(null);
  const [form, setForm] = React.useState<CompanyForm>(EMPTY_FORM);
  // What is in the database: drives "unsaved changes" and the completeness score.
  const [saved, setSaved] = React.useState<CompanyForm>(EMPTY_FORM);
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [sectors, setSectors] = React.useState<RefOption[]>([]);
  const [tags, setTags] = React.useState<RefOption[]>([]);
  const [hsCodes, setHsCodes] = React.useState<HsCodeOption[]>([]);
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);
  const [selectedHsCodeIds, setSelectedHsCodeIds] = React.useState<string[]>([]);
  // Join-table rows as stored, used to diff on save.
  const [savedTagIds, setSavedTagIds] = React.useState<string[]>([]);
  const [savedHsCodeIds, setSavedHsCodeIds] = React.useState<string[]>([]);
  // True when unsaved edits from an earlier visit were put back into the form.
  const [draftRestored, setDraftRestored] = React.useState(false);

  const content = useQuery({
    queryKey: ["overview", "content", [companyId]],
    queryFn: () => fetchOwnerContent([companyId]),
    enabled: !!companyId,
  });

  React.useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData.user?.id;

        const [companyRes, sectorsRes, tagsRes, hsCodesRes, companyTagsRes, companyHsRes] = await Promise.all([
          supabase.from("companies").select("*").eq("id", companyId).single(),
          supabase.from("sectors").select("id, name_en, name_fr").order("sort_order", { ascending: true }).order("name_en", { ascending: true }),
          supabase.from("tags").select("id, name_en, name_fr").order("name_en", { ascending: true }),
          supabase.from("hs_codes").select("id, code, name_en, name_fr").order("code", { ascending: true }),
          supabase.from("company_tags").select("tag_id").eq("company_id", companyId),
          supabase.from("company_hs_codes").select("hs_code_id").eq("company_id", companyId),
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
        const loadedHsCodeIds = (companyHsRes.data ?? []).map((r) => r.hs_code_id);
        setSavedTagIds(loadedTagIds);
        setSavedHsCodeIds(loadedHsCodeIds);
        setSelectedTagIds(loadedTagIds);
        setSelectedHsCodeIds(loadedHsCodeIds);

        const loaded: CompanyForm = {
          name: company.name ?? "",
          sectorId: company.sector_id ?? "",
          province: company.province ?? "",
          city: company.city ?? "",
          description: company.description ?? "",
          website: company.website ?? "",
          capacity: company.production_capacity ?? "",
          moq: company.moq ?? "",
          leadTime: company.lead_time ?? "",
          certifications: arrayToText(company.certifications),
          markets: arrayToText(company.markets),
          languages: arrayToText(company.spoken_languages),
          contactEmail: company.contact_email ?? "",
          contactPhone: company.contact_phone ?? "",
        };
        // Edits typed earlier and never saved come back over the stored values.
        const draft = readLocalDraft<EditorDraft>(draftKey(companyId));
        const restoredForm = applyDraft(loaded, draft?.form);
        const draftTagIds = Array.isArray(draft?.tagIds) ? draft.tagIds.filter((id) => typeof id === "string") : null;
        const draftHsCodeIds = Array.isArray(draft?.hsCodeIds) ? draft.hsCodeIds.filter((id) => typeof id === "string") : null;
        if (draftTagIds) setSelectedTagIds(draftTagIds);
        if (draftHsCodeIds) setSelectedHsCodeIds(draftHsCodeIds);
        setDraftRestored(
          changedFields(restoredForm, loaded) !== null ||
            (draftTagIds !== null && !sameIds(draftTagIds, loadedTagIds)) ||
            (draftHsCodeIds !== null && !sameIds(draftHsCodeIds, loadedHsCodeIds))
        );

        setForm(restoredForm);
        setSaved(loaded);
        setLogoUrl(company.logo_url ?? null);
      } catch (error) {
        console.error("Error loading company:", error);
        toast.error(t("loadError"));
      } finally {
        setLoading(false);
      }
    };

    if (companyId) load();
  }, [companyId, router, t]);

  // The form renders after an async load, so the browser's own anchor jump has
  // already missed: land on the requested block once it exists.
  React.useEffect(() => {
    if (loading) return;
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [loading]);

  // Keep unsaved edits in this browser: leaving the page before pressing Save
  // loses nothing. Only once the stored values are loaded — before that the
  // form is empty and would wipe the draft it is about to restore.
  React.useEffect(() => {
    if (loading || !companyId) return;
    const formDraft = changedFields(form, saved);
    const tagsDirty = !sameIds(selectedTagIds, savedTagIds);
    const hsDirty = !sameIds(selectedHsCodeIds, savedHsCodeIds);
    const draft: EditorDraft | null =
      formDraft || tagsDirty || hsDirty
        ? {
            ...(formDraft ? { form: formDraft } : {}),
            ...(tagsDirty ? { tagIds: selectedTagIds } : {}),
            ...(hsDirty ? { hsCodeIds: selectedHsCodeIds } : {}),
          }
        : null;
    writeLocalDraft(draftKey(companyId), draft);
  }, [loading, companyId, form, saved, selectedTagIds, savedTagIds, selectedHsCodeIds, savedHsCodeIds]);

  const discardDraft = () => {
    setForm(saved);
    setSelectedTagIds(savedTagIds);
    setSelectedHsCodeIds(savedHsCodeIds);
    setDraftRestored(false);
  };

  const set = (patch: Partial<CompanyForm>) => setForm((prev) => ({ ...prev, ...patch }));

  const sectionState = (section: FormSection) => {
    const fields = SECTION_FIELDS[section];
    const dirtyFields = fields.some((key) => form[key] !== saved[key]);
    const dirtyJoins =
      section === "commerce" && (!sameIds(selectedTagIds, savedTagIds) || !sameIds(selectedHsCodeIds, savedHsCodeIds));
    return {
      filled: { done: fields.filter((key) => form[key].trim()).length, total: fields.length },
      dirty: dirtyFields || dirtyJoins,
    };
  };

  const saveSection = async (section: FormSection) => {
    if (section === "presentation" && !form.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    setSavingSection(section);
    const toastId = toast.loading(t("saving"));
    try {
      const supabase = createClient();
      // NOTE: trust columns (status, verification_tier, verified_at,
      // verification_summary) are never sent — owners cannot write them (RLS).
      const columns: Record<FormSection, Record<string, unknown>> = {
        presentation: {
          name: form.name.trim(),
          sector_id: form.sectorId || null,
          province: form.province.trim() || null,
          city: form.city.trim() || null,
          description: form.description.trim() || null,
          // People type "www.example.com"; store a real URL so profile links work.
          website: toExternalHref(form.website),
        },
        commerce: {
          production_capacity: form.capacity.trim() || null,
          moq: form.moq.trim() || null,
          lead_time: form.leadTime.trim() || null,
          certifications: textToArray(form.certifications),
          markets: textToArray(form.markets),
          spoken_languages: textToArray(form.languages),
        },
        contact: {
          contact_email: form.contactEmail.trim() || null,
          contact_phone: form.contactPhone.trim() || null,
        },
      };

      const { data: updated, error: updateError } = await supabase
        .from("companies")
        .update({ ...columns[section], updated_at: new Date().toISOString() })
        .eq("id", companyId)
        .select("id");
      if (updateError) throw updateError;
      if (!updated || updated.length === 0) {
        // RLS or ownership prevented the write — do NOT report success.
        toast.error(t("updateError"), { id: toastId });
        return;
      }

      if (section === "commerce") {
        await syncJoin(supabase, "company_tags", companyId, savedTagIds, selectedTagIds);
        await syncJoin(supabase, "company_hs_codes", companyId, savedHsCodeIds, selectedHsCodeIds);
        setSavedTagIds(selectedTagIds);
        setSavedHsCodeIds(selectedHsCodeIds);
      }

      // Only this block's fields become "saved": edits pending in another block stay flagged.
      setSaved((prev) => {
        const next = { ...prev };
        for (const key of SECTION_FIELDS[section]) next[key] = form[key];
        return next;
      });
      toast.success(t("sectionSaved"), { id: toastId });
      // The dashboard home and sidebar read the same company rows.
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error(t("updateError"), { id: toastId });
    } finally {
      setSavingSection(null);
    }
  };

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[900px] space-y-4 pt-2">
        <CardSkeleton rows={2} />
        <CardSkeleton rows={6} />
      </div>
    );
  }

  const completeness = profileCompleteness({
    logo_url: logoUrl,
    description: saved.description,
    contact_email: saved.contactEmail,
    contact_phone: saved.contactPhone,
    city: saved.city,
    website: saved.website,
    certifications: textToArray(saved.certifications),
    markets: textToArray(saved.markets),
    photoCount: content.data?.photoCountByCompany[companyId] ?? 0,
    productCount: content.data?.productCountByCompany[companyId] ?? 0,
  });
  const chip =
    "inline-flex items-center gap-1 rounded-full bg-market-cream px-2.5 py-1 text-[11.5px] font-semibold text-market-or-dark transition-colors hover:bg-market-or-light/40";
  const saveProps = (section: FormSection) => ({
    onSave: () => saveSection(section),
    saving: savingSection === section,
    dirty: sectionState(section).dirty,
  });

  return (
    <div className="mx-auto max-w-[900px] space-y-4 pt-2">
      <header>
        <Link
          href="/dashboard/companies"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-market-navy"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t("backToCompanies")}
        </Link>
        <h1 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight text-market-navy sm:text-[30px]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
      </header>

      {draftRestored && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] text-amber-900 ring-1 ring-amber-200">
          <p className="min-w-0 flex-1 basis-[240px]">{t("draft.restored")}</p>
          <button
            type="button"
            onClick={discardDraft}
            className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-200 transition-colors hover:bg-amber-100"
          >
            {t("draft.discard")}
          </button>
        </div>
      )}

      {/* Completeness: what is missing, each item one click from its block. */}
      <section aria-labelledby="completeness-title" className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200/70">
        <ProgressRing percent={completeness.percent} />
        <div className="min-w-0 flex-1 basis-[240px]">
          <h2 id="completeness-title" className="font-display text-base font-semibold text-market-navy">
            {t("completeness.title", { percent: completeness.percent })}
          </h2>
          {completeness.missing.length === 0 ? (
            <p className="text-xs font-medium text-emerald-700">{t("completeness.complete")}</p>
          ) : (
            <>
              <p className="text-xs text-slate-500">{t("completeness.lead")}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {completeness.missing.map((key) => {
                  const section = COMPLETENESS_SECTION[key];
                  return (
                    <li key={key}>
                      {section ? (
                        <a href={`#${section}`} className={chip}>
                          {tMissing(key)}
                        </a>
                      ) : (
                        <Link href="/dashboard/products/new" className={chip}>
                          {tMissing(key)}
                          <ArrowRight className="h-3 w-3" aria-hidden />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </section>

      <SectionCard
        id="presentation"
        title={t("sections.presentation.title")}
        hint={t("sections.presentation.hint")}
        filled={sectionState("presentation").filled}
        save={saveProps("presentation")}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="company-name">{t("companyName")}</Label>
            <Input id="company-name" value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>{t("sector")}</Label>
              <Select value={form.sectorId} onValueChange={(v) => set({ sectorId: v })}>
                <SelectTrigger className="w-full">
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
              <Label htmlFor="company-province">{t("province")}</Label>
              <Input id="company-province" value={form.province} onChange={(e) => set({ province: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company-city">{t("city")}</Label>
              <Input id="company-city" value={form.city} onChange={(e) => set({ city: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company-description">{t("description")}</Label>
            <Textarea
              id="company-description"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={5}
            />
            <p className={cn("text-xs", form.description.trim().length >= MIN_DESCRIPTION_LENGTH ? "text-emerald-700" : "text-slate-500")}>
              {t("descriptionCount", { count: form.description.trim().length, min: MIN_DESCRIPTION_LENGTH })}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company-website">{t("website")}</Label>
            <Input
              id="company-website"
              value={form.website}
              onChange={(e) => set({ website: e.target.value })}
              placeholder={t("websitePlaceholder")}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="commerce"
        title={t("sections.commerce.title")}
        hint={t("sections.commerce.hint")}
        filled={sectionState("commerce").filled}
        save={saveProps("commerce")}
      >
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="company-capacity">{t("productionCapacity")}</Label>
              <Input id="company-capacity" value={form.capacity} onChange={(e) => set({ capacity: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company-moq">{t("minimumOrder")}</Label>
              <Input id="company-moq" value={form.moq} onChange={(e) => set({ moq: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company-lead">{t("leadTime")}</Label>
              <Input id="company-lead" value={form.leadTime} onChange={(e) => set({ leadTime: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company-certifications">{t("certifications")}</Label>
            <Input
              id="company-certifications"
              value={form.certifications}
              onChange={(e) => set({ certifications: e.target.value })}
              placeholder={t("commaSeparatedPlaceholder")}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="company-markets">{t("exportMarkets")}</Label>
              <Input
                id="company-markets"
                value={form.markets}
                onChange={(e) => set({ markets: e.target.value })}
                placeholder={t("commaSeparatedPlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company-languages">{t("languages")}</Label>
              <Input
                id="company-languages"
                value={form.languages}
                onChange={(e) => set({ languages: e.target.value })}
                placeholder={t("commaSeparatedPlaceholder")}
              />
            </div>
          </div>

          {/* Tags and HS codes: multi-select from staff-managed reference tables. */}
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-[13px] font-semibold text-market-navy">{t("tags")}</p>
            <p className="mb-3 text-xs text-slate-500">{t("tagsHint")}</p>
            {tags.length === 0 ? (
              <p className="text-xs text-slate-500">{t("noTagsAvailable")}</p>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={selectedTagIds.includes(tag.id)}
                      onCheckedChange={() => setSelectedTagIds((prev) => toggle(prev, tag.id))}
                    />
                    <label htmlFor={`tag-${tag.id}`} className="cursor-pointer text-sm">
                      {localizedName(tag)}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-[13px] font-semibold text-market-navy">{t("hsCode")}</p>
            <p className="mb-3 text-xs text-slate-500">{t("hsCodeHint")}</p>
            {hsCodes.length === 0 ? (
              <p className="text-xs text-slate-500">{t("noHsCodesAvailable")}</p>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {hsCodes.map((hs) => (
                  <div key={hs.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`hs-${hs.id}`}
                      checked={selectedHsCodeIds.includes(hs.id)}
                      onCheckedChange={() => setSelectedHsCodeIds((prev) => toggle(prev, hs.id))}
                    />
                    <label htmlFor={`hs-${hs.id}`} className="cursor-pointer text-sm">
                      {hs.code} — {localizedName(hs)}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="contact"
        title={t("sections.contact.title")}
        hint={t("sections.contact.hint")}
        filled={sectionState("contact").filled}
        save={saveProps("contact")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="company-email">{t("contactEmail")}</Label>
            <Input
              id="company-email"
              type="email"
              value={form.contactEmail}
              onChange={(e) => set({ contactEmail: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company-phone">{t("contactPhone")}</Label>
            <Input
              id="company-phone"
              type="tel"
              value={form.contactPhone}
              onChange={(e) => set({ contactPhone: e.target.value })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard id="media" title={t("sections.media.title")} hint={t("mediaHint")}>
        <MediaManager companyId={companyId} />
      </SectionCard>

      <SectionCard id="verification" title={t("sections.verification.title")} hint={t("sections.verification.hint")}>
        <Link
          href={`/dashboard/companies/${companyId}/verification`}
          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-[13px] font-semibold text-market-navy transition-colors hover:bg-slate-200"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden />
          {t("sections.verification.cta")}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </SectionCard>
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
  selectedIds: string[]
): Promise<void> {
  const toAdd = selectedIds.filter((id) => !initialIds.includes(id));
  const toRemove = initialIds.filter((id) => !selectedIds.includes(id));

  if (table === "company_tags") {
    if (toRemove.length > 0) {
      const { error } = await supabase.from("company_tags").delete().eq("company_id", companyId).in("tag_id", toRemove);
      if (error) throw error;
    }
    if (toAdd.length > 0) {
      const { error } = await supabase.from("company_tags").insert(toAdd.map((id) => ({ company_id: companyId, tag_id: id })));
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
        .insert(toAdd.map((id) => ({ company_id: companyId, hs_code_id: id })));
      if (error) throw error;
    }
  }
}
