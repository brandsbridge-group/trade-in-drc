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
          .select("owner_id")
          .eq("id", productRow.company_id)
          .single();

        if (!currentUserId || !company || company.owner_id !== currentUserId) {
          toast.error(t("ownershipDenied"));
          router.push("/dashboard/products");
          return;
        }

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
      <div className="min-h-[200px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/dashboard/products"
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {t("backToProducts")}
      </Link>
      <PageHeader title={t("editProduct")} />

      <div className="bg-card border border-slate-200 rounded-2xl p-4">
        <ProductForm companyId={product.company_id} product={product} />
      </div>
    </div>
  );
}
