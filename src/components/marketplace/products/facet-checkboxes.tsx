"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, ChevronDown } from "lucide-react";

import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const COLLAPSED_COUNT = 6;

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

/**
 * One sidebar facet: a checkbox list stored in the URL as a comma-separated
 * param (`?from=China,India`), so filtered views stay shareable. Toggling
 * merges into the current query string and never touches the scroll position.
 *
 * Minimal styling: the group heading folds the list; rows are borderless with
 * a soft hover tint and a custom navy check box (the native input stays in the
 * DOM, visually hidden, for keyboard + screen readers).
 */
export function FacetCheckboxes({
  param,
  legend,
  icon,
  options,
}: {
  param: string;
  legend: string;
  icon?: ReactNode;
  options: FacetOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const t = useTranslations("MarketProducts.filters");

  const selected = new Set((searchParams.get(param) ?? "").split(",").filter(Boolean));
  // Long lists collapse, but a checked option is never hidden.
  const visible = expanded
    ? options
    : options.filter((o, i) => i < COLLAPSED_COUNT || selected.has(o.value));
  const hiddenCount = options.length - visible.length;

  function toggle(value: string) {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);

    const params = new URLSearchParams(searchParams.toString());
    if (next.size === 0) params.delete(param);
    else params.set(param, [...next].join(","));
    const qs = params.toString();

    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  if (options.length === 0) return null;

  return (
    <fieldset aria-busy={pending} className="py-4 first:pt-0">
      <legend className="contents">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={listId}
          className="group flex w-full items-center gap-2 text-left text-[13px] font-semibold text-[var(--color-landing-navy)]"
        >
          <span className="text-slate-400 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
          <span className="flex-1">{legend}</span>
          {selected.size > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--color-landing-navy)] px-1.5 text-[10px] font-bold tabular-nums text-white">
              {selected.size}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform duration-150 ease-out group-hover:text-slate-600",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </legend>

      <div id={listId} hidden={!open}>
        <ul className="-mx-2 mt-2.5 space-y-0.5">
          {visible.map((o) => {
            const id = `facet-${param}-${o.value}`;
            const on = selected.has(o.value);
            return (
              <li key={o.value}>
                <label
                  htmlFor={id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-150 ease-out hover:bg-slate-100"
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(o.value)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "grid h-4 w-4 flex-none place-items-center rounded-[5px] ring-1 transition-colors duration-150 ease-out peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50",
                      on
                        ? "bg-[var(--color-landing-navy)] text-white ring-[var(--color-landing-navy)]"
                        : "bg-white ring-slate-300",
                    )}
                  >
                    {on && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[13px]",
                      on ? "font-semibold text-[var(--color-landing-navy)]" : "text-slate-600",
                    )}
                  >
                    {o.label}
                  </span>
                  <span className="flex-none text-[11px] tabular-nums text-slate-400">{o.count}</span>
                </label>
              </li>
            );
          })}
        </ul>
        {(hiddenCount > 0 || expanded) && options.length > COLLAPSED_COUNT && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="mt-1.5 text-[12px] font-semibold text-slate-500 underline-offset-4 transition-colors duration-150 ease-out hover:text-[var(--color-landing-navy)] hover:underline"
          >
            {expanded ? t("showLess") : t("showMore", { count: hiddenCount })}
          </button>
        )}
      </div>
    </fieldset>
  );
}
