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
  ClipboardList,
  Building2,
  Mountain,
  Sprout,
  Zap,
  Cpu,
  Factory,
  Truck,
  BadgeCheck,
  Globe,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Interactive, animated showcase of the inner dashboard for the hero. The left
 * nav switches the right-side panel; each section is filled with representative,
 * localized sample data (no live data — this is marketing eye-candy). On mount
 * and on every tab change the content animates in (Jakub recipe), the market
 * chart draws itself, and headline numbers count up. All motion is gated on
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

const STATS = [
  { key: "opportunities", value: 1248, delta: "+18%", Icon: TrendingUp, tone: "bg-blue-600" },
  { key: "partners", value: 842, delta: "+22%", Icon: Users, tone: "bg-red-500" },
  { key: "insights", value: 356, delta: "+15%", Icon: ClipboardList, tone: "bg-blue-600" },
] as const;

const TOP = [
  { key: "infrastructure", region: "Kinshasa", type: "investment", Icon: Building2, color: "text-emerald-600" },
  { key: "mining", region: "Lualaba", type: "partnership", Icon: Mountain, color: "text-amber-600" },
  { key: "agriculture", region: "Haut-Katanga", type: "distribution", Icon: Sprout, color: "text-green-600" },
  { key: "energy", region: "Tshopo", type: "tender", Icon: Zap, color: "text-blue-600" },
] as const;

const PARTNERS = [
  { name: "Kivu Agro SARL", country: "DRC", sector: "agriculture" },
  { name: "Anadolu Energy", country: "Türkiye", sector: "energy" },
  { name: "SinoTech Systems", country: "China", sector: "ict" },
  { name: "Global Trade Link", country: "USA", sector: "logistics" },
  { name: "Katanga Minerals", country: "DRC", sector: "mining" },
] as const;

const SECTORS = [
  { key: "mining", Icon: Mountain, count: 312, growth: "+14%" },
  { key: "agriculture", Icon: Sprout, count: 268, growth: "+9%" },
  { key: "energy", Icon: Zap, count: 154, growth: "+21%" },
  { key: "ict", Icon: Cpu, count: 97, growth: "+18%" },
  { key: "manufacturing", Icon: Factory, count: 203, growth: "+7%" },
  { key: "logistics", Icon: Truck, count: 121, growth: "+12%" },
] as const;

const WATCHLIST = [
  { kind: "company", label: "Kivu Agro SARL", sub: "agriculture", Icon: Sprout },
  { kind: "opportunity", label: "infrastructure", sub: "Kinshasa", Icon: Building2 },
  { kind: "company", label: "Anadolu Energy", sub: "energy", Icon: Zap },
  { kind: "opportunity", label: "mining", sub: "Lualaba", Icon: Mountain },
  { kind: "company", label: "SinoTech Systems", sub: "ict", Icon: Cpu },
] as const;

/** Fixed inner-body height so the panel never resizes between tabs. */
const BODY_H = "h-[300px]";

const KPIS = [
  { key: "volume", value: "$4.2B" },
  { key: "growth", value: "+16%" },
  { key: "listings", value: "1,248" },
] as const;

const CHART = [180, 250, 360, 300, 520, 760];
const CHART_MAX = 1000;

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

// ── Market activity chart (draws itself) ────────────────────────────────────
function MarketChart({ locale, fill = false }: { locale: string; fill?: boolean }) {
  const reduce = useReducedMotion();
  const monthFormat = new Intl.DateTimeFormat(locale, { month: "short" });
  const months = Array.from({ length: 6 }, (_, i) =>
    monthFormat.format(new Date(Date.UTC(2025, i, 1))),
  );
  const coords = CHART.map((v, i) => {
    const x = 6 + (i * (188 - 6)) / (CHART.length - 1);
    const y = 96 - (v / CHART_MAX) * 86;
    return { x, y };
  });
  const points = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid meet" className={fill ? "h-full w-full" : "w-full"} role="img" aria-hidden="true">
      {[0, 25, 50, 75].map((g) => (
        <line key={g} x1="6" x2="194" y1={96 - (g / 100) * 86} y2={96 - (g / 100) * 86} stroke="#EEF2F7" strokeWidth="1" />
      ))}
      <motion.polyline
        points={points}
        fill="none"
        stroke="#2563EB"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      {coords.map((c, i) => (
        <motion.circle
          key={i}
          cx={c.x}
          cy={c.y}
          r="2"
          fill="#2563EB"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : 0.5 + i * 0.06, duration: 0.2 }}
        />
      ))}
      {months.map((m, i) => (
        <text key={i} x={6 + (i * (188 - 6)) / 5} y="108" fontSize="6" fill="#94A3B8" textAnchor="middle">
          {m}
        </text>
      ))}
    </svg>
  );
}

