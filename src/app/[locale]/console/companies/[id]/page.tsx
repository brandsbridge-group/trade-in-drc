import { getTranslations } from "next-intl/server";
import { ArrowLeft, Building2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getCompanyForReview } from "@/lib/verifications/actions";
import { CompanySheet } from "./company-sheet";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

/** Reads one company (staff only, service role) and hands it to its sheet. */
export default async function ConsoleCompanyPage({ params }: PageProps) {
  const { id, locale } = await params;
  const t = await getTranslations("Admin.companies");
  const company = await getCompanyForReview(id, locale);

  if (!company) {
    return (
      <div className="space-y-4">
        <Link href="/console/companies" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-market-navy">
          <ArrowLeft className="size-3.5" aria-hidden />
          {t("backToCompanies")}
        </Link>
        <div className="rounded-2xl bg-white px-4 py-14 text-center ring-1 ring-slate-200/70">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-500" aria-hidden>
            <Building2 className="size-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-market-navy">{t("notFound")}</p>
        </div>
      </div>
    );
  }

  return <CompanySheet company={company} />;
}
