"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { Loader2, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import type { Database } from "@/lib/supabase/types";

// Full insert payload (incl. bilingual 00018 columns). The useCreateProduct
// hook types a narrower param, but inserts whatever object it receives at
// runtime, so we type the payload against the authoritative table Insert type.
type ProductInsertPayload = Omit<
  Database["public"]["Tables"]["products"]["Insert"],
  "id" | "created_at" | "updated_at" | "search_en" | "search_fr" | "specs" | "video_embed"
>;
type CreateProductArg = Parameters<ReturnType<typeof useCreateProduct>["mutateAsync"]>[0];

const PRODUCT_IMAGE_BUCKET = "product-images";

// Image upload constraints (enforced client-side; storage RLS enforces ownership).
const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const productSchema = z.object({
  name_en: z.string().min(2, "validation.nameMin"),
  name_fr: z.string().min(2, "validation.nameMin"),
  description_en: z.string().min(10, "validation.descriptionMin"),
  description_fr: z.string().min(10, "validation.descriptionMin"),
  category_id: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

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
}

interface CategoryOption {
  id: string;
  name_en: string;
  name_fr: string;
}

interface ProductFormProps {
  companyId: string;
  product?: ExistingProduct;
}

const NO_CATEGORY = "__none__";

export function ProductForm({ companyId, product }: ProductFormProps) {
  const t = useTranslations("Dashboard.productForm");
  const locale = useLocale();
  const router = useRouter();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [imageFiles, setImageFiles] = React.useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = React.useState<string[]>(
    Array.isArray(product?.images) ? product.images : [],
  );
  const [existingImageUrls, setExistingImageUrls] = React.useState<string[]>(
    Array.isArray(product?.images) ? product.images : [],
  );
  const [submitting, setSubmitting] = React.useState(false);

  const localizedName = React.useCallback(
    (row: { name_en: string; name_fr: string }) =>
      locale === "fr" ? row.name_fr : row.name_en,
    [locale],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: {
      // Prefer bilingual columns; fall back to legacy name/description for
      // rows created before the 00018 migration.
      name_en: product?.name_en ?? product?.name ?? "",
      name_fr: product?.name_fr ?? "",
      description_en: product?.description_en ?? product?.description ?? "",
      description_fr: product?.description_fr ?? "",
      category_id: product?.category_id ?? "",
    },
  });

  const categoryValue = watch("category_id");

  React.useEffect(() => {
    const loadCategories = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("id, name_en, name_fr")
        .order("name_en", { ascending: true });
      setCategories(data ?? []);
    };
    loadCategories();
  }, []);

  const totalImageCount = imagePreviews.length;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
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
    if (toAdd.length < accepted.length) {
      toast.error(t("maxImages", { max: MAX_IMAGES }));
    }

    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setImageFiles((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const isExisting = index < existingImageUrls.length;

    if (isExisting) {
      setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    } else {
      const newFileIndex = index - existingImageUrls.length;
      setImageFiles((prev) => prev.filter((_, i) => i !== newFileIndex));
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const supabase = createClient();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const fileName = `${companyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(fileName, file, { upsert: false });

      if (error) throw new Error(`Failed to upload ${file.name}: ${error.message}`);

      const { data: urlData } = supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .getPublicUrl(fileName);

      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  };

  const onSubmit = async (values: ProductFormValues) => {
    const validation = productSchema.safeParse(values);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      const messageKey = firstError?.message ?? "validation.failed";
      toast.error(t(messageKey as Parameters<typeof t>[0]));
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading(product ? t("updating") : t("creating"));

    try {
      const newImageUrls = imageFiles.length > 0 ? await uploadImages(imageFiles) : [];
      const allImageUrls = [...existingImageUrls, ...newImageUrls];

      const nameEn = values.name_en.trim();
      const descriptionEn = values.description_en.trim();

      // Keep legacy name/description in sync (name = name_en) so existing
      // single-language reads continue to work.
      const payload: Omit<ProductInsertPayload, "company_id"> = {
        name: nameEn,
        name_en: nameEn,
        name_fr: values.name_fr.trim(),
        description: descriptionEn,
        description_en: descriptionEn,
        description_fr: values.description_fr.trim(),
        category_id: values.category_id || null,
        images: allImageUrls,
      };

      if (product) {
        await updateProduct.mutateAsync({ id: product.id, data: payload });
        toast.success(t("updateSuccess"), { id: toastId });
      } else {
        // Cast to the hook's narrower param type — the extra bilingual keys are
        // still persisted because the hook inserts the object verbatim.
        await createProduct.mutateAsync({
          company_id: companyId,
          ...payload,
        } as CreateProductArg);
        toast.success(t("createSuccess"), { id: toastId });
      }

      router.push("/dashboard/products");
    } catch (err) {
      const message = err instanceof Error ? err.message : t("genericError");
      toast.error(message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name_en" className="text-sm font-medium text-slate-700">
            {t("nameEnLabel")} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name_en"
            placeholder={t("nameEnPlaceholder")}
            className="text-sm h-8"
            {...register("name_en")}
          />
          {errors.name_en?.message && (
            <p className="text-xs text-red-500">
              {t(errors.name_en.message as Parameters<typeof t>[0])}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name_fr" className="text-sm font-medium text-slate-700">
            {t("nameFrLabel")} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name_fr"
            placeholder={t("nameFrPlaceholder")}
            className="text-sm h-8"
            {...register("name_fr")}
          />
          {errors.name_fr?.message && (
            <p className="text-xs text-red-500">
              {t(errors.name_fr.message as Parameters<typeof t>[0])}
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="description_en" className="text-sm font-medium text-slate-700">
            {t("descriptionEnLabel")} <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description_en"
            placeholder={t("descriptionEnPlaceholder")}
            rows={4}
            className="text-sm resize-none"
            {...register("description_en")}
          />
          {errors.description_en?.message && (
            <p className="text-xs text-red-500">
              {t(errors.description_en.message as Parameters<typeof t>[0])}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description_fr" className="text-sm font-medium text-slate-700">
            {t("descriptionFrLabel")} <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description_fr"
            placeholder={t("descriptionFrPlaceholder")}
            rows={4}
            className="text-sm resize-none"
            {...register("description_fr")}
          />
          {errors.description_fr?.message && (
            <p className="text-xs text-red-500">
              {t(errors.description_fr.message as Parameters<typeof t>[0])}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">
          {t("categoryLabel")}{" "}
          <span className="text-slate-400 font-normal">{t("optional")}</span>
        </Label>
        <Select
          value={categoryValue ? categoryValue : NO_CATEGORY}
          onValueChange={(v) => setValue("category_id", v === NO_CATEGORY ? "" : v)}
        >
          <SelectTrigger className="h-8 text-sm md:w-1/2">
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

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">{t("imagesLabel")}</Label>

        {imagePreviews.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative group">
                <img
                  src={src}
                  alt={t("imageAlt", { index: i + 1 })}
                  className="w-20 h-20 object-cover rounded border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={t("removeImage")}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {totalImageCount < MAX_IMAGES && (
          <label className="flex items-center gap-2 w-fit cursor-pointer border border-dashed border-slate-300 rounded px-3 py-2 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-600 transition-colors">
            <ImagePlus className="w-4 h-4" />
            {t("addImages")}
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />
          </label>
        )}
        <p className="text-xs text-slate-400">
          {t("imagesHint", { max: MAX_IMAGES, size: MAX_IMAGE_BYTES / (1024 * 1024) })}
        </p>
      </div>

      <div className="pt-2 flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          {product ? t("saveChanges") : t("createProduct")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/products")}
          disabled={submitting}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
