"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    className?: string; // Kept for flexibility, though image logic is removed
    children?: React.ReactNode;
}

export function PageHeader({
    title,
    description,
    className,
    children
}: PageHeaderProps) {
    return (
        <div className={cn("relative w-full py-20 flex items-center justify-center overflow-hidden bg-white", className)}>

            {/* Content Content */}
            <div className="relative z-10 container mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="max-w-4xl mx-auto space-y-4"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                        {title}
                    </h1>

                    {description && (
                        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-light">
                            {description}
                        </p>
                    )}

                    {children && (
                        <div className="pt-6">
                            {children}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Decorative bottom border - kept for official feel */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        </div>
    );
}
