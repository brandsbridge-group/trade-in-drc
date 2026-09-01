import { Link } from "@/i18n/routing";
import { VerificationBadge } from "@/components/trust/verification-badge";
import type { VerificationTier } from "@/lib/trust/types";
import { SkeletonImage } from "./skeleton-image";

interface ProductCardData {
  id: string;
  name: string;
  image_url?: string | null;
  company_id: string;
  company_name?: string | null;
  verificationTier?: VerificationTier | null;
}

export function ProductCardDesign({ item }: { item: ProductCardData }) {
  return (
    <Link
      href={`/products/${item.id}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-2 hover:border-slate-300 transition"
    >
      {item.image_url ? (
        <SkeletonImage
          src={item.image_url}
          alt={item.name}
          wrapperClassName="aspect-square rounded-2xl"
          className="group-hover:scale-[1.02] transition-transform duration-300 ease-out"
        />
      ) : (
        <div className="aspect-square rounded-2xl bg-slate-100" />
      )}
      <div className="px-1 pt-2 pb-1">
        <p className="text-sm font-medium leading-tight line-clamp-2 text-foreground">{item.name}</p>
        {item.company_name && (
          <p className="text-xs text-primary mt-1 line-clamp-1">{item.company_name}</p>
        )}
        {item.verificationTier && item.verificationTier !== "none" && (
          <span className="mt-1.5 inline-flex">
            <VerificationBadge tier={item.verificationTier} />
          </span>
        )}
      </div>
    </Link>
  );
}
