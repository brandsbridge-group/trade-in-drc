"use client";

import * as React from "react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, Check, Clock, ImagePlus, Lightbulb, Loader2, Package, ShieldAlert, ShieldCheck, UploadCloud, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import { COMPANY_STATUS } from "@/constants/status";
import {
  DESCRIPTION_MAX,
  NAME_MAX,
  PRODUCT_LANGS,
  isLangComplete,
  resolveProductTexts,
  type ProductLang,
  type ProductTexts,
} from "@/lib/dashboard/product-texts";
import {
  buildSpecs,
  rebaseSpecs,
  specEntries,
  splitSpecs,
  toSpecFields,
  type CustomSpec,
  type SpecField,
  type TemplateValues,
} from "@/lib/products/specs";
import { applyDraft, changedFields, readLocalDraft, writeLocalDraft } from "@/lib/drafts/local-draft";
import {
  isEmptySpecs,
  parseDraftSpecs,
  productDraftKey,
  restoreDraftSpecs,
  type ProductDraft,
  type ProductDraftFields,
} from "@/lib/dashboard/product-draft";
import {
  DEFAULT_CURRENCY,
  PRICE_CURRENCIES,
  SALE_UNITS,
  buildPricing,
  isCurrency,
  pricingDisplay,
  pricingOf,
  pricingToForm,
  unitLabel,
  type PriceCurrency,
  type PricingField,
  type PricingForm,
} from "@/lib/products/pricing";
import { ProductSpecsEditor, type SpecErrors } from "./product-specs-editor";
import type { Database, Json } from "@/lib/supabase/types";

// Full insert payload (incl. bilingual 00018 columns). The useCreateProduct
// hook types a narrower param, but inserts whatever object it receives at
// runtime, so we type the payload against the authoritative table Insert type.
type ProductInsertPayload = Omit<
  Database["public"]["Tables"]["products"]["Insert"],
  "id" | "created_at" | "updated_at" | "search_en" | "search_fr" | "video_embed"
>;
type CreateProductArg = Parameters<ReturnType<typeof useCreateProduct>["mutateAsync"]>[0];

const PRODUCT_IMAGE_BUCKET = "product-images";

// Image upload constraints (enforced client-side; storage RLS enforces ownership).
const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface ExistingProduct {
  id: string;
  company_id: string;
  name: string;
  name_en: string | null;
  name_fr: string | null;
  description: string | null;
  description_en: string | null;
  description_fr: string | null;
  category_id: string | null;
  images: string[] | null;
  /** Flat `{ key: value }` characteristics (see src/lib/products/specs.ts). */
  specs?: unknown;
  /** Price and minimum order (00064, see src/lib/products/pricing.ts). */
  price?: number | string | null;
  price_currency?: string | null;
  sale_unit?: string | null;
  min_order_quantity?: number | string | null;
}

interface CategoryOption {
  id: string;
  name_en: string;
  name_fr: string;
}

interface ProductFormProps {
  companyId: string;
  /** The selling company: its name shows in the preview, its status decides whether the product is public. */
  company?: { name: string; status: string };
  product?: ExistingProduct;
}

const NO_CATEGORY = "__none__";
const NO_UNIT = "__none__";

const FIELD =
  "w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-market-navy";
const CARD = "rounded-2xl bg-white p-5 ring-1 ring-slate-200/70";

/** Where the selling company stands, as far as product visibility goes. */
type Visibility = "verified" | "pending" | "rejected" | "pending_documents";

function visibilityOf(status: string | undefined): Visibility {
  if (status === COMPANY_STATUS.VERIFIED) return "verified";
  if (status === COMPANY_STATUS.PENDING) return "pending";
  if (status === COMPANY_STATUS.REJECTED) return "rejected";
  return "pending_documents";
}

