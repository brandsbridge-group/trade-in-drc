"use client";

import * as React from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  animate,
} from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import {
  User,
  LayoutDashboard,
  Briefcase,
  Users,
  Boxes,
  LineChart as LineChartIcon,
  Bookmark,
  Bell,
  ChevronDown,
  TrendingUp,
  Building2,
  Mountain,
  Sprout,
  Zap,
  Cpu,
  Factory,
  Fuel,
  Package,
  Shirt,
  Trees,
  Wheat,
  BadgeCheck,
  Globe,
  Check,
  LogIn,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Link } from "@/i18n/routing";
import { CATEGORY_DISPLAY } from "@/lib/opportunities/board-config";
import type { HeroPanelData } from "./hero-panel-data";

/**
 * Interactive, animated showcase of the inner dashboard for the hero. The left
 * nav switches the right-side panel; every tab shows live platform data loaded
 * on the server (see hero-panel-data.ts) and rows link to their detail pages.
 * On mount and on every tab change the content animates in (Jakub recipe), the
 * bars grow in and headline numbers count up. All motion is gated on
 * prefers-reduced-motion.
 */

type TabKey =
  | "overview"
  | "opportunities"
  | "partners"
  | "sectors"
  | "insights"
  | "watchlist";

const NAV: { key: TabKey; Icon: LucideIcon }[] = [
  { key: "overview", Icon: LayoutDashboard },
  { key: "opportunities", Icon: Briefcase },
  { key: "partners", Icon: Users },
  { key: "sectors", Icon: Boxes },
  { key: "insights", Icon: LineChartIcon },
  { key: "watchlist", Icon: Bookmark },
];

const SECTOR_ICONS: Record<string, LucideIcon> = {
  "mining-minerals": Mountain,
  agriculture: Sprout,
  "forestry-timber": Trees,
  "oil-gas": Fuel,
  manufacturing: Factory,
  "textiles-apparel": Shirt,
  "food-beverages": Wheat,
  construction: Building2,
  technology: Cpu,
  energy: Zap,
};

/** Fixed inner-body height so the panel never resizes between tabs. */
const BODY_H = "h-[300px]";

// ── Small animated number ───────────────────────────────────────────────────
function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = React.useState(reduce ? value : 0);
  React.useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, reduce]);
  return <>{format(Math.round(display))}</>;
}

