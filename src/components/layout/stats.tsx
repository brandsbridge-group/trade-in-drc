"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Building2, Globe, Award, TrendingUp } from "lucide-react";

export function Stats() {
    const t = useTranslations("Stats");

    const stats = [
        {
            value: "500+",
            label: t("companies"),
            description: t("companiesDesc"),
            icon: Building2,
        },
        {
            value: "10+",
            label: t("sectors"),
            description: t("sectorsDesc"),
            icon: Globe,
        },
        {
            value: "26",
            label: t("provinces"),
            description: t("provincesDesc"),
            icon: Award,
        },
        {
            value: "98%",
            label: t("successRate"),
            description: t("successRateDesc"),
            icon: TrendingUp,
        },
    ];

    return (
        <section className="py-8 bg-primary text-primary-foreground">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-6"
                >
                    <h2 className="text-xl font-bold mb-4">{t("title")}</h2>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="text-center"
                        >
                            <div className="w-8 h-8 mx-auto mb-4 bg-white/10 flex items-center justify-center">
                                <stat.icon className="w-4 h-4" />
                            </div>
                            <div className="text-xl font-bold mb-2">{stat.value}</div>
                            <div className="font-medium mb-1">{stat.label}</div>
                            <div className="text-sm opacity-80">{stat.description}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
