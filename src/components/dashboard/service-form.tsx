"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
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
import {
  useCreateService,
  useUpdateService,
  type CreateServiceInput,
  type UpdateServiceInput,
} from "@/hooks/use-services";
import type {
  ServiceType,
  ServiceDeliveryMode,
  ServiceStatus,
} from "@/lib/supabase/types";

const SERVICE_TYPES: ServiceType[] = [
  "consulting",
  "logistics",
  "finance",
  "legal",
  "custom",
  "other",
];
const DELIVERY_MODES: ServiceDeliveryMode[] = [
  "on_request",
  "subscription",
  "one_off",
  "retainer",
];
const STATUSES: ServiceStatus[] = ["active", "paused", "archived"];

const serviceSchema = z.object({
  name_en: z.string().min(2, "validation.nameMin"),
  name_fr: z.string().min(2, "validation.nameMin"),
  description_en: z.string().optional(),
  description_fr: z.string().optional(),
  category_id: z.string().optional(),
  service_type: z.enum([
    "consulting",
    "logistics",
    "finance",
    "legal",
    "custom",
    "other",
  ]),
  delivery_mode: z.enum(["on_request", "subscription", "one_off", "retainer"]),
  price_indication_en: z.string().optional(),
  price_indication_fr: z.string().optional(),
  status: z.enum(["active", "paused", "archived"]),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface CategoryOption {
  id: string;
  name_en: string;
  name_fr: string;
}

export interface ExistingService {
  id: string;
  company_id: string;
  name_en: string;
  name_fr: string;
  description_en: string | null;
  description_fr: string | null;
  category_id: string | null;
  service_type: ServiceType;
  delivery_mode: ServiceDeliveryMode;
  price_indication_en: string | null;
  price_indication_fr: string | null;
  status: ServiceStatus;
}

interface ServiceFormProps {
  companyId: string;
  service?: ExistingService;
}

const NO_CATEGORY = "__none__";

export function ServiceForm({ companyId, service }: ServiceFormProps) {
  const t = useTranslations("Dashboard.serviceForm");
  const locale = useLocale();
  const router = useRouter();
  const createService = useCreateService();
  const updateService = useUpdateService();

  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
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
  } = useForm<ServiceFormValues>({
    defaultValues: {
      name_en: service?.name_en ?? "",
      name_fr: service?.name_fr ?? "",
      description_en: service?.description_en ?? "",
      description_fr: service?.description_fr ?? "",
      category_id: service?.category_id ?? "",
      service_type: service?.service_type ?? "consulting",
      delivery_mode: service?.delivery_mode ?? "on_request",
      price_indication_en: service?.price_indication_en ?? "",
      price_indication_fr: service?.price_indication_fr ?? "",
      status: service?.status ?? "active",
    },
  });

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

  const serviceTypeValue = watch("service_type");
  const deliveryModeValue = watch("delivery_mode");
  const statusValue = watch("status");
  const categoryValue = watch("category_id");

  const onSubmit = async (values: ServiceFormValues) => {
    const validation = serviceSchema.safeParse(values);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      const messageKey = firstError?.message ?? "validation.failed";
      toast.error(t(messageKey as Parameters<typeof t>[0]));
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading(service ? t("updating") : t("creating"));

    try {
      const sharedPayload = {
        name_en: values.name_en.trim(),
        name_fr: values.name_fr.trim(),
        description_en: values.description_en?.trim() || null,
        description_fr: values.description_fr?.trim() || null,
        category_id: values.category_id || null,
        service_type: values.service_type,
        delivery_mode: values.delivery_mode,
        price_indication_en: values.price_indication_en?.trim() || null,
        price_indication_fr: values.price_indication_fr?.trim() || null,
        status: values.status,
      };

      if (service) {
        const payload: UpdateServiceInput = sharedPayload;
        await updateService.mutateAsync({ id: service.id, data: payload });
        toast.success(t("updateSuccess"), { id: toastId });
      } else {
        const payload: CreateServiceInput = {
          company_id: companyId,
          ...sharedPayload,
        };
        await createService.mutateAsync(payload);
        toast.success(t("createSuccess"), { id: toastId });
      }

      router.push("/dashboard/services");
    } catch (err) {
      const message =
        err instanceof Error && err.message === "RLS_NO_ROWS"
          ? t("permissionError")
          : err instanceof Error
            ? err.message
            : t("genericError");
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
            {t("descriptionEnLabel")}{" "}
            <span className="text-slate-400 font-normal">{t("optional")}</span>
          </Label>
          <Textarea
            id="description_en"
            placeholder={t("descriptionEnPlaceholder")}
            rows={4}
            className="text-sm resize-none"
            {...register("description_en")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description_fr" className="text-sm font-medium text-slate-700">
            {t("descriptionFrLabel")}{" "}
            <span className="text-slate-400 font-normal">{t("optional")}</span>
          </Label>
          <Textarea
            id="description_fr"
            placeholder={t("descriptionFrPlaceholder")}
            rows={4}
            className="text-sm resize-none"
            {...register("description_fr")}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">
            {t("serviceTypeLabel")} <span className="text-red-500">*</span>
          </Label>
          <Select
            value={serviceTypeValue}
            onValueChange={(v) => setValue("service_type", v as ServiceType)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="text-sm">
                  {t(`serviceTypes.${type}` as Parameters<typeof t>[0])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">
            {t("deliveryModeLabel")} <span className="text-red-500">*</span>
          </Label>
          <Select
            value={deliveryModeValue}
            onValueChange={(v) => setValue("delivery_mode", v as ServiceDeliveryMode)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DELIVERY_MODES.map((mode) => (
                <SelectItem key={mode} value={mode} className="text-sm">
                  {t(`deliveryModes.${mode}` as Parameters<typeof t>[0])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">
            {t("categoryLabel")}{" "}
            <span className="text-slate-400 font-normal">{t("optional")}</span>
          </Label>
          <Select
            value={categoryValue ? categoryValue : NO_CATEGORY}
            onValueChange={(v) =>
              setValue("category_id", v === NO_CATEGORY ? "" : v)
            }
          >
            <SelectTrigger className="h-8 text-sm">
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

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">
            {t("statusLabel")} <span className="text-red-500">*</span>
          </Label>
          <Select
            value={statusValue}
            onValueChange={(v) => setValue("status", v as ServiceStatus)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status} className="text-sm">
                  {t(`statuses.${status}` as Parameters<typeof t>[0])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="price_indication_en" className="text-sm font-medium text-slate-700">
            {t("priceEnLabel")}{" "}
            <span className="text-slate-400 font-normal">{t("optional")}</span>
          </Label>
          <Input
            id="price_indication_en"
            placeholder={t("pricePlaceholder")}
            className="text-sm h-8"
            {...register("price_indication_en")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="price_indication_fr" className="text-sm font-medium text-slate-700">
            {t("priceFrLabel")}{" "}
            <span className="text-slate-400 font-normal">{t("optional")}</span>
          </Label>
          <Input
            id="price_indication_fr"
            placeholder={t("pricePlaceholder")}
            className="text-sm h-8"
            {...register("price_indication_fr")}
          />
        </div>
      </div>

      <div className="pt-2 flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          {service ? t("saveChanges") : t("createService")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/services")}
          disabled={submitting}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
