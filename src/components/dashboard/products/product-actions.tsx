"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteProduct, useDuplicateProduct, useSetProductPublished } from "@/hooks/use-products";
import { localizedName, type OwnerProduct, type ProductVisibility } from "@/lib/dashboard/products";

const PILL: Record<ProductVisibility, string> = {
  live: "bg-emerald-50 text-emerald-700",
  awaiting: "bg-amber-100 text-amber-800",
  hidden: "bg-slate-100 text-slate-600",
};

/** Status as a coloured dot + label (never colour alone). */
export function ProductVisibilityPill({ visibility, className }: { visibility: ProductVisibility; className?: string }) {
  const t = useTranslations("Dashboard.products.visibility");
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold", PILL[visibility], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {t(visibility)}
    </span>
  );
}

interface ProductActionsMenuProps {
  product: OwnerProduct;
  /** Where to go once the product is gone (the detail page leaves; the list stays). */
  afterDelete?: "list";
  /** Hide the "view details" entry on the detail page itself. */
  onDetailPage?: boolean;
  triggerClassName?: string;
}

/**
 * Everything a seller does to one product, shared by the list and the detail
 * page: open, edit, duplicate, hide/show, delete (behind a confirmation).
 */
export function ProductActionsMenu({ product, afterDelete, onDetailPage, triggerClassName }: ProductActionsMenuProps) {
  const t = useTranslations("Dashboard.products.actions");
  const locale = useLocale();
  const router = useRouter();
  const setPublished = useSetProductPublished();
  const duplicate = useDuplicateProduct();
  const remove = useDeleteProduct();
  const [confirming, setConfirming] = React.useState(false);
  const name = localizedName(product, locale);

  const togglePublished = async () => {
    const next = !product.is_published;
    const toastId = toast.loading(t(next ? "publishing" : "hiding"));
    try {
      await setPublished.mutateAsync({ id: product.id, published: next });
      toast.success(t(next ? "published" : "hidden"), { id: toastId });
    } catch {
      toast.error(t("error"), { id: toastId });
    }
  };

  const duplicateProduct = async () => {
    const toastId = toast.loading(t("duplicating"));
    try {
      const id = await duplicate.mutateAsync({ product, suffix: t("copySuffix") });
      toast.success(t("duplicated"), { id: toastId });
      router.push(`/dashboard/products/${id}/edit`);
    } catch {
      toast.error(t("error"), { id: toastId });
    }
  };

  const deleteProduct = async () => {
    const toastId = toast.loading(t("deleting"));
    try {
      await remove.mutateAsync(product.id);
      toast.success(t("deleted"), { id: toastId });
      setConfirming(false);
      if (afterDelete === "list") router.push("/dashboard/products");
    } catch {
      toast.error(t("error"), { id: toastId });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t("menu", { name })}
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-market-navy",
              triggerClassName
            )}
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {!onDetailPage && (
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/products/${product.id}`} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" aria-hidden />
                {t("details")}
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/products/${product.id}/edit`} className="cursor-pointer">
              <Pencil className="mr-2 h-4 w-4" aria-hidden />
              {t("edit")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={duplicateProduct} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4" aria-hidden />
            {t("duplicate")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={togglePublished} className="cursor-pointer">
            {product.is_published ? <EyeOff className="mr-2 h-4 w-4" aria-hidden /> : <Eye className="mr-2 h-4 w-4" aria-hidden />}
            {t(product.is_published ? "hide" : "publish")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setConfirming(true)} className="cursor-pointer text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" aria-hidden />
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-market-navy">{t("deleteTitle")}</DialogTitle>
            <DialogDescription>{t("deleteBody", { name })}</DialogDescription>
          </DialogHeader>
          {product.is_published && (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">{t("deleteHideInstead")}</p>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={remove.isPending}
              className="inline-flex h-10 items-center justify-center rounded-full bg-slate-100 px-4 text-[13px] font-semibold text-market-navy transition-colors hover:bg-slate-200"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={deleteProduct}
              disabled={remove.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-market-red px-4 text-[13px] font-semibold text-white transition-colors hover:bg-market-red/90 disabled:opacity-60"
            >
              {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />}
              {t("confirmDelete")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
