"use client";

import { useTranslations } from "next-intl";
import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

interface Offer {
    id: string;
    type: "searching" | "opportunity";
    date: string;
    title: string;
    description: string;
    author: string;
    location: string;
}

// Mock data - will be replaced with API data
const mockOffers: Offer[] = [
    {
        id: "1",
        type: "searching",
        date: "2024.01.15",
        title: "Looking For Electronics",
        description: "Seeking suppliers for smartphones and accessories in large quantities for retail distribution.",
        author: "John Doe",
        location: "Kinshasa, DRC",
    },
    {
        id: "2",
        type: "opportunity",
        date: "2024.01.12",
        title: "Export Opportunity: Agricultural Products",
        description: "We have established export channels for coffee and cocoa. Looking for reliable suppliers.",
        author: "Marie Claire",
        location: "Lubumbashi, DRC",
    },
    {
        id: "3",
        type: "opportunity",
        date: "2024.01.12",
        title: "Need IT Equipment for Office Setup",
        description: "Setting up a new office and need computers, printers, and networking equipment.",
        author: "Tech Solutions Ltd",
        location: "Goma, DRC",
    },
];

// Animation variants — Emil rules: no bounce on workhorse, ≤300 ms, stagger ≤0.05
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};

const cardVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 20,
        scale: 0.98,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.2,
            ease: "easeOut",
        },
    },
};

const titleVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.2,
            ease: "easeOut",
        },
    },
};

function OfferCard({ offer, index }: { offer: Offer; index: number }) {
    const t = useTranslations("LatestOffers");
    const colors = {
        searching: {
            badge: "bg-[#0047AB]",
            button: "bg-[#0047AB] hover:bg-[#003d91]",
            title: "text-[#0047AB]",
        },
        opportunity: {
            badge: "bg-[#F7D618]",
            button: index === 1 ? "bg-[#CE1021] hover:bg-[#b30e1c]" : "bg-[#F7D618] hover:bg-[#e5c516] text-foreground",
            title: "text-[#F7D618]",
        },
    };

    const style = colors[offer.type];

    return (
        <motion.div
            variants={cardVariants}
            whileHover={{
                y: -4,
                transition: { duration: 0.15, ease: "easeOut" },
            }}
            whileTap={{ scale: 0.98 }}
            className="bg-white border shadow-sm rounded-sm flex flex-col cursor-pointer overflow-hidden"
        >
            {/* Header Badge */}
            <div className={`${style.badge} px-4 py-2 flex justify-between items-center`}>
                <span className="text-sm font-bold uppercase text-white">
                    {offer.type === "searching" ? t("badgeSearching") : t("badgeOpportunity")}
                </span>
                <span className="text-sm text-white/90">{offer.date}</span>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                <h3 className={`text-lg font-bold mb-2 ${offer.type === "searching" ? "text-[#0047AB]" : "text-[#F7D618]"}`}>
                    {offer.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 flex-1">
                    {offer.description}
                </p>
                <p className="text-sm text-foreground mb-4">
                    <span className="font-semibold">{offer.author}</span> {offer.location}
                </p>
                <Button
                    size="sm"
                    className={`w-fit ${style.button} text-white`}
                >
                    {t("contact", { name: offer.author.split(" ")[0] })}
                </Button>
            </div>
        </motion.div>
    );
}

export function LatestOffers() {
    const t = useTranslations("LatestOffers");

    return (
        <section className="py-12 bg-background overflow-hidden">
            <div className="container max-w-7xl mx-auto px-4">
                {/* Section Title with animation */}
                <motion.h2
                    variants={titleVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="text-3xl font-bold text-center mb-8"
                >
                    {t.rich("heading", {
                        accent: (chunks) => <span className="text-[#0047AB]">{chunks}</span>,
                    })}
                </motion.h2>

                {/* Offers Grid with staggered animation */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
                >
                    {mockOffers.map((offer, index) => (
                        <OfferCard key={offer.id} offer={offer} index={index} />
                    ))}
                </motion.div>

                {/* View All Button */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.2, ease: "easeOut", delay: 0.15 }}
                    className="flex justify-center"
                >
                    <Button
                        asChild
                        className="bg-[#0047AB] hover:bg-[#003d91] px-8 rounded-sm shadow-md transition-colors"
                    >
                        <Link href="/opportunities">
                            {t("viewAll")}
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}
