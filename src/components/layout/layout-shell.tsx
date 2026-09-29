"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import { CookieConsent } from "./cookie-consent";

const AUTH_SEGMENTS = new Set([
    'login',
    'signup',
    'register',
    'forgot-password',
    'reset-password',
    'verify-email',
]);

interface LayoutShellProps {
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function LayoutShell({ children, footer }: LayoutShellProps) {
    const pathname = usePathname();
    const isDashboard = pathname.includes('/dashboard');
    const isAdmin = pathname.includes('/admin');
    // Routes of the (auth) group render full-screen, outside the site chrome.
    const segment = pathname.split('/')[2] ?? '';
    const isAuth = AUTH_SEGMENTS.has(segment);
    const hideChrome = isDashboard || isAdmin || isAuth;

    return (
        <>
            {!hideChrome && <Navbar />}
            {children}
            {!hideChrome && footer}
            {!hideChrome && <CookieConsent />}
        </>
    );
}
