"use client";

import * as React from "react";
import { ConsoleSidebar, MobileConsoleBar } from "@/components/console/sidebar";
import { ConsoleTopbar } from "@/components/console/topbar";

export default function AdminLayoutClient({
    children,
    isSuperAdmin,
}: {
    children: React.ReactNode;
    isSuperAdmin: boolean;
}) {
    // Same shell as the company dashboard: soft grey canvas + white cards.
    // `console-surface` restyles shadcn cards and tables for every console page (globals.css).
    return (
        <div className="min-h-screen bg-slate-100 md:flex">
            <MobileConsoleBar isSuperAdmin={isSuperAdmin} />
            <ConsoleSidebar isSuperAdmin={isSuperAdmin} />
            <div className="flex min-w-0 flex-1 flex-col">
                <ConsoleTopbar isSuperAdmin={isSuperAdmin} />
                <main className="console-surface min-w-0 flex-1 px-4 pb-10 pt-4 md:px-6 md:pt-2">
                    <div className="mx-auto max-w-[1320px]">{children}</div>
                </main>
            </div>
        </div>
    );
}
