import {
  ClipboardCheck,
  Mail,
  MonitorCheck,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import type { Translator } from "./types";

/** Step icons — order matches `Premium.howItWorks.steps`. */
const STEP_ICONS: readonly LucideIcon[] = [
  MonitorCheck, // Apply Online
  ClipboardCheck, // Profile Review
  UserCheck, // Profile Activation
  Mail, // Receive Opportunities
];

interface Step {
  title: string;
  description: string;
}

/**
 * "How It Works" card (design 12): 4 numbered navy-circle steps with connectors.
 */
export function HowItWorks({ t }: { t: Translator }) {
  const steps = t.raw("howItWorks.steps") as Step[];

  return (
    <div className="h-full rounded-[0.75rem] border border-slate-200 bg-white p-6 sm:p-7">
      <h2 className="font-display text-xl font-bold tracking-tight text-market-navy">
        {t("howItWorks.title")}
      </h2>

      <ol className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4">
        {steps.map((step, i) => {
          const Icon = STEP_ICONS[i] ?? MonitorCheck;
          const isLast = i === steps.length - 1;
          return (
            <li key={step.title} className="relative flex flex-col items-center text-center">
              {/* Connector line to the next step (hidden on the last, and on
                  the wrap boundary at the 2-col breakpoint). */}
              {!isLast && (
                <span
                  aria-hidden
                  className="absolute left-1/2 top-5 hidden h-px w-full bg-slate-200 sm:block"
                />
              )}

              <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-market-navy text-sm font-bold text-white">
                {i + 1}
              </span>
              <Icon className="mt-3 h-6 w-6 text-market-navy" strokeWidth={1.6} />
              <h3 className="mt-2 text-sm font-bold leading-snug text-market-navy">
                {step.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {step.description}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
