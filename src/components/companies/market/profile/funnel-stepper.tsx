import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const STEP_KEYS = ["step1", "step2", "step3", "step4"] as const;
const ACTIVE_INDEX = 2; // "Company Profile" is step 3 (zero-based index 2).

/**
 * Four-step funnel breadcrumb (customer design 5, top band). Step 3 "Company
 * Profile" is the active navy segment; steps to its left are visited, to its
 * right upcoming. Chevrons are drawn with an inline SVG separator so the row
 * reads as a directional flow. Purely presentational.
 */
export function FunnelStepper() {
  const t = useTranslations("CompanyProfile");

  return (
    <nav
      aria-label={t("stepper.label")}
      className="rounded-lg border border-market-navy/10 bg-white px-3 py-2.5 shadow-sm"
    >
      <ol className="flex items-center gap-1 overflow-x-auto text-xs sm:text-[13px]">
        {STEP_KEYS.map((key, i) => {
          const isActive = i === ACTIVE_INDEX;
          const isVisited = i < ACTIVE_INDEX;
          return (
            <li key={key} className="flex shrink-0 items-center gap-1">
              <span
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1.5",
                  isActive && "bg-market-navy text-white",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                    isActive && "bg-white/20 text-white",
                    isVisited && "bg-market-navy text-white",
                    !isActive && !isVisited && "border border-market-navy/25 text-market-navy/50",
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap font-medium",
                    isActive ? "text-white" : "text-market-navy/70",
                  )}
                >
                  {t(`stepper.${key}`)}
                </span>
              </span>
              {i < STEP_KEYS.length - 1 && (
                <svg
                  aria-hidden
                  viewBox="0 0 8 16"
                  className="h-3.5 w-2 shrink-0 text-market-navy/25"
                >
                  <path d="M1 1l6 7-6 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
