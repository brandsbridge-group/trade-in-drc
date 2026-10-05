import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/console/page-header";
import { CompanyKpis } from "@/components/console/companies/company-kpis";
import { CompaniesTable } from "@/components/console/companies/companies-table";
import { summarizeCompanies } from "@/lib/console/companies";
import { listCompaniesForAdmin } from "./actions";

/**
 * Every registered company, whatever its state: indicators, then the list
 * with its quick views by verification stage. Rows are read on the server
 * (owner e-mails and premium columns need the service role).
 */
export default async function ConsoleCompaniesPage() {
  const locale = await getLocale();
  const t = await getTranslations("Admin.companies");
  const rows = await listCompaniesForAdmin(locale);
  const now = new Date();

  return (
    <div className="space-y-4">
      <PageHeader title={t("listTitle")} subtitle={t("list.subtitle")} />
      <CompanyKpis summary={summarizeCompanies(rows, now)} />
      <CompaniesTable rows={rows} now={now.toISOString()} />
    </div>
  );
}
