"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  id?: string;
  className?: string;
}

/**
 * Searchable single-select for long option lists (e.g. the full country list).
 * Opening the panel auto-focuses the search box so the user can type immediately;
 * the list filters case-insensitively and Enter picks the top match. Self-
 * contained (no cmdk/Popover dependency), keyboard- and pointer-accessible, and
 * deliberately low-motion for a government surface — the panel just appears.
 */
export function CountryCombobox({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  id,
  className,
}: CountryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus the search field whenever the panel opens (and reset the query).
  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  // Close when clicking outside the component.
  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [query, options]);

  function select(option: string) {
    onChange(option);
    setOpen(false);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[0]) select(filtered[0]);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {value || placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
          <div className="flex items-center gap-2 border-b border-border px-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder={searchPlaceholder}
              role="combobox"
              aria-expanded={open}
              aria-autocomplete="list"
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul role="listbox" className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </li>
            ) : (
              filtered.map((option) => {
                const selected = option === value;
                return (
                  <li key={option} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => select(option)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-sm px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        selected && "bg-accent/60 font-medium",
                      )}
                    >
                      <span className="truncate">{option}</span>
                      {selected && (
                        <Check className="ml-2 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
