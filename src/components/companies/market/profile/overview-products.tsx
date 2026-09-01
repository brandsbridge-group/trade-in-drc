import { useTranslations } from "next-intl";
import { Package } from "lucide-react";
import { SkeletonImage } from "@/components/design";
import { ProfileCard } from "./profile-card";
import type { ProfileProduct } from "./types";

const MAX_PRODUCTS = 3;

interface OverviewProductsProps {
  products: ProfileProduct[];
}

/**
 * "Key Products & Services" card (design 5 middle column): up to three product
 * media rows (thumbnail + name + short description). Renders only real products;
 * an empty state shows when the company has none.
 */
export function OverviewProducts({ products }: OverviewProductsProps) {
  const t = useTranslations("CompanyProfile");
  const items = products.slice(0, MAX_PRODUCTS);

  return (
    <ProfileCard id="products" title={t("products.title")}>
      {items.length === 0 ? (
        <p className="text-[13px] text-market-navy/50">{t("products.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((product) => {
            const image = product.images?.[0] ?? null;
            return (
              <li
                key={product.id}
                className="flex gap-3 rounded-md border border-market-navy/5 bg-market-cream/40 p-2.5"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-market-navy/10 bg-white">
                  {image ? (
                    <SkeletonImage
                      src={image}
                      alt={product.name}
                      wrapperClassName="h-full w-full"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-6 w-6 text-market-navy/30" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-market-navy">{product.name}</p>
                  {product.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-market-navy/60">
                      {product.description}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ProfileCard>
  );
}
