"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, CornerDownLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchRegistry, SearchCategory } from "@/lib/search/search-registry";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const t = useTranslations("Search");
    const { query, setQuery, groupedItems, handleSelect } = useSearchRegistry(() => onOpenChange(false));
    const [activeIndex, setActiveIndex] = React.useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Flatten items for keyboard navigation
    const flatItems = React.useMemo(() => {
        return Object.values(groupedItems).flat();
    }, [groupedItems]);

    // Reset active index when query changes
    React.useEffect(() => {
        setActiveIndex(0);
    }, [query]);

    // Focus input when opened
    React.useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery(""); // Reset query on close
        }
    }, [open, setQuery]);

    // Keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!open) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) => (prev + 1) % flatItems.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (flatItems[activeIndex]) {
                    handleSelect(flatItems[activeIndex]);
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                onOpenChange(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, flatItems, activeIndex, handleSelect, onOpenChange]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                        className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm"
                    />

                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-[100] px-4"
                    >
                        <div className="bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[60vh]">
                            {/* Header */}
                            <div className="flex items-center border-b border-slate-100 px-4 py-3 gap-3">
                                <Search className="w-5 h-5 text-slate-400" />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={t("typeToSearch")}
                                    className="flex-1 bg-transparent border-0 outline-none text-lg placeholder:text-slate-400 text-slate-900 h-8"
                                />
                                <div className="flex items-center gap-2">
                                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-medium text-slate-500 uppercase">
                                        {t("keyEsc")}
                                    </kbd>
                                    <button onClick={() => onOpenChange(false)} aria-label={t("close")} className="sm:hidden text-slate-400">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Results */}
                            <div className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                {flatItems.length === 0 ? (
                                    <div className="py-12 text-center text-slate-500">
                                        <p>{t("noResultsFor", { query })}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {(Object.keys(groupedItems) as SearchCategory[]).map((category) => {
                                            const items = groupedItems[category];
                                            if (!items?.length) return null;

                                            return (
                                                <div key={category}>
                                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                                                        {t(`categories.${category}`)}
                                                    </h3>
                                                    <div className="space-y-1">
                                                        {items.map((item) => {
                                                            const isSelected = flatItems[activeIndex]?.id === item.id;
                                                            return (
                                                                <button
                                                                    key={item.id}
                                                                    onClick={() => handleSelect(item)}
                                                                    onMouseEnter={() => setActiveIndex(flatItems.indexOf(item))}
                                                                    className={cn(
                                                                        "w-full flex items-center gap-3 px-3 py-3 rounded-md text-left transition-colors group",
                                                                        isSelected ? "bg-[#0047AB] text-white" : "hover:bg-slate-50 text-slate-700"
                                                                    )}
                                                                >
                                                                    <div className={cn(
                                                                        "p-2 rounded-sm",
                                                                        isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                                                                    )}>
                                                                        {item.icon && <item.icon className="w-4 h-4" />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-medium flex items-center gap-2">
                                                                            {item.title}
                                                                            {item.shortcut && (
                                                                                <div className="flex gap-1">
                                                                                    {item.shortcut.map(key => (
                                                                                        <kbd key={key} className={cn(
                                                                                            "text-[10px] px-1.5 py-0.5 rounded border font-sans",
                                                                                            isSelected ? "bg-white/20 border-white/20 text-white" : "bg-slate-100 border-slate-200 text-slate-500"
                                                                                        )}>
                                                                                            {key}
                                                                                        </kbd>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {item.description && (
                                                                            <p className={cn(
                                                                                "text-xs truncate mt-0.5",
                                                                                isSelected ? "text-blue-100" : "text-slate-500"
                                                                            )}>
                                                                                {item.description}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    {isSelected && (
                                                                        <CornerDownLeft className="w-4 h-4 text-white/70 animate-pulse" />
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex items-center gap-4 text-[10px] text-slate-400">
                                <span className="flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3" /> {t("hintSelect")}
                                </span>
                                <span className="flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3 rotate-90" /> {t("hintNavigate")}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="font-mono">{t("keyEsc")}</span> {t("close")}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
