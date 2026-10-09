"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
    ArrowRight,
    CalendarDays,
    ChevronDown,
    Crown,
    Handshake,
    Info,
    Mail,
    MapPinned,
    type LucideIcon,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface NavLinkItem {
    href: string;
    label: string;
    active: boolean;
}

/** Secondary destinations shown in the "More" panel. */
const MORE: { key: string; href: string; Icon: LucideIcon }[] = [
    { key: "about", href: "/about", Icon: Info },
    { key: "contactPoints", href: "/local-contacts", Icon: MapPinned },
    { key: "services", href: "/services", Icon: Handshake },
    { key: "events", href: "/events", Icon: CalendarDays },
    { key: "contact", href: "/contact", Icon: Mail },
];

const PROMOTION_IMAGES = [
    "/images/hero/hero-marketplace.jpg",
    "/images/hero/hero-pricing.jpg",
    "/images/hero/hero-boardroom-wide.jpg",
] as const;

/**
 * Desktop nav — frameless links with one highlight pill that glides to the
 * hovered item and rests on the active page (MOTION.md §2.9). "More" opens a panel:
 * five destinations with icons + one-line descriptions, and a featured
 * five destinations with icons + one-line descriptions, and a featured
 * Premium card.
                                    <Crown className="h-4 w-4" aria-hidden />
                                {t("featured.title")}
                                {t("featured.cta")}
 */
export function NavPills({
    links,
    moreActive,
    isActive,
}: {
    links: NavLinkItem[];
    moreActive: boolean;
    isActive: (href: string) => boolean;
}) {
    const t = useTranslations("Nav");
    const reduce = useReducedMotion();
    const [hovered, setHovered] = React.useState<string | null>(null);
    const [moreOpen, setMoreOpen] = React.useState(false);
    const [promotionIndex, setPromotionIndex] = React.useState(0);
    const [promotionHovered, setPromotionHovered] = React.useState(false);
    const [promotionFocused, setPromotionFocused] = React.useState(false);

    React.useEffect(() => {
        if (reduce || !moreOpen || promotionHovered || promotionFocused) return;

        const timer = window.setInterval(() => {
            setPromotionIndex((index) => (index + 1) % PROMOTION_IMAGES.length);
        }, 6500);

        return () => window.clearInterval(timer);
    }, [reduce, moreOpen, promotionHovered, promotionFocused]);

    const resting = links.find((l) => l.active)?.href ?? (moreActive ? "more" : null);
    const highlighted = moreOpen ? "more" : (hovered ?? resting);

    const pill = (
        <motion.span
            layoutId="nav-highlight"
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full bg-white/[0.1] ring-1 ring-inset ring-white/[0.08]"
            transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.3, bounce: 0 }}
        />
    );
    const itemClass = (on: boolean) =>
        cn(
            "relative isolate inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium whitespace-nowrap outline-none transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-white/40",
            on ? "text-white" : "text-white/60 hover:text-white",
        );

    return (
        <nav
            onMouseLeave={() => setHovered(null)}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered(null);
            }}
            className="flex items-center gap-0.5"
        >
            {links.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    onMouseEnter={() => setHovered(link.href)}
                    onFocus={() => setHovered(link.href)}
                    aria-current={link.active ? "page" : undefined}
                    className={itemClass(link.active || highlighted === link.href)}
                >
                    {highlighted === link.href && pill}
                    {link.label}
                </Link>
            ))}

            <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
                <DropdownMenuTrigger
                    onMouseEnter={() => setHovered("more")}
                    className={itemClass(moreActive || highlighted === "more")}
                >
                    {highlighted === "more" && pill}
                    {t("moreMenu")}
                    <ChevronDown
                        className={cn(
                            "h-3.5 w-3.5 opacity-60 transition-transform duration-150 ease-out",
                            moreOpen && "rotate-180",
                        )}
                        aria-hidden
                    />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="center"
                    sideOffset={14}
                    className="grid w-[600px] grid-cols-[minmax(0,1fr)_220px] gap-2 rounded-2xl border-slate-200/80 p-2 shadow-2xl shadow-slate-900/15"
                >
                    <div className="grid gap-0.5">
                        {MORE.map(({ key, href, Icon }) => {
                            const on = isActive(href);
                            return (
                                <DropdownMenuItem key={key} asChild className="p-0 focus:bg-transparent">
                                    <Link
                                        href={href}
                                        className="group flex cursor-pointer items-start gap-3 rounded-xl p-2.5 transition-colors duration-150 ease-out hover:bg-slate-50 focus:bg-slate-50"
                                    >
                                        <span
                                            className={cn(
                                                "grid h-9 w-9 flex-none place-items-center rounded-lg ring-1 transition-colors duration-150 ease-out",
                                                on
                                                    ? "bg-market-navy text-white ring-market-navy"
                                                    : "bg-white text-market-navy ring-slate-200 group-hover:ring-market-or/60",
                                            )}
                                        >
                                            <Icon className="h-4 w-4" aria-hidden />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-[13px] font-semibold text-market-navy">
                                                {t(key)}
                                            </span>
                                            <span className="mt-0.5 block text-[12px] leading-snug text-slate-500">
                                                {t(`moreDesc.${key}`)}
                                            </span>
                                        </span>
                                    </Link>
                                </DropdownMenuItem>
                            );
                        })}
                    </div>

                    {/* Featured Premium destination */}
                    <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                        <Link
                            href="/pricing"
                            onMouseEnter={() => setPromotionHovered(true)}
                            onMouseLeave={() => setPromotionHovered(false)}
                            onFocus={() => setPromotionFocused(true)}
                            onBlur={() => setPromotionFocused(false)}
                            aria-label={`${t("featured.title")}. ${t("featured.body")}`}
                            className="group relative isolate flex min-h-[300px] cursor-pointer flex-col items-start justify-end gap-0 overflow-hidden rounded-xl bg-market-navy p-4 text-white"
                        >
                            <span className="absolute inset-0 -z-20">
                                <AnimatePresence initial={false} mode="sync">
                                    <motion.span
                                        key={PROMOTION_IMAGES[promotionIndex]}
                                        className="absolute inset-0"
                                        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: reduce ? 0.15 : 0.9, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        <Image
                                            src={PROMOTION_IMAGES[promotionIndex]}
                                            alt=""
                                            fill
                                            sizes="220px"
                                            className="object-cover"
                                        />
                                    </motion.span>
                                </AnimatePresence>
                            </span>
                            <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-slate-950/20" />

                            <span className="absolute inset-x-4 top-4 flex items-center justify-between">
                                <span className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-slate-950/30 text-market-or backdrop-blur-sm">
                                    <Crown className="h-4 w-4 text-market-or-light" aria-hidden />
                                </span>
                                <span className="flex items-center gap-1.5" aria-hidden>
                                    {PROMOTION_IMAGES.map((image, index) => (
                                        <span
                                            key={image}
                                            className={`h-1.5 rounded-full transition-[width,background-color] duration-150 ${
                                                index === promotionIndex ? "w-5 bg-market-or" : "w-1.5 bg-white/65"
                                            }`}
                                        />
                                    ))}
                                </span>
                            </span>

                            <span className="block font-display text-[15px] font-bold leading-snug">
                                {t("featured.title")}
                            </span>
                            <span className="mt-1 block text-[12px] leading-snug text-white/65">
                                {t("featured.body")}
                            </span>
                            <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-market-or-light">
                                {t("featured.cta")}
                                <ArrowRight
                                    className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                                    aria-hidden
                                />
                            </span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </nav>
    );
}
