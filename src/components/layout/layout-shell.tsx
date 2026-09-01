"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import { CookieConsent } from "./cookie-consent";

interface LayoutShellProps {
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function LayoutShell({ children, footer }: LayoutShellProps) {
    const pathname = usePathname();
    const isDashboard = pathname.includes('/dashboard');
    const isAdmin = pathname.includes('/admin');
    const hideChrome = isDashboard || isAdmin;

    return (
        <>
            {!hideChrome && <Navbar />}
            {children}
            {!hideChrome && footer}
            {!hideChrome && <CookieConsent />}
        </>
    );
}
