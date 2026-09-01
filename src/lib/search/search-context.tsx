"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CommandPalette } from "@/components/search/command-palette";

interface SearchContextType {
    isOpen: boolean;
    openSearch: () => void;
    closeSearch: () => void;
    toggleSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const openSearch = useCallback(() => setIsOpen(true), []);
    const closeSearch = useCallback(() => setIsOpen(false), []);
    const toggleSearch = useCallback(() => setIsOpen((prev) => !prev), []);

    // Global keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                toggleSearch();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSearch]);

    return (
        <SearchContext.Provider value={{ isOpen, openSearch, closeSearch, toggleSearch }}>
            {children}
            <CommandPalette open={isOpen} onOpenChange={setIsOpen} />
        </SearchContext.Provider>
    );
}

export function useSearch() {
    const context = useContext(SearchContext);
    if (context === undefined) {
        throw new Error("useSearch must be used within a SearchProvider");
    }
    return context;
}
