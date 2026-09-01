"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, Handshake, Shield } from "lucide-react";

export function CTASection() {
    const t = useTranslations("CTASection");

    return (
        <section className="py-10 bg-background">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-4 items-center">
                    {/* Left: For Congolese Companies */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-primary text-primary-foreground p-4 rounded-md relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5" />

                        <div className="relative">
                            <span className="text-sm font-medium opacity-80">{t("companies.eyebrow")}</span>
                            <h3 className="text-2xl font-bold mt-2 mb-4">
                                {t("companies.title")}
                            </h3>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-center gap-2 text-sm">
                                    <Shield className="w-4 h-4 text-accent" />
                                    {t("companies.benefitVerified")}
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <Handshake className="w-4 h-4 text-accent" />
                                    {t("companies.benefitConnect")}
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <MessageSquare className="w-4 h-4 text-accent" />
                                    {t("companies.benefitInquiries")}
                                </li>
                            </ul>
                            <Button variant="secondary" asChild>
                                <Link href="/register-company">
                                    {t("companies.cta")}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>
                        </div>
                    </motion.div>

                    {/* Right: For International Buyers */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-muted p-4 rounded-md"
                    >
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("buyers.eyebrow")}
                        </span>
                        <h3 className="text-2xl font-bold mt-2 mb-4">
                            {t("buyers.title")}
                        </h3>
                        <ul className="space-y-3 mb-6">
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Shield className="w-4 h-4 text-primary" />
                                {t("buyers.benefitVerified")}
                            </li>
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Handshake className="w-4 h-4 text-primary" />
                                {t("buyers.benefitAccess")}
                            </li>
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                {t("buyers.benefitSecure")}
                            </li>
                        </ul>
                        <Button asChild>
                            <Link href="/companies">
                                {t("buyers.cta")}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
