"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import * as React from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { Menu, Shield, ChevronRight, Plus } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose,
    SheetTitle,
} from "@/components/ui/sheet";

import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/constants/routes";
import { isAdmin } from "@/constants/roles";
import { NavPills } from "./nav-pills";
import { AccountMenu } from "./account-menu";

/** True once the page has scrolled a little — the bar turns to glass. */
function useScrolled(threshold = 8) {
    return React.useSyncExternalStore(
        (onChange) => {
            window.addEventListener("scroll", onChange, { passive: true });
            return () => window.removeEventListener("scroll", onChange);
        },
        () => window.scrollY > threshold,
        () => false,
    );
}


export function Navbar() {
    const t = useTranslations("Nav");
    // Staff (super-admin / moderator) only see the console entry; company-area
    // links would bounce them back there anyway (proxy.ts).
    const [isStaff, setIsStaff] = React.useState(false);
    const { user, signOut } = useAuth();

    React.useEffect(() => {
        if (!user) { setIsStaff(false); return; }
        const supabase = createClient();
        supabase.from('profiles').select('role, staff_role, account_type').eq('id', user.id).single()
            .then(({ data }) => setIsStaff(isAdmin(data)));
    }, [user]);

    // Five primary links inline from xl; the secondary ones always live under
    // "More ▾" (the pill spacing doesn't leave room for all ten inline).
    // Order (2026-09-29): Home · Marketplace · Opportunities · Data · Companies.
    // `match` lists the extra path prefixes that light the link up.
    const primaryLinks = [
        { href: "/", label: t("home") },
        { href: "/market", label: t("marketplace"), match: ["/products"] },
        { href: "/opportunities", label: t("opportunities") },
        { href: "/data-hub", label: t("data") },
        { href: "/companies", label: t("companies") },
    ];
    const overflowLinks = [
        { href: "/about", label: t("about") },
        { href: "/local-contacts", label: t("contactPoints") },
        { href: "/services", label: t("services") },
        { href: "/events", label: t("events") },
        { href: "/pricing", label: t("promote") },
        { href: "/contact", label: t("contact") },
    ];
    const navLinks = [...primaryLinks, ...overflowLinks];

    const pathname = usePathname();
    const isActive = (link: { href: string; match?: string[] }) =>
        link.href === "/"
            ? pathname === "/"
            : [link.href, ...(link.match ?? [])].some(
                  (p) => pathname === p || pathname.startsWith(p + "/")
              );
    const overflowActive = overflowLinks.some(isActive);
    const scrolled = useScrolled();

    return (
        // Glassmorphism that keeps the brand navy on every page and scroll
        // position: solid at the top (only the white page is behind the bar
        // there, which would wash a translucent tint out to grey), then a 98.5 %
        // navy tint + blur, so even over white content the colour holds —
        // just a frosted hint of what passes beneath, and a soft shadow.
        <header
            className={`sticky top-0 z-50 w-full text-white backdrop-blur-2xl backdrop-saturate-[1.8] transition-shadow duration-200 ease-out ${
                scrolled
                    ? "bg-market-navy/[0.985] shadow-[0_8px_32px_-8px_rgba(2,6,23,0.45)]"
                    : "bg-market-navy"
            }`}
        >
            {/* Glass sheen: a faint top-lit gradient + a hairline catching the light. */}
            <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent" />
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <div className="relative flex h-16 w-full items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
                {/* Left: logo, then the nav right after it (xl+) — sliding highlight + "More" panel. */}
                <div className="flex min-w-0 items-center gap-6 xl:gap-12">
                    <Link href="/" className="flex shrink-0 items-center">
                        <Logo size="md" />
                    </Link>
                    <div className="hidden xl:block">
                        <NavPills
                            links={primaryLinks.map((l) => ({ href: l.href, label: l.label, active: isActive(l) }))}
                            moreActive={overflowActive}
                            isActive={(href) => isActive({ href })}
                        />
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex shrink-0 items-center gap-1.5">
                    <LanguageSwitcher />

                    {user ? (
                        <AccountMenu user={user} signOut={signOut} />
                    ) : (
                        <div className="hidden sm:flex items-center">
                            <Button asChild variant="ghost" size="sm" className="h-8 rounded-full px-3 text-[12px] font-medium text-white/80 hover:bg-white/10 hover:text-white">
                                <Link href="/login">{t("signin")}</Link>
                            </Button>
                        </div>
                    )}

                    {/* Primary CTA — marketplace gold, lit top edge. It opens the public
                        "post a need" form (/request): no account needed, so a visitor is
                        never sent through /login first. Hidden for staff, who handle the
                        needs in the console rather than post them. */}
                    {!isStaff && <Link
                        href={ROUTES.REQUEST}
                        className="group hidden h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-market-or px-3.5 text-[12px] font-bold text-market-navy transition-colors duration-150 ease-out hover:bg-market-or-light active:bg-market-or-dark sm:inline-flex"
                    >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                        {t("publishNeed")}
                    </Link>}

                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger asChild className="xl:hidden">
                            <Button variant="ghost" size="icon" aria-label={t("menu")} className="h-9 w-9 rounded-full text-white hover:bg-white/10 hover:text-white">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[86%] max-w-sm overflow-y-auto p-0">
                            {/* Navy header with logo */}
                            <div className="bg-market-navy px-5 py-4">
                                <SheetTitle className="sr-only">{t("menu")}</SheetTitle>
                                <SheetClose asChild>
                                    <Link href="/" className="inline-flex items-center">
                                        <Logo size="sm" />
                                    </Link>
                                </SheetClose>
                            </div>

                            <div className="flex flex-col p-5">
                                {/* Nav links — same set as desktop */}
                                <nav className="flex flex-col">
                                    {navLinks.map((link) => {
                                        const active = isActive(link);
                                        return (
                                            <SheetClose asChild key={link.href}>
                                                <Link
                                                    href={link.href}
                                                    aria-current={active ? "page" : undefined}
                                                    className={`flex items-center justify-between rounded-xl px-3 py-3 text-[14px] transition-colors duration-150 ease-out ${active ? "bg-slate-100 font-semibold text-market-navy" : "font-medium text-slate-700 hover:bg-slate-50 hover:text-market-navy"}`}
                                                >
                                                    {link.label}
                                                    <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden />
                                                </Link>
                                            </SheetClose>
                                        );
                                    })}
                                </nav>

                                <div className="mt-5 flex flex-col gap-2.5">
                                    {!user && (
                                        <SheetClose asChild>
                                            <Button asChild className="w-full rounded-xl bg-market-navy font-semibold text-white hover:bg-market-navy/90">
                                                <Link href="/login">{t("signin")}</Link>
                                            </Button>
                                        </SheetClose>
                                    )}
                                    {isStaff ? (
                                        <SheetClose asChild>
                                            <Button asChild className="w-full rounded-xl bg-market-navy font-semibold text-white hover:bg-market-navy/90">
                                                <Link href={ROUTES.CONSOLE}>
                                                    <Shield className="h-4 w-4" aria-hidden />
                                                    {t("adminPanel")}
                                                </Link>
                                            </Button>
                                        </SheetClose>
                                    ) : (
                                        <SheetClose asChild>
                                            <Button asChild className="w-full rounded-xl bg-market-or font-bold text-market-navy hover:bg-market-or-light active:bg-market-or-dark">
                                                <Link href={ROUTES.REQUEST}>
                                                    <Plus className="h-4 w-4" aria-hidden />
                                                    {t("publishNeed")}
                                                </Link>
                                            </Button>
                                        </SheetClose>
                                    )}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
