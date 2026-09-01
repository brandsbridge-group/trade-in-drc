"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useCreateRfq } from "@/hooks/use-rfq";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

const TODAY_ISO = new Date().toISOString().split("T")[0];

const rfqSchema = z.object({
  title: z.string().min(5, "validation.titleMin"),
  description: z.string().min(20, "validation.descriptionMin"),
  type: z.enum(["supply", "demand"] as const, {
    message: "validation.typeRequired",
  }),
  expires_at: z
    .string()
    .min(1, "validation.expiresRequired")
    .refine((val) => val > TODAY_ISO, { message: "validation.expiresFuture" }),
});

type RfqFormValues = z.infer<typeof rfqSchema>;

interface RfqFormProps {
  companyId: string;
}

export function RfqForm({ companyId }: RfqFormProps) {
  const t = useTranslations("RfqBoard.form");
  const router = useRouter();
  const createRfq = useCreateRfq();

  const form = useForm<RfqFormValues>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      title: "",
      description: "",
      expires_at: "",
    },
  });

  const errors = form.formState.errors;
  const translateError = (message?: string) =>
    message ? t(message as Parameters<typeof t>[0]) : null;

  const onSubmit = async (values: RfqFormValues) => {
    const toastId = toast.loading(t("creating"));
    try {
      await createRfq.mutateAsync({
        company_id: companyId,
        title: values.title,
        description: values.description,
        type: values.type,
        expires_at: values.expires_at,
      });
      toast.success(t("createSuccess"), { id: toastId });
      router.push("/dashboard/rfq");
    } catch {
      toast.error(t("createError"), { id: toastId });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">{t("title")}</FormLabel>
              <FormControl>
                <Input placeholder={t("titlePlaceholder")} className="text-sm" {...field} />
              </FormControl>
              {errors.title && (
                <p className="text-xs text-destructive">{translateError(errors.title.message)}</p>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">{t("description")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("descriptionPlaceholder")}
                  className="text-sm resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              {errors.description && (
                <p className="text-xs text-destructive">{translateError(errors.description.message)}</p>
              )}
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">{t("type")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder={t("selectType")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="supply">{t("typeSupply")}</SelectItem>
                    <SelectItem value="demand">{t("typeDemand")}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-xs text-destructive">{translateError(errors.type.message)}</p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expires_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">{t("expiresAt")}</FormLabel>
                <FormControl>
                  <Input type="date" className="text-sm" min={TODAY_ISO} {...field} />
                </FormControl>
                {errors.expires_at && (
                  <p className="text-xs text-destructive">{translateError(errors.expires_at.message)}</p>
                )}
              </FormItem>
            )}
          />
        </div>

        <div className="pt-2">
          <Button type="submit" size="sm" disabled={createRfq.isPending}>
            {createRfq.isPending ? t("creatingShort") : t("createListing")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