// ── Horizontal bars (grow in from the left) ─────────────────────────────────
function Bars({ rows }: { rows: { name: string; count: number }[] }) {
  const reduce = useReducedMotion();
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={r.name}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="truncate text-[10px] font-medium text-slate-700">{r.name}</span>
            <span className="shrink-0 text-[10px] font-semibold tabular-nums text-slate-900">{r.count}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full origin-left rounded-full bg-blue-600"
              style={{ width: `${(r.count / max) * 100}%` }}
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.15 + i * 0.05, ease: "easeOut" }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Chip({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "green" | "amber" | "red" | "slate" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-100 text-slate-600",
  } as const;
  return (
    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Same urgency scale as the opportunities board. */
function deadlineTone(days: number | null): "slate" | "red" | "amber" | "green" {
  if (days === null) return "slate";
  if (days <= 7) return "red";
  if (days <= 21) return "amber";
  return "green";
}

// Header chrome: a region scope dropdown (display only) and a notifications
// popover listing the latest real platform events.
type Scope = "drc" | "region" | "global";

function PanelHeaderControls({ notifications }: { notifications: HeroPanelData["notifications"] }) {
  const t = useTranslations("Landing.panel");
  const [menu, setMenu] = React.useState<null | "scope" | "bell">(null);
  const [scope, setScope] = React.useState<Scope>("drc");
  const [unread, setUnread] = React.useState(notifications.length > 0);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menu) return;
    function onDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setMenu(null);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [menu]);

  const scopeLabel = scope === "drc" ? t("drc") : scope === "region" ? t("scopeRegion") : t("scopeGlobal");
  const scopes: { key: Scope; label: string }[] = [
    { key: "drc", label: t("drc") },
    { key: "region", label: t("scopeRegion") },
    { key: "global", label: t("scopeGlobal") },
  ];

  return (
    <div ref={ref} className="relative flex items-center gap-2 text-slate-400">
      {/* Region scope */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenu(menu === "scope" ? null : "scope")}
          aria-haspopup="listbox"
          aria-expanded={menu === "scope"}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          {scope === "drc" ? <span aria-hidden>🇨🇩</span> : <Globe className="h-3 w-3" aria-hidden />}
          {scopeLabel}
          <ChevronDown className="h-3 w-3" aria-hidden />
        </button>
        {menu === "scope" && (
          <div className="absolute right-0 top-full z-40 mt-1 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-md" role="listbox">
            {scopes.map((s) => (
              <button
                key={s.key}
                type="button"
                role="option"
                aria-selected={scope === s.key}
                onClick={() => { setScope(s.key); setMenu(null); }}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] text-slate-700 transition-colors hover:bg-slate-50"
              >
                {s.label}
                {scope === s.key && <Check className="h-3 w-3 text-blue-600" aria-hidden />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setMenu(menu === "bell" ? null : "bell"); setUnread(false); }}
          aria-label={t("notifTitle")}
          aria-expanded={menu === "bell"}
          className="relative flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
        >
          <Bell className="h-4 w-4" aria-hidden />
          {unread && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />}
        </button>
        {menu === "bell" && (
          <div className="absolute right-0 top-full z-40 mt-1 w-60 rounded-lg border border-slate-200 bg-white p-2 text-left shadow-md">
            <p className="px-1 pb-1 text-[11px] font-bold text-slate-900">{t("notifTitle")}</p>
            {notifications.length === 0 ? (
              <p className="px-1.5 py-1.5 text-[10px] text-slate-500">{t("notifEmpty")}</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="flex items-start gap-2 rounded-md px-1.5 py-1.5 transition-colors hover:bg-slate-50"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  <span className="text-[10px] leading-snug text-slate-600">
                    {t(`notif.${n.kind}`, { label: n.label })}
                  </span>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function HeroDashboardPanel({ data, locale: localeProp }: { data: HeroPanelData; locale?: string }) {
  const t = useTranslations("Landing.panel");
  const tBadge = useTranslations("Opportunities.badges");
  const activeLocale = useLocale();
  const locale = localeProp ?? activeLocale;
  const reduce = useReducedMotion();
  const [tab, setTab] = React.useState<TabKey>("overview");
  const nf = React.useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const usd = React.useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }),
    [locale],
  );

  const { stats, kpis } = data;
  const STATS = [
    { key: "opportunities", value: stats.opportunities, sub: t("statsSub.closingSoon", { n: stats.closingSoon }), Icon: TrendingUp, tone: "bg-blue-600" },
    { key: "partners", value: stats.partners, sub: t("statsSub.provinces", { n: stats.provinces }), Icon: Users, tone: "bg-red-500" },
    { key: "products", value: stats.products, sub: t("statsSub.categories", { n: stats.categories }), Icon: Package, tone: "bg-blue-600" },
  ] as const;
  const KPIS = [
    { key: "budget", value: usd.format(kpis.budgetUsd) },
    { key: "newListings", value: nf.format(kpis.newListings30d) },
    { key: "activeListings", value: nf.format(kpis.activeListings) },
  ] as const;
  const closesIn = (days: number | null) => (days === null ? t("noDeadline") : t("closesIn", { days }));

  const container = reduce
    ? undefined
    : {
        hidden: {},
        visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
      };
  const item = reduce
    ? undefined
    : {
        hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { type: "spring" as const, duration: 0.35, bounce: 0 },
        },
      };

  return (
    <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
      {/* Sidebar (interactive on sm+) */}
      <aside className="hidden w-36 shrink-0 flex-col bg-[var(--color-landing-navy)] py-4 sm:flex">
        <div className="mb-4 flex h-8 w-8 items-center justify-center self-center rounded-full bg-white/10 text-white/80">
          <User className="h-4 w-4" />
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          {NAV.map(({ key, Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-medium transition-colors duration-150 ${
                  active ? "text-white" : "text-white/55 hover:text-white/80"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="heroPanelActive"
                    className="absolute inset-0 rounded-lg bg-white/15"
                    transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                  />
                )}
                <Icon className="relative z-10 h-3.5 w-3.5 shrink-0" />
                <span className="relative z-10">{t(`nav.${key}`)}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">{t(`nav.${tab}`)}</p>
          <PanelHeaderControls notifications={data.notifications} />
        </div>

        <div className={BODY_H}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            className="h-full"
            variants={container}
            initial={reduce ? false : "hidden"}
            animate="visible"
            exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.15 } }}
          >
            {/* OVERVIEW */}
            {tab === "overview" && (
              <div className="flex h-full flex-col gap-3">
                <div className="grid shrink-0 grid-cols-3 gap-2">
                  {STATS.map(({ key, value, sub, Icon, tone }) => (
                    <motion.div key={key} variants={item} className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm">
                      <div className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full ${tone} text-white`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-[9px] leading-tight text-slate-500">{t(`stats.${key}`)}</p>
                      <p className="text-base font-bold leading-tight text-slate-900">
                        <CountUp value={value} format={(n) => nf.format(n)} />
                      </p>
                      <p className="text-[10px] font-semibold leading-tight text-emerald-600">{sub}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
                  <motion.div variants={item} className="flex min-h-0 flex-col">
                    <p className="mb-2 text-[11px] font-bold text-slate-900">{t("topOpportunities")}</p>
                    <ul className="space-y-1">
                      {data.opportunities.slice(0, 4).map((o) => {
                        const Icon = CATEGORY_DISPLAY[o.category].icon;
                        return (
                          <li key={o.href}>
                            <Link href={o.href} className="-mx-1 flex items-center gap-1.5 rounded-md px-1 py-1 transition-colors duration-150 hover:bg-slate-50">
                              <Icon className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                              <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-slate-700">{o.title}</span>
                              <Chip tone={deadlineTone(o.daysLeft)}>{closesIn(o.daysLeft)}</Chip>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.div>
                  <motion.div variants={item} className="flex min-h-0 flex-col">
                    <p className="mb-2 text-[11px] font-bold text-slate-900">{t("sectorBars")}</p>
                    <Bars rows={data.sectors.slice(0, 4).map((s) => ({ name: s.name, count: s.companies }))} />
                  </motion.div>
                </div>
              </div>
            )}

            {/* OPPORTUNITIES */}
            {tab === "opportunities" && (
              <ul className="flex h-full flex-col gap-2">
                {data.opportunities.map((o) => {
                  const Icon = CATEGORY_DISPLAY[o.category].icon;
                  return (
                    <motion.li key={o.href} variants={item} className="min-h-0 flex-1">
                      <Link
                        href={o.href}
                        className="flex h-full items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm transition-colors duration-150 hover:border-slate-200"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-blue-600" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-semibold text-slate-800">{o.title}</p>
                          <p className="text-[9px] text-slate-400">{o.region}</p>
                        </div>
                        <Chip tone="slate">{tBadge(CATEGORY_DISPLAY[o.category].labelKey)}</Chip>
                        <Chip tone={deadlineTone(o.daysLeft)}>{closesIn(o.daysLeft)}</Chip>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            )}

            {/* PARTNERS */}
            {tab === "partners" && (
              <ul className="flex h-full flex-col gap-2">
                {data.partners.map((p) => (
                  <motion.li key={p.href} variants={item} className="min-h-0 flex-1">
                    <Link
                      href={p.href}
                      className="flex h-full items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm transition-colors duration-150 hover:border-slate-200"
                    >
                      {p.logo ? (
                        // Company logos live on arbitrary storage hosts.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.logo} alt="" className="h-7 w-7 shrink-0 rounded-lg bg-white object-contain ring-1 ring-slate-100" />
                      ) : (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">
                          {p.initials}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-slate-800">{p.name}</p>
                        <p className="truncate text-[9px] text-slate-400">
                          {[p.sector, p.place].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[8px] font-medium text-blue-600">
                        <BadgeCheck className="h-2.5 w-2.5" /> {t("verified")}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            )}

            {/* SECTORS */}
            {tab === "sectors" && (
              <div className="grid h-full grid-cols-2 grid-rows-3 gap-2">
                {data.sectors.map(({ slug, name, companies, products }) => {
                  const Icon = SECTOR_ICONS[slug] ?? Boxes;
                  return (
                    <motion.div key={slug} variants={item} className="flex min-h-0 flex-col justify-center rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600">{t("offers", { n: products })}</span>
                      </div>
                      <p className="truncate text-[11px] font-semibold text-slate-800">{name}</p>
                      <p className="text-[9px] text-slate-400">
                        <CountUp value={companies} format={(n) => nf.format(n)} /> {t("companies")}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* INSIGHTS */}
            {tab === "insights" && (
              <div className="flex h-full flex-col gap-3">
                <div className="grid shrink-0 grid-cols-3 gap-2">
                  {KPIS.map(({ key, value }) => (
                    <motion.div key={key} variants={item} className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm">
                      <p className="text-[9px] leading-tight text-slate-500">{t(`kpi.${key}`)}</p>
                      <p className="text-sm font-bold leading-tight text-slate-900">{value}</p>
                    </motion.div>
                  ))}
                </div>
                <motion.div variants={item} className="flex min-h-0 flex-1 flex-col">
                  <p className="mb-2 text-[11px] font-bold text-slate-900">{t("provinceBars")}</p>
                  <Bars rows={data.provinces} />
                </motion.div>
              </div>
            )}

            {/* WATCHLIST — personal, so it needs an account */}
            {tab === "watchlist" && (
              <motion.div
                variants={item}
                className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 px-6 text-center"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Bookmark className="h-4 w-4" />
                </span>
                <p className="text-[12px] font-bold text-slate-900">{t("watchEmptyTitle")}</p>
                <p className="max-w-[16rem] text-[10px] leading-snug text-slate-500">{t("watchEmptyBody")}</p>
                <Link
                  href="/login?redirect=%2Fdashboard"
                  className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--color-landing-navy)] px-3 py-1.5 text-[10px] font-semibold text-white transition-colors duration-150 hover:bg-[#13244a]"
                >
                  <LogIn className="h-3 w-3" /> {t("watchCta")}
                </Link>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
