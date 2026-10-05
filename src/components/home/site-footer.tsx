import { getTranslations } from "next-intl/server";
import { ArrowRight, Facebook, Linkedin, Mail, MapPin, Phone, Twitter, Youtube } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import {
  CONTACT,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE_HREF,
  SOCIAL_LINKS,
} from "@/config/contact";

interface FooterLink { href: string; key: string; }
type ColumnKey = "quickLinks" | "resources" | "about" | "support";

/* Same order as the main menu (navbar.tsx): what is hidden there is hidden here. */
const COLUMNS: Array<{ key: ColumnKey; links: FooterLink[] }> = [
  { key: "quickLinks", links: [
    { key: "marketplace",   href: "/market" },
    { key: "opportunities", href: "/opportunities" },
    { key: "companies",     href: "/companies" },
    { key: "events",        href: "/events" },
  ]},
  { key: "resources", links: [
    // { key: "marketIntelligence", href: "/data-hub" },
    { key: "localContacts",      href: "/local-contacts" },
    { key: "services",           href: "/services" },
    { key: "pricing",            href: "/pricing" },
  ]},
  { key: "about", links: [
    { key: "aboutUs",        href: "/about" },
    { key: "register",       href: "/register-company" },
    { key: "requestPartner", href: "/request" },
  ]},
  { key: "support", links: [
    { key: "helpCenter", href: "/help" },
    { key: "faq",        href: "/faq" },
    { key: "contactUs",  href: "/contact" },
  ]},
];

const LEGAL: FooterLink[] = [
  { key: "terms",   href: "/terms" },
  { key: "privacy", href: "/privacy" },
  { key: "cookies", href: "/cookies" },
];

/* Only the pages filled in config/contact.ts are shown. */
const SOCIAL = [
  { label: "Facebook", href: SOCIAL_LINKS.facebook, Icon: Facebook },
  { label: "LinkedIn", href: SOCIAL_LINKS.linkedin, Icon: Linkedin },
  { label: "X",        href: SOCIAL_LINKS.x,        Icon: Twitter },
  { label: "YouTube",  href: SOCIAL_LINKS.youtube,  Icon: Youtube },
].filter((s) => s.href);

const LINK = "transition-colors duration-150 ease-out hover:text-white";
const CONTACT_VALUE = "mt-0.5 block text-[13px] font-semibold text-white";

/**
 * Site footer, on the page box (max-w-6xl) like the content above it: brand
 * and link columns, the contact strip, then the legal bar with the language
 * picker. Same navy as the navbar, so the two frame every page.
 *
 * The space above it is the `.site-footer` rule of globals.css: 3rem on plain
 * pages, none on a page whose wrapper carries data-page-end="flush".
 */
export async function SiteFooter() {
  const t = await getTranslations("MarketHome.footer");
  const year = new Date().getFullYear();

  const contacts = [
    { key: "email", Icon: Mail, value: CONTACT.email, href: CONTACT_EMAIL_HREF },
    { key: "phone", Icon: Phone, value: CONTACT.phone, href: CONTACT_PHONE_HREF },
    { key: "address", Icon: MapPin, value: CONTACT.addressLines.join(", "), href: null },
  ];

  return (
    <footer className="site-footer relative bg-market-navy text-white/70">
      {/* Hairline catching the light, as under the navbar. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 pb-8 pt-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16">
          <div>
            <Link href="/" className="inline-flex">
              <Logo size="md" />
            </Link>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/60">{t("tagline")}</p>
            <Link
              href="/pricing"
              className="group mt-6 inline-flex items-center gap-1.5 rounded-full bg-market-or px-4 py-2 text-xs font-bold text-market-navy transition-colors duration-150 ease-out hover:bg-market-or-light active:bg-market-or-dark"
            >
              {t("upgradePremium")}
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>

          <nav aria-label={t("navLabel")} className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.key}>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                  {t(`columns.${col.key}.title`)}
                </h2>
                <ul className="mt-4 space-y-2.5 text-[13px] leading-5">
                  {col.links.map((l) => (
                    <li key={l.key}>
                      <Link href={l.href} className={`text-white/75 ${LINK}`}>
                        {t(`columns.${col.key}.${l.key}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Contact on every page — values from config/contact.ts. */}
        <ul className="grid divide-y divide-white/10 rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-[1fr_1fr_1.35fr]">
          {contacts.map(({ key, Icon, value, href }) => (
            <li key={key} className="flex items-center gap-3 px-5 py-4">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-white/[0.06] text-market-or-light">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-medium text-white/55">{t(`contact.${key}`)}</span>
                {href ? (
                  <a href={href} className={`${CONTACT_VALUE} break-words transition-colors duration-150 ease-out hover:text-market-or-light`}>
                    {value}
                  </a>
                ) : (
                  <span className={CONTACT_VALUE}>{value}</span>
                )}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-4 py-5 text-xs md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-x-6">
            <p className="text-white/55">{t("copyright", { year: String(year) })}</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {LEGAL.map((l) => (
                <li key={l.key}>
                  <Link href={l.href} className={`text-white/70 ${LINK}`}>
                    {t(`legal.${l.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* The picker's own padding is pulled back so its label lines up with the box edge. */}
          <div className="-ml-2.5 flex flex-none items-center gap-2 md:-mr-2.5 md:ml-0">
            {SOCIAL.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid h-8 w-8 place-items-center rounded-full text-white/65 ring-1 ring-inset ring-white/15 transition-colors duration-150 ease-out hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </a>
            ))}
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
