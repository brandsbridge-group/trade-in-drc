import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, Facebook, Twitter, Linkedin, Youtube, Mail, Phone, MapPin } from "lucide-react";
import {
  CONTACT,
  CONTACT_ADDRESS,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE_HREF,
} from "@/config/contact";

interface FooterLink { href: string; key: string; }
type ColumnKey = "quickLinks" | "resources" | "about" | "support";

/* Column structure mirrors the customer marketplace design (latest-designs/1.ai). */
const COLUMNS: Array<{ key: ColumnKey; links: FooterLink[] }> = [
  { key: "quickLinks", links: [
    { key: "home",          href: "/" },
    { key: "companies",     href: "/companies" },
    { key: "opportunities", href: "/opportunities" },
    { key: "marketplace",   href: "/market" },
    { key: "events",        href: "/events" },
  ]},
  { key: "resources", links: [
    { key: "marketIntelligence", href: "/data-hub" },
    { key: "localContacts",      href: "/local-contacts" },
    { key: "services",           href: "/services" },
    { key: "pricing",            href: "/pricing" },
  ]},
  { key: "about", links: [
    { key: "aboutUs",        href: "/about" },
    { key: "register",       href: "/register-company" },
    { key: "requestPartner", href: "/request" },
    { key: "contactUs",      href: "/contact" },
  ]},
  { key: "support", links: [
    { key: "helpCenter", href: "/help" },
    { key: "faq",        href: "/faq" },
    { key: "terms",      href: "/terms" },
    { key: "privacy",    href: "/privacy" },
  ]},
];

const SOCIAL: { label: string; href: string; Icon: React.ElementType; bg: string }[] = [
  { label: "Facebook", href: "#", Icon: Facebook, bg: "#1877F2" },
  { label: "LinkedIn", href: "#", Icon: Linkedin, bg: "#0A66C2" },
  { label: "Twitter",  href: "#", Icon: Twitter,  bg: "#1DA1F2" },
  { label: "YouTube",  href: "#", Icon: Youtube,  bg: "#FF0000" },
];

/** Navy marketplace footer (design 1) with the light tagline bar underneath. */
export async function SiteFooter() {
  const t = await getTranslations("MarketHome.footer");
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 bg-market-navy text-white/70">
      <div className="mx-auto grid max-w-[1500px] gap-8 px-4 py-9 md:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))_auto] md:px-6">
        <div>
          <Logo size="md" />
          <p className="mt-3 max-w-[15rem] text-xs text-white/60">{t("tagline")}</p>

          {/* Contact on every page — values from config/contact.ts. */}
          <ul className="mt-4 space-y-1.5 text-xs text-white/70">
            <li className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 flex-none text-white/50" aria-hidden />
              <a
                href={CONTACT_EMAIL_HREF}
                className="transition-colors duration-150 ease-out hover:text-white"
              >
                {CONTACT.email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 flex-none text-white/50" aria-hidden />
              <a
                href={CONTACT_PHONE_HREF}
                className="transition-colors duration-150 ease-out hover:text-white"
              >
                {CONTACT.phone}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 flex-none text-white/50" aria-hidden />
              <span className="whitespace-pre-line">{CONTACT_ADDRESS}</span>
            </li>
          </ul>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.key} className="text-sm">
            <p className="mb-2.5 text-sm font-bold text-white">{t(`columns.${col.key}.title`)}</p>
            <ul className="space-y-1.5">
              {col.links.map((l) => (
                <li key={l.key}>
                  <Link
                    href={l.href}
                    className="text-xs text-white/65 transition-colors duration-150 ease-out hover:text-white"
                  >
                    {t(`columns.${col.key}.${l.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="mb-2.5 text-sm font-bold text-white">{t("stayConnected")}</p>
          <div className="flex gap-2.5">
            {SOCIAL.map(({ label, href, Icon, bg }) => (
              <a
                key={label}
                aria-label={label}
                href={href}
                style={{ backgroundColor: bg }}
                className="grid h-9 w-9 place-items-center rounded-full text-white transition-opacity duration-150 ease-out hover:opacity-85"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <Link
            href="/pricing"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-market-gold px-3.5 py-2 text-xs font-bold text-market-navy transition-colors duration-150 hover:bg-yellow-400"
          >
            {t("upgradePremium")} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <p className="mt-3 text-[11px] text-white/55">{t("copyright", { year: String(year) })}</p>
        </div>
      </div>
      <div className="border-t border-white/10 bg-market-navy-deep text-white">
        <div className="mx-auto max-w-[1500px] px-4 py-3.5 text-center text-sm font-semibold md:px-6">
          {t("taglineBar")}
        </div>
      </div>
    </footer>
  );
}
