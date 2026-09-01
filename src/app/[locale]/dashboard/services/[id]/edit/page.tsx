"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/design";
import {
  ServiceForm,
  type ExistingService,
} from "@/components/dashboard/service-form";

export default function EditServicePage() {
  const t = useTranslations("Dashboard.services");
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  const [loading, setLoading] = React.useState(true);
  const [service, setService] = React.useState<ExistingService | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();

        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData.user?.id;

        const { data: serviceRow, error: serviceError } = await supabase
          .from("services")
          .select("*")
          .eq("id", serviceId)
          .single();

        if (serviceError) throw serviceError;
        if (!serviceRow) {
          toast.error(t("loadError"));
          router.push("/dashboard/services");
          return;
        }

        // Ownership guard — only the owner of the service's company may edit.
        const { data: company } = await supabase
          .from("companies")
          .select("owner_id")
          .eq("id", serviceRow.company_id)
          .single();

        if (!currentUserId || !company || company.owner_id !== currentUserId) {
          toast.error(t("ownershipDenied"));
          router.push("/dashboard/services");
          return;
        }

        setService({
          id: serviceRow.id,
          company_id: serviceRow.company_id,
          name_en: serviceRow.name_en,
          name_fr: serviceRow.name_fr,
          description_en: serviceRow.description_en,
          description_fr: serviceRow.description_fr,
          category_id: serviceRow.category_id,
          service_type: serviceRow.service_type,
          delivery_mode: serviceRow.delivery_mode,
          price_indication_en: serviceRow.price_indication_en,
          price_indication_fr: serviceRow.price_indication_fr,
          status: serviceRow.status,
        });
      } catch {
        toast.error(t("loadError"));
        router.push("/dashboard/services");
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      load();
    }
  }, [serviceId, router, t]);

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!service) {
    return null;
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/dashboard/services"
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {t("backToServices")}
      </Link>
      <PageHeader title={t("editService")} />

      <div className="bg-card border border-slate-200 rounded-2xl p-4">
        <ServiceForm companyId={service.company_id} service={service} />
      </div>
    </div>
  );
}
