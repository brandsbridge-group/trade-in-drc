import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { companyInitials } from "@/lib/console/companies";

const SIZE = {
  sm: "size-9 rounded-xl text-xs",
  lg: "size-14 rounded-2xl text-lg",
} as const;

/** A company's logo, or its initials on navy when it has none. Decorative: the name sits next to it. */
export function CompanyAvatar({ name, logoUrl, size = "sm", className }: { name: string; logoUrl: string | null; size?: keyof typeof SIZE; className?: string }) {
  if (logoUrl) {
    return (
      <span className={cn("grid shrink-0 place-items-center overflow-hidden bg-white ring-1 ring-slate-200/70", SIZE[size], className)} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- logos come from storage and seed folders, any host */}
        <img src={logoUrl} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
      </span>
    );
  }
  return (
    <span className={cn("grid shrink-0 place-items-center bg-market-navy font-display font-semibold text-market-or-light", SIZE[size], className)} aria-hidden>
      {companyInitials(name) || <Building2 className={size === "lg" ? "size-6" : "size-4"} />}
    </span>
  );
}