function Chip({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "green" | "slate" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    slate: "bg-slate-100 text-slate-600",
  } as const;
  return (
    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

// Interactive (but non-functional) header chrome: a region scope dropdown and a
// notifications popover. Pure showcase — picking a scope just updates the label;
// opening the bell clears the unread dot. No real data or navigation.
type Scope = "drc" | "region" | "global";

function PanelHeaderControls() {
  const t = useTranslations("Landing.panel");
  const [menu, setMenu] = React.useState<null | "scope" | "bell">(null);
  const [scope, setScope] = React.useState<Scope>("drc");
  const [unread, setUnread] = React.useState(true);
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
  const notifs = [t("notif1"), t("notif2"), t("notif3")];

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
          <div className="absolute right-0 top-full z-40 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-2 text-left shadow-md">
            <p className="px-1 pb-1 text-[11px] font-bold text-slate-900">{t("notifTitle")}</p>
            {notifs.map((n, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md px-1.5 py-1.5 transition-colors hover:bg-slate-50">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <p className="text-[10px] leading-snug text-slate-600">{n}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function HeroDashboardPanel({ locale: localeProp }: { locale?: string }) {
  const t = useTranslations("Landing.panel");
  const activeLocale = useLocale();
  const locale = localeProp ?? activeLocale;
  const reduce = useReducedMotion();
  const [tab, setTab] = React.useState<TabKey>("overview");
  const nf = React.useMemo(() => new Intl.NumberFormat(locale), [locale]);

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
          <PanelHeaderControls />
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
                  {STATS.map(({ key, value, delta, Icon, tone }) => (
                    <motion.div key={key} variants={item} className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm">
                      <div className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full ${tone} text-white`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-[9px] leading-tight text-slate-500">{t(`stats.${key}`)}</p>
                      <p className="text-base font-bold leading-tight text-slate-900">
                        <CountUp value={value} format={(n) => nf.format(n)} />
                      </p>
                      <p className="text-[10px] font-semibold text-emerald-600">{delta}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
                  <motion.div variants={item} className="flex min-h-0 flex-col">
                    <p className="mb-2 text-[11px] font-bold text-slate-900">{t("topOpportunities")}</p>
                    <ul className="space-y-2.5">
                      {TOP.map(({ key, region, Icon, color }) => (
                        <li key={key} className="flex items-center gap-1.5">
                          <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
                          <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-slate-700">{t(`top.${key}`)}</span>
                          {region && <span className="hidden text-[9px] text-slate-400 lg:inline">{region}</span>}
                          <Chip>{t("highPotential")}</Chip>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                  <motion.div variants={item} className="flex min-h-0 flex-col">
                    <p className="mb-2 text-[11px] font-bold text-slate-900">{t("marketActivity")}</p>
                    <div className="min-h-0 flex-1">
                      <MarketChart locale={locale} fill />
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* OPPORTUNITIES */}
            {tab === "opportunities" && (
              <ul className="flex h-full flex-col gap-2">
                {TOP.map(({ key, region, type, Icon, color }) => (
                  <motion.li key={key} variants={item} className="flex min-h-0 flex-1 items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm">
                    <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-slate-800">{t(`top.${key}`)}</p>
                      <p className="text-[9px] text-slate-400">{region}</p>
                    </div>
                    <Chip tone="slate">{t(`oppTypes.${type}`)}</Chip>
                    <Chip tone="green">{t("statusOpen")}</Chip>
                  </motion.li>
                ))}
              </ul>
            )}

            {/* PARTNERS */}
            {tab === "partners" && (
              <ul className="flex h-full flex-col gap-2">
                {PARTNERS.map((p) => (
                  <motion.li key={p.name} variants={item} className="flex min-h-0 flex-1 items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">
                      {p.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-slate-800">{p.name}</p>
                      <p className="text-[9px] text-slate-400">{t(`sector.${p.sector}`)} · {p.country}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[8px] font-medium text-blue-600">
                      <BadgeCheck className="h-2.5 w-2.5" /> {t("verified")}
                    </span>
                  </motion.li>
                ))}
              </ul>
            )}

            {/* SECTORS */}
            {tab === "sectors" && (
              <div className="grid h-full grid-cols-2 grid-rows-3 gap-2">
                {SECTORS.map(({ key, Icon, count, growth }) => (
                  <motion.div key={key} variants={item} className="flex min-h-0 flex-col justify-center rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600">{growth}</span>
                    </div>
                    <p className="truncate text-[11px] font-semibold text-slate-800">{t(`sector.${key}`)}</p>
                    <p className="text-[9px] text-slate-400">
                      <CountUp value={count} format={(n) => nf.format(n)} /> {t("companies")}
                    </p>
                  </motion.div>
                ))}
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
                  <p className="mb-2 text-[11px] font-bold text-slate-900">{t("marketActivity")}</p>
                  <div className="min-h-0 flex-1">
                    <MarketChart locale={locale} fill />
                  </div>
                </motion.div>
              </div>
            )}

            {/* WATCHLIST */}
            {tab === "watchlist" && (
              <ul className="flex h-full flex-col gap-2">
                {WATCHLIST.map((w, i) => (
                  <motion.li key={i} variants={item} className="flex min-h-0 flex-1 items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm">
                    <Bookmark className="h-3.5 w-3.5 shrink-0 fill-blue-600 text-blue-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-slate-800">
                        {w.kind === "opportunity" ? t(`top.${w.label}`) : w.label}
                      </p>
                      <p className="text-[9px] text-slate-400">
                        {w.kind === "company" ? t(`sector.${w.sub}`) : w.sub}
                      </p>
                    </div>
                    <Chip tone="slate">{t("saved")}</Chip>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
