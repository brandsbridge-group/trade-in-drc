"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/lib/search/search-context";

export function Hero() {
    const t = useTranslations("Hero");
    const { openSearch } = useSearch();

    return (
        <section className="relative min-h-[420px] max-h-[520px] flex items-center justify-center overflow-hidden">
            {/* Official Background */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('/images/official_drc_trade_hero.png')`,
                    backgroundColor: '#0F172A'
                }}
            >
                <div className="absolute inset-0 bg-slate-900/80" />
            </div>

            <div className="container relative z-10 mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-4xl mx-auto space-y-3"
                >
                    {/* Ministry Badge */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-none flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#FFD700]" />
                            <span className="text-white text-[10px] font-bold tracking-[0.2em] uppercase">
                                {t("badge")}
                            </span>
                        </div>
                    </div>

                    {/* Headline */}
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                        {t("titlePrefix")} <br />
                        <span className="text-[#FFD700]">
                            {t("titleHighlight")}
                        </span>
                    </h1>

                    <p className="text-sm md:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed">
                        {t("subtitle")}
                    </p>

                    {/* Search Bar & Actions */}
                    <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg p-1.5 rounded-md flex flex-col md:flex-row gap-2 border border-white/20">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-hover:text-white transition-colors" />
                            <div
                                onClick={openSearch}
                                className="w-full h-10 bg-white flex items-center pl-10 pr-4 rounded-md cursor-text text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                                <span className="flex-1 text-left">{t("searchPlaceholder")}</span>
                                <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-medium text-slate-400">
                                    ⌘K
                                </kbd>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            onClick={openSearch}
                            className="h-10 bg-[#0047AB] hover:bg-[#003d91] text-white px-6 text-sm rounded-md"
                        >
                            {t("searchButton")}
                        </Button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex flex-wrap justify-center gap-3 pt-2 text-sm font-medium text-slate-300">
                        <Link href="/register-company" className="hover:text-white transition-colors flex items-center gap-1">
                            {t("register")} →
                        </Link>
                        <Link href="/companies" className="hover:text-white transition-colors flex items-center gap-1">
                            {t("browse")} →
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section >
    );
}