/** The stored product as the text inputs hold it — what a draft is compared against. */
function savedFieldsOf(product: ExistingProduct | undefined): ProductDraftFields {
  const pricing = pricingToForm(pricingOf(product));
  return {
    // Prefer bilingual columns; fall back to legacy name/description for
    // rows created before the 00018 migration.
    name_en: product?.name_en ?? product?.name ?? "",
    name_fr: product?.name_fr ?? "",
    description_en: product?.description_en ?? product?.description ?? "",
    description_fr: product?.description_fr ?? "",
    categoryId: product?.category_id ?? "",
    price: pricing.price,
    currency: pricing.currency,
    unit: pricing.unit,
    minOrder: pricing.minOrder,
  };
}

const textsOf = (fields: ProductDraftFields): ProductTexts => ({
  name_en: fields.name_en,
  name_fr: fields.name_fr,
  description_en: fields.description_en,
  description_fr: fields.description_fr,
});

const pricingFormOf = (fields: ProductDraftFields): PricingForm => ({
  price: fields.price,
  currency: isCurrency(fields.currency) ? fields.currency : DEFAULT_CURRENCY,
  unit: fields.unit,
  minOrder: fields.minOrder,
});

const VISIBILITY_TONE: Record<Visibility, { card: string; icon: string; Icon: typeof Check }> = {
  verified: { card: "bg-emerald-50 ring-emerald-100", icon: "text-emerald-700", Icon: ShieldCheck },
  pending: { card: "bg-blue-50 ring-blue-100", icon: "text-blue-700", Icon: Clock },
  rejected: { card: "bg-red-50 ring-red-100", icon: "text-red-700", Icon: ShieldAlert },
  pending_documents: { card: "bg-market-cream ring-market-or/30", icon: "text-market-or-dark", Icon: ShieldAlert },
};

/**
 * Product editor (create and edit): texts per language, category, photos,
 * with a live preview and the publication rule on the side. A product is
 * always saved; it is PUBLIC only once its company is verified — that is the
 * database's rule (`products_public_read_verified_company`), stated here so
 * the owner is never surprised by a product that does not show up.
 */
