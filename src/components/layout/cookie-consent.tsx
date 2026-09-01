"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function CookieConsent() {
    const t = useTranslations("CookieConsent");
    const tFooter = useTranslations("Footer");
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        // Check if user has already consented
        const consented = localStorage.getItem("cookie-consent");
        if (!consented) {
            // Show banner after a short delay
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookie-consent", "accepted");
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem("cookie-consent", "declined");
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: "100%", filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: "100%", filter: "blur(2px)", transition: { duration: 0.2 } }}
                    transition={{ type: "spring", duration: 0.45, bounce: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-[100]"
                >
                    {/* Floating card only — no full-width background bar behind it. */}
                    <div className="container mx-auto px-4 py-4 md:py-5">
                        <div className="bg-[#0F172A] border border-white/10 text-white p-6 rounded-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">

                            {/* Text Content */}
                            <div className="flex items-center gap-4 text-center md:text-left flex-1">
                                <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/5 shrink-0 border border-white/10">
                                    <Cookie className="w-5 h-5 text-[#FFD700]" />
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                                    {t("text")}{" "}
                                    <Link href="/cookies" className="text-white underline underline-offset-4 hover:text-[#3B9FFF] transition-colors">
                                        {tFooter("cookies")}
                                    </Link>.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                                <Button
                                    variant="ghost"
                                    onClick={handleDecline}
                                    className="flex-1 md:flex-none text-slate-400 hover:text-white hover:bg-white/10"
                                >
                                    {t("decline")}
                                </Button>
                                <Button
                                    onClick={handleAccept}
                                    className="flex-1 md:flex-none bg-[#0047AB] hover:bg-[#003d91] text-white px-8 font-medium shadow-lg shadow-blue-900/20"
                                >
                                    {t("accept")}
                                </Button>
                                {/* Mobile Close X */}
                                <button
                                    onClick={handleDecline}
                                    className="md:hidden p-2 text-slate-500 hover:text-white absolute top-2 right-2"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
