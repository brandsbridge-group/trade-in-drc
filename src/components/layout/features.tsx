"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Users, BarChart3 } from "lucide-react";

export function Features() {
    const t = useTranslations("Features");

    const features = [
        {
            title: t("verification"),
            description: t("verificationDesc"),
            icon: CheckCircle,
        },
        {
            title: t("matchmaking"),
            description: t("matchmakingDesc"),
            icon: Users,
        },
        {
            title: t("export"),
            description: t("exportDesc"),
            icon: BarChart3,
        },
    ];

    return (
        <section className="py-10 bg-muted/50">
            <div className="container px-4 mx-auto">
                <h2 className="text-xl font-bold text-center mb-6 md:text-2xl">
                    {t("title")}
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                        >
                            <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="w-8 h-8 bg-primary/10 flex items-center justify-center mb-4">
                                        <feature.icon className="w-4 h-4 text-primary" />
                                    </div>
                                    <CardTitle>{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base">
                                        {feature.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