export function ProductForm({ companyId, company, product }: ProductFormProps) {
  const t = useTranslations("Dashboard.productForm");
  const tPricing = useTranslations("ProductPricing");
  const locale = useLocale();
  const router = useRouter();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  // Unsaved edits are kept in this browser (see product-draft.ts): a reload, a
  // closed tab or a page error loses nothing but the photos. The draft is read
  // while the state is created, not in an effect, so the category's template
  // is loaded once, for the restored category. That is safe here: this form
  // only mounts in the browser, once the company (or the product) is loaded.
  const draftKey = productDraftKey(companyId, product?.id);
  const saved = React.useMemo(() => savedFieldsOf(product), [product]);
  const [initial] = React.useState(() => {
    const draft = readLocalDraft<ProductDraft>(draftKey);
    const fields = applyDraft(saved, draft?.fields);
    const specs = parseDraftSpecs(draft?.specs);
    return { fields, specs, restored: changedFields(fields, saved) !== null || specs !== null };
  });
  const [draftRestored, setDraftRestored] = React.useState(initial.restored);
  // Set once the product is saved: the draft is removed and must not be written again.
  const draftClosed = React.useRef(false);

  const [texts, setTexts] = React.useState<ProductTexts>(() => textsOf(initial.fields));
  const [lang, setLang] = React.useState<ProductLang>(locale === "fr" ? "fr" : "en");
  const [categoryId, setCategoryId] = React.useState(initial.fields.categoryId);
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [imageFiles, setImageFiles] = React.useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = React.useState<string[]>(
    Array.isArray(product?.images) ? product.images : []
  );
  const [existingImageUrls, setExistingImageUrls] = React.useState<string[]>(
    Array.isArray(product?.images) ? product.images : []
  );
  const [errors, setErrors] = React.useState<Set<"name" | "description">>(new Set());
  // Price and minimum order, as typed; both optional (empty = "price on request").
  const [pricing, setPricing] = React.useState<PricingForm>(() => pricingFormOf(initial.fields));
  const [pricingErrors, setPricingErrors] = React.useState<Set<PricingField>>(new Set());
  const setPricingField = <K extends keyof PricingForm>(key: K, value: PricingForm[K]) => {
    setPricing((prev) => ({ ...prev, [key]: value }));
    setPricingErrors((prev) => (prev.size === 0 ? prev : new Set()));
  };
  // Characteristics: the category's template (loaded per category) + free lines.
  const [specFields, setSpecFields] = React.useState<SpecField[]>([]);
  const [specValues, setSpecValues] = React.useState<TemplateValues>({});
  const [customSpecs, setCustomSpecs] = React.useState<CustomSpec[]>([]);
  const [specErrors, setSpecErrors] = React.useState<SpecErrors>({ fields: new Set(), rows: new Set() });
  // The stored specs are split against the template once, on the first load;
  // later category changes carry over what is currently typed instead.
  const specsInitialized = React.useRef(false);
  // A draft's characteristics replace the stored ones on that first load.
  const pendingDraftSpecs = React.useRef(initial.specs);
  // The draft keeps the characteristics only once the seller has touched them.
  const [specsTouched, setSpecsTouched] = React.useState(initial.specs !== null);
  const [specsReady, setSpecsReady] = React.useState(false);
  const specState = React.useRef({ fields: specFields, values: specValues, custom: customSpecs });
  React.useEffect(() => {
    specState.current = { fields: specFields, values: specValues, custom: customSpecs };
  }, [specFields, specValues, customSpecs]);
  const [dragOver, setDragOver] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);

  const localizedName = React.useCallback(
    (row: { name_en: string; name_fr: string }) => (locale === "fr" ? row.name_fr : row.name_en),
    [locale]
  );

  React.useEffect(() => {
    const loadCategories = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("categories").select("id, name_en, name_fr").order("name_en", { ascending: true });
      setCategories(data ?? []);
    };
    loadCategories();
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const loadTemplate = async () => {
      let nextFields: SpecField[] = [];
      if (categoryId) {
        const { data } = await createClient()
          .from("category_spec_fields")
          .select("key, label_en, label_fr, field_type, unit, options, required, sort_order")
          .eq("category_id", categoryId)
          .order("sort_order", { ascending: true });
        nextFields = toSpecFields(data);
      }
      if (cancelled) return;
      const current = specState.current;
      const next = specsInitialized.current
        ? rebaseSpecs({ previousFields: current.fields, nextFields, values: current.values, custom: current.custom, locale })
        : pendingDraftSpecs.current
          ? restoreDraftSpecs(pendingDraftSpecs.current, nextFields)
          : splitSpecs(product?.specs, nextFields);
      pendingDraftSpecs.current = null;
      specsInitialized.current = true;
      setSpecFields(nextFields);
      setSpecValues(next.values);
      setCustomSpecs(next.custom);
      setSpecErrors({ fields: new Set(), rows: new Set() });
      setSpecsReady(true);
    };
    loadTemplate();
    return () => {
      cancelled = true;
    };
    // The stored specs are read once; `locale` only names moved lines.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  // Write the draft as the seller types. Not before the characteristics are in
  // place: until then the list is empty and would wipe the ones the draft holds.
  React.useEffect(() => {
    if (!specsReady || draftClosed.current) return;
    const fields = changedFields<ProductDraftFields>(
      { ...texts, categoryId, price: pricing.price, currency: pricing.currency, unit: pricing.unit, minOrder: pricing.minOrder },
      saved
    );
    const typedSpecs = { values: specValues, custom: customSpecs };
    // A product not created yet has no stored characteristics: an empty list is not a change.
    const specs = specsTouched && (product || !isEmptySpecs(typedSpecs)) ? typedSpecs : null;
    const draft: ProductDraft | null = fields || specs ? { ...(fields ? { fields } : {}), ...(specs ? { specs } : {}) } : null;
    writeLocalDraft(draftKey, draft);
  }, [draftKey, saved, product, specsReady, texts, categoryId, pricing, specsTouched, specValues, customSpecs]);

  /** Back to the stored product (an empty form for a new one); the effect above then removes the draft. */
  const discardDraft = () => {
    setTexts(textsOf(saved));
    setPricing(pricingFormOf(saved));
    setErrors(new Set());
    setPricingErrors(new Set());
    setSpecsTouched(false);
    if (categoryId === saved.categoryId) {
      const stored = splitSpecs(product?.specs, specFields);
      setSpecValues(stored.values);
      setCustomSpecs(stored.custom);
      setSpecErrors({ fields: new Set(), rows: new Set() });
    } else {
      // The template effect reads the stored characteristics again, for the stored category.
      specsInitialized.current = false;
      setCategoryId(saved.categoryId);
    }
    setDraftRestored(false);
  };

  const setText =(key: keyof ProductTexts, value: string) => {
    setTexts((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const field = key.startsWith("name") ? "name" : "description";
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  };

  const totalImageCount = imagePreviews.length;

  const addFiles = (files: File[]) => {
    if (files.length === 0) return;

    const accepted: File[] = [];
    for (const file of files) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error(t("invalidType", { name: file.name }));
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(t("fileTooLarge", { name: file.name, max: MAX_IMAGE_BYTES / (1024 * 1024) }));
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;

    const remainingSlots = MAX_IMAGES - totalImageCount;
    if (remainingSlots <= 0) {
      toast.error(t("maxImages", { max: MAX_IMAGES }));
      return;
    }
    const toAdd = accepted.slice(0, remainingSlots);
    if (toAdd.length < accepted.length) toast.error(t("maxImages", { max: MAX_IMAGES }));

    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setImageFiles((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const isExisting = index < existingImageUrls.length;
    if (isExisting) {
      setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
    } else {
      const newFileIndex = index - existingImageUrls.length;
      setImageFiles((prev) => prev.filter((_, i) => i !== newFileIndex));
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const supabase = createClient();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const fileName = `${companyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(fileName, file, { upsert: false });
      if (error) throw new Error(`Failed to upload ${file.name}: ${error.message}`);

      const { data: urlData } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(fileName);
      uploadedUrls.push(urlData.publicUrl);
    }
    return uploadedUrls;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const resolved = resolveProductTexts(texts);
    if (!resolved.ok) {
      setErrors(new Set(resolved.errors));
      toast.error(t(resolved.errors[0] === "name" ? "validation.nameMin" : "validation.descriptionMin"));
      return;
    }

    const builtPricing = buildPricing(pricing);
    if (!builtPricing.ok) {
      setPricingErrors(new Set(builtPricing.errors));
      toast.error(t(`pricing.errors.${builtPricing.errors[0]}`));
      document.getElementById("product-pricing")?.scrollIntoView({ block: "center" });
      return;
    }

    const built = buildSpecs({ fields: specFields, values: specValues, custom: customSpecs });
    if (!built.ok) {
      setSpecErrors({
        fields: new Set([...built.missing, ...built.invalidNumbers]),
        rows: new Set([...built.incompleteRows, ...built.duplicates]),
      });
      toast.error(t(built.tooMany ? "specs.errors.tooMany" : "specs.errors.toast"));
      document.getElementById("product-specs")?.scrollIntoView({ block: "center" });
      return;
    }
    setSpecErrors({ fields: new Set(), rows: new Set() });

    setSubmitting(true);
    const toastId = toast.loading(product ? t("updating") : t("creating"));

    try {
      const newImageUrls = imageFiles.length > 0 ? await uploadImages(imageFiles) : [];
      const allImageUrls = [...existingImageUrls, ...newImageUrls];

      // Keep legacy name/description in sync (name = name_en) so existing
      // single-language reads continue to work.
      const payload: Omit<ProductInsertPayload, "company_id"> = {
        name: resolved.texts.name_en,
        name_en: resolved.texts.name_en,
        name_fr: resolved.texts.name_fr,
        description: resolved.texts.description_en,
        description_en: resolved.texts.description_en,
        description_fr: resolved.texts.description_fr,
        category_id: categoryId || null,
        specs: built.specs as Json,
        images: allImageUrls,
        ...builtPricing.pricing,
      };

      if (product) {
        await updateProduct.mutateAsync({ id: product.id, data: payload });
        toast.success(t("updateSuccess"), { id: toastId });
      } else {
        // Cast to the hook's narrower param type — the extra bilingual keys are
        // still persisted because the hook inserts the object verbatim.
        await createProduct.mutateAsync({ company_id: companyId, ...payload } as CreateProductArg);
        toast.success(t("createSuccess"), { id: toastId });
      }

      // Saved: nothing is left to restore.
      draftClosed.current = true;
      writeLocalDraft(draftKey, null);
      router.push("/dashboard/products");
    } catch (err) {
      const message = err instanceof Error ? err.message : t("genericError");
      toast.error(message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const nameKey = `name_${lang}` as const;
  const descriptionKey = `description_${lang}` as const;
  const otherLang: ProductLang = lang === "fr" ? "en" : "fr";
  const visibility = visibilityOf(company?.status);
  const tone = VISIBILITY_TONE[visibility];

  // Preview: what a visitor sees in the current language, with the same fallback as the save.
  const previewName = texts[nameKey].trim() || texts[`name_${otherLang}`].trim();
  const previewDescription = texts[descriptionKey].trim() || texts[`description_${otherLang}`].trim();
  const previewCategory = categories.find((c) => c.id === categoryId);
  // Price line exactly as the marketplace prints it; nothing while what is typed is not valid yet.
  const previewPricing = (() => {
    const draft = buildPricing(pricing);
    return draft.ok ? pricingDisplay(draft.pricing, tPricing, locale) : null;
  })();
  const hasPreviewPricing = !!previewPricing && (!!previewPricing.price || !!previewPricing.minOrder);
  // Same reader as the public page, on what is typed so far (invalid lines simply don't show).
  const previewSpecs = (() => {
    const draft: Record<string, string> = {};
    for (const field of specFields) if ((specValues[field.key] ?? "").trim()) draft[field.key] = specValues[field.key];
    for (const row of customSpecs) if (row.label.trim() && row.value.trim()) draft[row.label.trim()] = row.value.trim();
    return specEntries(draft, { fields: specFields, locale, yes: t("specs.yes"), no: t("specs.no") }).slice(0, 4);
  })();

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="min-w-0 space-y-4 xl:col-span-8">
        {draftRestored && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900 ring-1 ring-amber-200">
            <p className="min-w-0 flex-1 basis-[240px]">{t("draft.restored")}</p>
            <button
              type="button"
              onClick={discardDraft}
              className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-200 transition-colors hover:bg-amber-100"
            >
              {t("draft.discard")}
            </button>
          </div>
        )}

        <section aria-labelledby="product-info" className={CARD}>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="product-info" className="font-display text-base font-semibold text-market-navy">{t("sections.info.title")}</h2>
              <p className="text-xs text-slate-500">{t("sections.info.hint")}</p>
            </div>
            {/* One language at a time instead of four fields side by side. */}
            <div role="tablist" aria-label={t("lang.label")} className="inline-flex shrink-0 rounded-full bg-slate-100 p-1">
              {PRODUCT_LANGS.map((code) => {
                const active = code === lang;
                const complete = isLangComplete(texts, code);
                return (
                  <button
                    key={code}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setLang(code)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                      active ? "bg-market-navy text-white" : "text-slate-600 hover:text-market-navy"
                    )}
                  >
                    {t(`lang.${code}`)}
                    <span
                      className={cn("h-1.5 w-1.5 rounded-full", complete ? "bg-emerald-400" : active ? "bg-white/40" : "bg-slate-300")}
                      aria-hidden
                    />
                    <span className="sr-only">{t(complete ? "lang.complete" : "lang.incomplete")}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label htmlFor="product-name" className="text-xs font-semibold text-slate-700">
                  {t("nameLabel")} <span className="text-market-red">*</span>
                </label>
                <span className="text-[11px] tabular-nums text-slate-400">{texts[nameKey].length}/{NAME_MAX}</span>
              </div>
              <input
                id="product-name"
                value={texts[nameKey]}
                maxLength={NAME_MAX}
                onChange={(e) => setText(nameKey, e.target.value)}
                placeholder={t("namePlaceholder")}
                aria-invalid={errors.has("name")}
                className={cn(FIELD, "h-10", errors.has("name") && "border-market-red")}
              />
              {errors.has("name") && <p className="mt-1 text-xs text-market-red">{t("validation.nameMin")}</p>}
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label htmlFor="product-description" className="text-xs font-semibold text-slate-700">
                  {t("descriptionLabel")} <span className="text-market-red">*</span>
                </label>
                <span className="text-[11px] tabular-nums text-slate-400">{texts[descriptionKey].length}/{DESCRIPTION_MAX}</span>
              </div>
              <textarea
                id="product-description"
                value={texts[descriptionKey]}
                maxLength={DESCRIPTION_MAX}
                rows={6}
                onChange={(e) => setText(descriptionKey, e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                aria-invalid={errors.has("description")}
                className={cn(FIELD, "resize-y py-2", errors.has("description") && "border-market-red")}
              />
              {errors.has("description") && <p className="mt-1 text-xs text-market-red">{t("validation.descriptionMin")}</p>}
            </div>

            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">{t("lang.hint")}</p>

            <div className="sm:max-w-sm">
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                {t("categoryLabel")} <span className="font-normal text-slate-400">{t("optional")}</span>
              </label>
              <Select value={categoryId || NO_CATEGORY} onValueChange={(v) => setCategoryId(v === NO_CATEGORY ? "" : v)}>
                <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 text-sm">
                  <SelectValue placeholder={t("categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY} className="text-sm">
                    {t("categoryNone")}
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id} className="text-sm">
                      {localizedName(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section aria-labelledby="product-pricing" className={CARD}>
          <div className="mb-4">
            <h2 id="product-pricing" className="font-display text-base font-semibold text-market-navy">
              {t("pricing.title")} <span className="text-sm font-normal text-slate-400">{t("optional")}</span>
            </h2>
            <p className="text-xs text-slate-500">{t("pricing.hint")}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">{t("pricing.unitLabel")}</label>
              <Select value={pricing.unit || NO_UNIT} onValueChange={(v) => setPricingField("unit", v === NO_UNIT ? "" : v)}>
                <SelectTrigger
                  aria-invalid={pricingErrors.has("unit")}
                  className={cn("h-10 w-full rounded-xl border-slate-200 text-sm", pricingErrors.has("unit") && "border-market-red")}
                >
                  <SelectValue placeholder={t("pricing.unitPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_UNIT} className="text-sm">
                    {t("pricing.unitNone")}
                  </SelectItem>
                  {SALE_UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit} className="text-sm">
                      {unitLabel(tPricing, unit)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {pricingErrors.has("unit") && <p className="mt-1 text-xs text-market-red">{t("pricing.errors.unit")}</p>}
            </div>

            <div>
              <label htmlFor="product-price" className="mb-1 block text-xs font-semibold text-slate-700">
                {pricing.unit ? t("pricing.priceLabelPer", { unit: unitLabel(tPricing, pricing.unit) }) : t("pricing.priceLabel")}
              </label>
              <div className="flex gap-2">
                <input
                  id="product-price"
                  inputMode="decimal"
                  value={pricing.price}
                  onChange={(e) => setPricingField("price", e.target.value)}
                  placeholder={t("pricing.pricePlaceholder")}
                  aria-invalid={pricingErrors.has("price")}
                  className={cn(FIELD, "h-10 min-w-0 flex-1 tabular-nums", pricingErrors.has("price") && "border-market-red")}
                />
                <Select value={pricing.currency} onValueChange={(v) => setPricingField("currency", v as PriceCurrency)}>
                  <SelectTrigger aria-label={t("pricing.currencyLabel")} className="h-10 w-[88px] shrink-0 rounded-xl border-slate-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_CURRENCIES.map((code) => (
                      <SelectItem key={code} value={code} className="text-sm">
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {pricingErrors.has("price") && <p className="mt-1 text-xs text-market-red">{t("pricing.errors.price")}</p>}
            </div>

            <div>
              <label htmlFor="product-min-order" className="mb-1 block text-xs font-semibold text-slate-700">
                {t("pricing.minOrderLabel")}
              </label>
              <div className="relative">
                <input
                  id="product-min-order"
                  inputMode="decimal"
                  value={pricing.minOrder}
                  onChange={(e) => setPricingField("minOrder", e.target.value)}
                  placeholder={t("pricing.minOrderPlaceholder")}
                  aria-invalid={pricingErrors.has("minOrder")}
                  className={cn(FIELD, "h-10 tabular-nums", pricing.unit && "pr-24", pricingErrors.has("minOrder") && "border-market-red")}
                />
                {pricing.unit && (
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex max-w-[5.5rem] items-center truncate text-xs text-slate-500">
                    {unitLabel(tPricing, pricing.unit)}
                  </span>
                )}
              </div>
              {pricingErrors.has("minOrder") && <p className="mt-1 text-xs text-market-red">{t("pricing.errors.minOrder")}</p>}
            </div>
          </div>

          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">{t("pricing.empty")}</p>
        </section>

        <section aria-labelledby="product-specs" className={CARD}>
          <div className="mb-4">
            <h2 id="product-specs" className="font-display text-base font-semibold text-market-navy">{t("specs.title")}</h2>
            <p className="text-xs text-slate-500">{t("specs.hint")}</p>
          </div>
          <ProductSpecsEditor
            fields={specFields}
            values={specValues}
            custom={customSpecs}
            onValuesChange={(values) => {
              setSpecValues(values);
              setSpecsTouched(true);
            }}
            onCustomChange={(custom) => {
              setCustomSpecs(custom);
              setSpecsTouched(true);
            }}
            errors={specErrors}
            locale={locale}
            hasCategory={!!categoryId}
          />
        </section>

        <section aria-labelledby="product-photos" className={CARD}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0">
              <h2 id="product-photos" className="font-display text-base font-semibold text-market-navy">{t("photos.title")}</h2>
              <p className="text-xs text-slate-500">{t("photos.hint", { size: MAX_IMAGE_BYTES / (1024 * 1024) })}</p>
            </div>
            <span className="text-xs font-medium tabular-nums text-slate-500">{totalImageCount}/{MAX_IMAGES}</span>
          </div>

          {imagePreviews.length > 0 && (
            <ul className="mb-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {imagePreviews.map((src, i) => (
                <li key={src} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/70">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob previews and owner uploads */}
                  <img src={src} alt={t("imageAlt", { index: i + 1 })} className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-market-navy px-2 py-0.5 text-[10.5px] font-semibold text-white">
                      {t("photos.cover")}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    aria-label={t("removeImage")}
                    className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-slate-600 transition-colors hover:bg-white hover:text-market-red"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {totalImageCount < MAX_IMAGES && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInput.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInput.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addFiles(Array.from(e.dataTransfer.files ?? []));
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors",
                dragOver ? "border-market-navy bg-slate-50" : "border-slate-300 hover:border-market-navy"
              )}
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-market-navy" aria-hidden>
                {imagePreviews.length > 0 ? <ImagePlus className="h-[18px] w-[18px]" /> : <UploadCloud className="h-[18px] w-[18px]" />}
              </span>
              <p className="text-[13px] font-semibold text-market-navy">{t("photos.drop")}</p>
              <p className="text-xs text-slate-500">{t("photos.formats")}</p>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
            </div>
          )}
          <p className="mt-2 text-xs text-slate-400">{t("imagesHint")}</p>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard/products")}
            disabled={submitting}
            className="inline-flex h-11 items-center rounded-full bg-slate-200/70 px-5 text-[13px] font-semibold text-market-navy transition-colors hover:bg-slate-200 disabled:opacity-60"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-market-navy px-6 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
            {product ? t("saveChanges") : t("createProduct")}
          </button>
        </div>
      </div>

      <aside className="flex min-w-0 flex-col gap-4 xl:col-span-4">
        {/* Publication rule: saved always, public once the company is verified. */}
        {company && (
          <section aria-labelledby="product-visibility" className={cn("rounded-2xl p-4 ring-1", tone.card)}>
            <div className="flex items-start gap-3">
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white", tone.icon)} aria-hidden>
                <tone.Icon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <h2 id="product-visibility" className="text-[13px] font-semibold text-market-navy">{t(`visibility.${visibility}.title`)}</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{t(`visibility.${visibility}.body`, { company: company.name })}</p>
                {(visibility === "pending_documents" || visibility === "rejected") && (
                  <Link
                    href={`/dashboard/companies/${companyId}/verification`}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-market-navy px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-market-navy-deep"
                  >
                    {t("visibility.cta")}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        <section aria-labelledby="product-preview" className={CARD}>
          <h2 id="product-preview" className="font-display text-base font-semibold text-market-navy">{t("preview.title")}</h2>
          <p className="mb-3 text-xs text-slate-500">{t("preview.hint")}</p>
          <div className="overflow-hidden rounded-xl ring-1 ring-slate-200/70">
            <div className="grid aspect-[4/3] place-items-center bg-slate-100">
              {imagePreviews[0] ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img src={imagePreviews[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                <Package className="h-8 w-8 text-slate-300" aria-hidden />
              )}
            </div>
            <div className="p-3.5">
              {previewCategory && (
                <span className="mb-1.5 inline-flex rounded-full bg-market-cream px-2 py-0.5 text-[10.5px] font-semibold text-market-or-dark">
                  {localizedName(previewCategory)}
                </span>
              )}
              <p className={cn("truncate text-sm font-semibold", previewName ? "text-market-navy" : "text-slate-400")}>
                {previewName || t("preview.namePlaceholder")}
              </p>
              {hasPreviewPricing && previewPricing && (
                <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-[11.5px] text-slate-500">
                  {previewPricing.price && (
                    <span>
                      <span className="text-sm font-semibold tabular-nums text-market-navy">{previewPricing.price}</span>{" "}
                      {tPricing("perUnit", { unit: previewPricing.unit ?? "" })}
                    </span>
                  )}
                  {previewPricing.price && previewPricing.minOrder && <span aria-hidden>·</span>}
                  {previewPricing.minOrder && <span>{tPricing("minShort", { quantity: previewPricing.minOrder })}</span>}
                </p>
              )}
              <p className={cn("mt-0.5 line-clamp-2 text-xs leading-relaxed", previewDescription ? "text-slate-600" : "text-slate-400")}>
                {previewDescription || t("preview.descriptionPlaceholder")}
              </p>
              {previewSpecs.length > 0 && (
                <dl className="mt-2.5 space-y-1 border-t border-slate-100 pt-2.5">
                  {previewSpecs.map((entry) => (
                    <div key={entry.label} className="flex items-baseline justify-between gap-3 text-[11.5px]">
                      <dt className="min-w-0 truncate text-slate-500">{entry.label}</dt>
                      <dd className="min-w-0 truncate font-semibold text-market-navy">{entry.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {company && <p className="mt-2 truncate text-[11.5px] font-medium text-slate-500">{company.name}</p>}
            </div>
          </div>
        </section>

        <section aria-labelledby="product-tips" className={CARD}>
          <h2 id="product-tips" className="flex items-center gap-2 font-display text-base font-semibold text-market-navy">
            <Lightbulb className="h-4 w-4 text-market-or-dark" aria-hidden />
            {t("tips.title")}
          </h2>
          <ul className="mt-2.5 space-y-2">
            {(["name", "description", "photos"] as const).map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                {t(`tips.${tip}`)}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </form>
  );
}
