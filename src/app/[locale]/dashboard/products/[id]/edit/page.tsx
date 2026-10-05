"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/i18n/routing";
import { CardSkeleton } from "@/components/dashboard/overview/overview-card";
import {
  ProductForm,
  type ExistingProduct,
} from "@/components/dashboard/product-form";

export default function EditProductPage() {
  const t = useTranslations("Dashboard.products");
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [loading, setLoading] = React.useState(true);
  const [product, setProduct] = React.useState<ExistingProduct | null>(null);
  const [company, setCompany] = React.useState<{ name: string; status: string } | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();

        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData.user?.id;

        const { data: productRow, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();

        if (productError) throw productError;
        if (!productRow) {
          toast.error(t("loadError"));
          router.push("/dashboard/products");
          return;
        }

        // Ownership guard — only the owner of the product's company may edit.
        const { data: company } = await supabase
          .from("companies")
          .select("owner_id, name, status")
          .eq("id", productRow.company_id)
          .single();

        if (!currentUserId || !company || company.owner_id !== currentUserId) {
          toast.error(t("ownershipDenied"));
          router.push("/dashboard/products");
          return;
        }

        setCompany({ name: company.name, status: company.status });
        setProduct({
          id: productRow.id,
          company_id: productRow.company_id,
          name: productRow.name,
          name_en: productRow.name_en,
          name_fr: productRow.name_fr,
          description: productRow.description,
          description_en: productRow.description_en,
          description_fr: productRow.description_fr,
          category_id: productRow.category_id,
          images: productRow.images,
          specs: productRow.specs,
          price: productRow.price,
          price_currency: productRow.price_currency,
          sale_unit: productRow.sale_unit,
          min_order_quantity: productRow.min_order_quantity,
        });
      } catch {
        toast.error(t("loadError"));
        router.push("/dashboard/products");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      load();
    }
  }, [productId, router, t]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1100px] space-y-4 pt-2">
        <CardSkeleton rows={2} />
        <CardSkeleton rows={6} />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 pt-2">
      <header>
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-market-navy"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t("backToProducts")}
        </Link>
        <h1 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight text-market-navy sm:text-[30px]">
          {t("editProduct")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t("editSubtitle")}</p>
      </header>
      <ProductForm companyId={product.company_id} company={company ?? undefined} product={product} />
    </div>
  );
}
