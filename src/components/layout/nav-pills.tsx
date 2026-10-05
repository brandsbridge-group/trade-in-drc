"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import {
    ArrowRight,
    CalendarDays,
    ChevronDown,
    Handshake,
    Info,
    Mail,
    MapPinned,
    Megaphone,
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

/**
 * Desktop nav — frameless links with one highlight pill that glides to the
 * hovered item and rests on the active page (MOTION.md §2.9). "More" opens a panel:
 * five destinations with icons + one-line descriptions, and a featured
 * "Promote your company" card.
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

                    {/* Featured: promote */}
                    <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                        <Link
                            href="/pricing"
                            className="group relative isolate flex cursor-pointer flex-col items-start justify-end gap-0 overflow-hidden rounded-xl bg-market-navy p-4 text-white"
                        >
                            <span
                                aria-hidden
                                className="absolute -right-10 -top-10 -z-10 h-36 w-36 rounded-full bg-market-or/25 blur-2xl"
                            />
                            <span
                                aria-hidden
                                className="absolute -bottom-12 -left-8 -z-10 h-32 w-32 rounded-full bg-primary/40 blur-2xl"
                            />
                            <Megaphone className="mb-auto h-5 w-5 text-market-or" aria-hidden />
                            <span className="mt-8 block font-display text-[15px] font-bold leading-snug">
                                {t("promote")}
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
