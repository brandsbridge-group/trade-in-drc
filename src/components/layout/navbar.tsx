"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import * as React from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useSearch } from "@/lib/search/search-context";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, LayoutDashboard, Building2, Menu, Search, Shield, ShoppingCart, UserRound, ChevronRight, ChevronDown } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose,
    SheetTitle,
} from "@/components/ui/sheet";

import { createClient } from "@/lib/supabase/client";

export function Navbar() {
    const t = useTranslations("Nav");
    const [userRole, setUserRole] = React.useState<string | null>(null);
    const { user, signOut } = useAuth();
    const { openSearch } = useSearch();

    React.useEffect(() => {
        if (!user) { setUserRole(null); return; }
        const supabase = createClient();
        supabase.from('profiles').select('role').eq('id', user.id).single()
            .then(({ data }) => setUserRole(data?.role ?? null));
    }, [user]);

    // Top-level links mirror the customer marketplace design (latest-designs/1.ai).
    // Priority nav: primary links stay inline; the rest overflow into "More ▾"
    // between xl and 2xl, and go fully inline again at 2xl. (See navbar spec.)
    // Order and split come from the customer's 2026-07-28 sketch: four primary
    // links, the rest under "More". The responsive behaviour is unchanged —
    // "More" only appears once the bar is too narrow for all ten.
    const primaryLinks = [
        { href: "/", label: t("home") },
        { href: "/data-hub", label: t("marketIntelligence") },
        { href: "/opportunities", label: t("opportunities") },
        { href: "/market", label: t("marketplace") },
    ];
    const overflowLinks = [
        { href: "/companies", label: t("companies") },
        { href: "/local-contacts", label: t("contactPoints") },
        { href: "/services", label: t("services") },
        { href: "/events", label: t("events") },
        { href: "/pricing", label: t("promote") },
        { href: "/contact", label: t("contact") },
    ];
    const navLinks = [...primaryLinks, ...overflowLinks];

    const pathname = usePathname();
    const overflowActive = overflowLinks.some(
        (l) => pathname === l.href || pathname.startsWith(l.href + "/")
    );
    // Compact type + tight padding so ten links, the CTAs and a signed-in
    // avatar all fit without squeezing the logo.
    const navLinkClass =
        "text-[13px] font-medium text-white/80 transition-colors hover:text-white px-2 py-2 relative group whitespace-nowrap";
    const navUnderline = (
        <span className="absolute bottom-1 left-2 right-2 h-0.5 bg-market-red scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200 ease-out" />
    );

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-market-navy text-white">
            <div className="w-full flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
                {/* Logo */}
                <div className="flex min-w-0 items-center gap-3 lg:gap-4">
                    <Link href="/" className="flex shrink-0 items-center">
                        <Logo size="md" />
                    </Link>

                    {/* Desktop Nav — priority + "More" overflow (no JS measuring):
                        primary links always inline (xl+); overflow links inline only
                        at 2xl; a "More ▾" dropdown holds them between xl and 2xl. */}
                    <nav className="hidden xl:flex items-center gap-1">
                        {primaryLinks.map((link) => (
                            <Link key={link.href} href={link.href} className={navLinkClass}>
                                {link.label}
                                {navUnderline}
                            </Link>
                        ))}

                        {/* Overflow links — inline only on wide (2xl) screens */}
                        {overflowLinks.map((link) => (
                            <Link key={link.href} href={link.href} className={`hidden 2xl:inline-flex ${navLinkClass}`}>
                                {link.label}
                                {navUnderline}
                            </Link>
                        ))}

                        {/* "More ▾" — shown only between xl and 2xl */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className={`inline-flex 2xl:hidden items-center gap-1 ${navLinkClass} ${overflowActive ? "text-white" : ""}`}
                                >
                                    {t("moreMenu")}
                                    <ChevronDown className="h-4 w-4" aria-hidden />
                                    {overflowActive && (
                                        <span className="absolute bottom-1 left-3 right-6 h-0.5 bg-market-red" />
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                                {overflowLinks.map((link) => (
                                    <DropdownMenuItem key={link.href} asChild>
                                        <Link href={link.href} className="cursor-pointer">
                                            {link.label}
                                        </Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav>
                </div>

                {/* Right Side — one vertically-centered row, aligned with the nav links. */}
                <div className="flex shrink-0 items-center gap-1.5">
                    {/* Search Bar - Desktop */}
                    <div className="hidden md:flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={openSearch}
                            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                            aria-label={t("search")}
                        >
                            <Search className="w-4 h-4" />
                        </Button>
                    </div>

                    <LanguageSwitcher />

                    {/* CTA pair — always visible, exactly as in the design */}
                    <div className="hidden lg:flex items-center gap-1.5">
                        <Button asChild variant="outline" size="sm" className="h-8 shrink-0 whitespace-nowrap rounded-lg border border-white/80 bg-transparent px-2.5 text-[11.5px] text-white hover:bg-white/10 hover:text-white font-semibold">
                            <Link href="/register-company"><UserRound className="h-3.5 w-3.5" /> {t("registerCompany")}</Link>
                        </Button>
                        <Button asChild size="sm" className="h-8 shrink-0 whitespace-nowrap rounded-lg bg-market-red px-2.5 text-[11.5px] text-white hover:bg-market-red-dark font-semibold">
                            <Link href="/request"><ShoppingCart className="h-3.5 w-3.5" /> {t("postRequest")}</Link>
                        </Button>
                    </div>

                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 shrink-0 rounded-full p-0">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary text-primary-foreground text-[11px]">
                                            {user.email?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <div className="flex items-center gap-2 p-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                            {user.email?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <p className="text-sm font-medium truncate max-w-[160px]">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard" className="cursor-pointer">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        {t("dashboard")}
                                    </Link>
                                </DropdownMenuItem>
                                {userRole === 'admin' && (
                                    <>
                                        <DropdownMenuItem asChild>
                                            <Link href="/admin" className="cursor-pointer">
                                                <Shield className="mr-2 h-4 w-4" />
                                                {t("adminPanel")}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                <DropdownMenuItem asChild>
                                    <Link href="/register-company" className="cursor-pointer">
                                        <Building2 className="mr-2 h-4 w-4" />
                                        {t("register")}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    {t("signout")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="hidden sm:flex items-center">
                            <Button asChild variant="ghost" size="sm" className="h-8 px-3 text-xs text-white/80 hover:text-white hover:bg-white/10">
                                <Link href="/login">{t("signin")}</Link>
                            </Button>
                        </div>
                    )}

                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger asChild className="xl:hidden">
                            <Button variant="ghost" size="icon">
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
                                {/* Search */}
                                <div className="relative mb-5">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder={t("search")}
                                        className="h-11 w-full rounded-lg pl-9"
                                    />
                                </div>

                                {/* Nav links — same set as desktop */}
                                <nav className="flex flex-col">
                                    {navLinks.map((link) => (
                                        <SheetClose asChild key={link.href}>
                                            <Link
                                                href={link.href}
                                                className="flex items-center justify-between border-b border-slate-100 py-3.5 text-[0.95rem] font-semibold text-market-navy transition-colors hover:text-market-red"
                                            >
                                                {link.label}
                                                <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden />
                                            </Link>
                                        </SheetClose>
                                    ))}
                                </nav>

                                {/* CTAs */}
                                <div className="mt-5 flex flex-col gap-2.5">
                                    <SheetClose asChild>
                                        <Button asChild variant="outline" className="w-full border-market-navy/30 font-semibold text-market-navy">
                                            <Link href="/register-company"><UserRound className="h-4 w-4" /> {t("registerCompany")}</Link>
                                        </Button>
                                    </SheetClose>
                                    <SheetClose asChild>
                                        <Button asChild className="w-full bg-market-red font-semibold text-white hover:bg-market-red-dark">
                                            <Link href="/request"><ShoppingCart className="h-4 w-4" /> {t("postRequest")}</Link>
                                        </Button>
                                    </SheetClose>
                                    {!user && (
                                        <SheetClose asChild>
                                            <Button asChild variant="ghost" className="w-full text-market-navy">
                                                <Link href="/login">{t("signin")}</Link>
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
