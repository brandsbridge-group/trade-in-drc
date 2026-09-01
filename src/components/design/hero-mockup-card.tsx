import { CheckCircle2, Globe } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface MockupRow {
  country: string;
  title: string;
  chip: "importer" | "exporter";
}

export async function HeroMockupCard({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Design.hero.mockup" });
  const rows = (t.raw("rows") as MockupRow[]) ?? [];
  return (
    <div className="hidden md:block w-full max-w-sm bg-card text-foreground rounded-2xl border border-slate-200 p-3">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-4 h-4 text-primary" />
        <p className="text-xs font-medium">{t("title")}</p>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center justify-between border-t py-2 text-xs">
          <div className="min-w-0">
            <p className="truncate font-medium">{row.title}</p>
            <p className="text-muted-foreground">{row.country}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            {t(`chip.${row.chip}`)}
          </span>
        </div>
      ))}
    </div>
  );
}
