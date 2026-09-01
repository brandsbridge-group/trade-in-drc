import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { VerificationBadge } from "@/components/trust/verification-badge";
import { TagChip } from "./tag-chip";
import { SkeletonImage } from "./skeleton-image";
import type { VerificationTier } from "@/lib/trust/types";

interface CompanyRowData {
  id: string;
  name: string;
  logo_url?: string | null;
  description?: string | null;
  verification_tier?: VerificationTier | null;
  founded_year?: number | null;
  tags?: string[];
  thumbnail_urls?: string[];
}

interface CompanyRowProps {
  company: CompanyRowData;
}

export function CompanyRow({ company }: CompanyRowProps) {
  const t = useTranslations("Design");
  const tier = (company.verification_tier ?? "none") as VerificationTier;
  return (
    <Link
      href={`/companies/${company.id}`}
      className="grid grid-cols-[56px_1fr_auto] gap-2.5 items-start border border-slate-200 rounded-2xl p-3 bg-white hover:border-slate-300 transition"
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden">
        {company.logo_url
          ? <SkeletonImage src={company.logo_url} alt="" wrapperClassName="w-full h-full rounded-2xl" className="object-cover" />
          : <span className="text-sm font-semibold text-muted-foreground">{company.name.slice(0, 2)}</span>
        }
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium text-sm">{company.name}</span>
          <VerificationBadge tier={tier} />
          {company.founded_year && (
            <span className="text-xs text-muted-foreground">{t("yearsActive", { count: new Date().getFullYear() - company.founded_year })}</span>
          )}
        </div>
        {company.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{company.description}</p>
        )}
        {company.tags && company.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {company.tags.slice(0, 6).map((t) => <TagChip key={t}>{t}</TagChip>)}
          </div>
        )}
      </div>
      {company.thumbnail_urls && company.thumbnail_urls.length > 0 && (
        <div className="hidden md:flex gap-1 shrink-0">
          {company.thumbnail_urls.slice(0, 5).map((src, i) => (
            <SkeletonImage
              key={i}
              src={src}
              alt=""
              wrapperClassName="w-12 h-12 rounded-xl shrink-0"
              className="object-cover"
            />
          ))}
        </div>
      )}
    </Link>
  );
}
