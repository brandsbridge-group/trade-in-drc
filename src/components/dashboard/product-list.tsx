"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { Edit, Trash2, Plus, Package, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts, useDeleteProduct } from "@/hooks/use-products";

interface ProductRowShape {
  id: string;
  name: string;
  name_en: string | null;
  name_fr: string | null;
  description: string | null;
  description_en: string | null;
  description_fr: string | null;
  images: string[] | null;
  created_at: string;
}

/** Prefer the bilingual column for the active locale, fall back to legacy name. */
const localizedProductName = (product: ProductRowShape, locale: string): string => {
  const localized = locale === "fr" ? product.name_fr : product.name_en;
  return localized ?? product.name_en ?? product.name;
};

/** Prefer the bilingual description for the active locale, fall back to legacy. */
const localizedProductDescription = (
  product: ProductRowShape,
  locale: string,
): string | null => {
  const localized = locale === "fr" ? product.description_fr : product.description_en;
  return localized ?? product.description_en ?? product.description;
};

interface ProductListProps {
  companyId: string;
}

export function ProductList({ companyId }: ProductListProps) {
  const t = useTranslations("Dashboard.products");
  const locale = useLocale();
  const { data: products, isLoading } = useProducts(companyId);
  const deleteProduct = useDeleteProduct();

  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [locale]
  );

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(t("deleteConfirm", { name }))) return;

    const toastId = toast.loading(t("deleting"));
    try {
      await deleteProduct.mutateAsync(id);
      toast.success(t("deleted"), { id: toastId });
    } catch {
      toast.error(t("deleteError"), { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="border border-slate-200 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colName")}</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colDescription")}</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colImages")}</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colCreated")}</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="border-b border-slate-100">
                {[1, 2, 3, 4, 5].map((j) => (
                  <td key={j} className="px-4 py-2">
                    <div className="h-4 bg-slate-100 animate-pulse rounded-sm" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="border border-slate-200 rounded-sm p-12 text-center">
        <Package className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-600 mb-1">{t("emptyTitle")}</p>
        <p className="text-xs text-slate-400 mb-4">{t("emptyBody")}</p>
        <Button size="sm" asChild>
          <Link href="/dashboard/products/new">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            {t("addProduct")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colName")}</th>
            <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colDescription")}</th>
            <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colImages")}</th>
            <th className="text-left px-4 py-2 font-medium text-slate-600">{t("colCreated")}</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {(products as unknown as ProductRowShape[]).map((product) => {
            const name = localizedProductName(product, locale);
            const description = localizedProductDescription(product, locale);
            return (
              <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2 font-medium text-slate-800">{name}</td>
                <td className="px-4 py-2 text-slate-500 max-w-xs">
                  <span className="truncate block" title={description ?? ""}>
                    {description
                      ? description.length > 60
                        ? description.slice(0, 60) + "…"
                        : description
                      : <span className="text-slate-300 italic">{t("noDescription")}</span>}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-500">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    {Array.isArray(product.images) ? product.images.length : 0}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-400 text-xs">
                  {dateFormatter.format(new Date(product.created_at))}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="sm" asChild className="h-7 px-2">
                      <Link href={`/dashboard/products/${product.id}/edit`}>
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(product.id, name)}
                      disabled={deleteProduct.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
