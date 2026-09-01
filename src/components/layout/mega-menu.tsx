"use client";

import React, { useState } from "react";
import { Link } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { NAVIGATION_CONFIG, NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function MegaMenu() {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <nav className="hidden xl:flex items-center gap-1" onMouseLeave={() => setHoveredIndex(null)}>
            {NAVIGATION_CONFIG.map((item, index) => (
                <div
                    key={index}
                    className="relative"
                    onMouseEnter={() => setHoveredIndex(index)}

                >
                    <Link
                        href={item.href}
                        className={cn(
                            "group flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors rounded-sm",
                            hoveredIndex === index
                                ? "text-[#0047AB] bg-slate-50"
                                : "text-slate-600 hover:text-[#0047AB] hover:bg-slate-50"
                        )}
                    >
                        {item.title}
                        {item.items && (
                            <ChevronDown
                                className={cn(
                                    "w-4 h-4 transition-transform duration-200",
                                    hoveredIndex === index ? "rotate-180 text-[#0047AB]" : "text-slate-400 group-hover:text-[#0047AB]"
                                )}
                            />
                        )}
                    </Link>

                    <AnimatePresence>
                        {hoveredIndex === index && item.items && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute top-full left-0 pt-2 w-full min-w-[320px] z-50"
                            >
                                <div className="bg-white rounded-sm shadow-xl border border-slate-200 p-2 ring-1 ring-black/5 overflow-hidden">
                                    <div className="grid gap-1 bg-white relative z-10">
                                        {item.items.map((subItem, subIndex) => (
                                            <Link
                                                key={subIndex}
                                                href={subItem.href}
                                                className="group/item flex items-start gap-3 p-2 rounded-sm hover:bg-slate-50 transition-colors"
                                            >
                                                {subItem.icon && (
                                                    <div className="mt-0.5 p-1.5 rounded-sm bg-slate-50 text-slate-500 group-hover/item:bg-[#0047AB]/10 group-hover/item:text-[#0047AB] transition-colors border border-slate-100 group-hover/item:border-[#0047AB]/20">
                                                        <subItem.icon className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900 group-hover/item:text-[#0047AB] transition-colors leading-none mb-1">
                                                        {subItem.title}
                                                    </div>
                                                    {subItem.description && (
                                                        <p className="text-xs text-slate-500 leading-tight line-clamp-2">
                                                            {subItem.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    {/* Decorative Gradient Line */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0047AB] via-[#0047AB]/60 to-transparent opacity-20" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </nav>
    );
}
