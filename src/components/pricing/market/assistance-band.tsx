import { CalendarDays, Headset } from "lucide-react";
import { PremiumApplyButton } from "./premium-apply-form";
import type { Translator } from "./types";

const BOOK_BTN_CLS =
  "h-auto gap-2 rounded-[0.5rem] border border-white/40 bg-transparent px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/10";

/**
 * Navy "Need Assistance?" band (design 12): headset icon + copy + outline
 * "Book a Call" button that opens the same Premium application dialog.
 */
export function AssistanceBand({ t }: { t: Translator }) {
  return (
    <section className="bg-market-navy">
      <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-5 px-4 py-8 text-center md:flex-row md:px-6 md:text-left">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 text-white">
            <Headset className="h-5 w-5" strokeWidth={1.6} />
          </span>
          <p className="text-sm text-white/90 sm:text-base">
            <span className="font-bold text-white">{t("assistance.title")}</span>{" "}
            {t("assistance.body")}
          </p>
        </div>

        <PremiumApplyButton
          label={t("assistance.bookCta")}
          className={BOOK_BTN_CLS}
          icon={<CalendarDays className="h-4 w-4" />}
        />
      </div>
    </section>
  );
}
