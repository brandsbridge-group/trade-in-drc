import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  Building,
  Users,
  MapPin,
  Map,
  Languages as LanguagesIcon,
  Plane,
} from "lucide-react";
import { ProfileCard } from "./profile-card";
import type { CompanyProfileData } from "./types";

const EMPTY = "—";

interface OverviewAboutProps {
  company: CompanyProfileData;
}

interface Fact {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

/**
 * "About {name}" card (design 5 left column): description paragraph + a 2-column
 * icon fact grid. Facts not present in the schema (year established, company
 * type, employee count) render "—" rather than fabricated values. Real fields:
 * headquarters (city/province), service areas + international experience
 * (markets), languages (spoken_languages).
 */
export function OverviewAbout({ company }: OverviewAboutProps) {
  const t = useTranslations("CompanyProfile");

  // Country comes from the record — companies are not all Congolese.
  const headquarters = [company.city, company.province, company.country]
    .filter(Boolean)
    .join(", ");
  const markets = company.markets.join(", ");
  const languages = company.spoken_languages.join(", ");

  const facts: Fact[] = [
    { icon: CalendarDays, label: t("about.yearEstablished"), value: EMPTY },
    { icon: Building, label: t("about.companyType"), value: EMPTY },
    { icon: Users, label: t("about.employees"), value: EMPTY },
    { icon: MapPin, label: t("about.headquarters"), value: headquarters || EMPTY },
    { icon: Map, label: t("about.serviceAreas"), value: markets || EMPTY },
    { icon: LanguagesIcon, label: t("about.languages"), value: languages || EMPTY },
    { icon: Plane, label: t("about.intlExperience"), value: markets || EMPTY },
  ];

  return (
    <ProfileCard id="overview" title={t("about.title", { name: company.name })}>
      {company.description && (
        <p className="text-[13px] leading-relaxed text-market-navy/70">{company.description}</p>
      )}
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.label} className="flex gap-2.5">
            <fact.icon className="mt-0.5 h-4 w-4 shrink-0 text-market-navy/50" />
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-market-navy/60">
                {fact.label}
              </dt>
              <dd className="text-[13px] text-market-navy/80">{fact.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </ProfileCard>
  );
}
