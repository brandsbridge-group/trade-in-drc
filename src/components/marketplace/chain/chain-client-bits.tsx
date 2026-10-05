"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, MessageSquare, Plus, X } from "lucide-react";

import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { initialsOf } from "@/lib/marketplace/offers";
import { ContactSupplierModal } from "@/components/messaging/contact-supplier-modal";
import { useOperation, type OperationItem } from "./operation-store";

const EASE = [0.22, 1, 0.36, 1] as const;

export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--color-landing-navy)] px-4 py-2.5 text-[13px] font-bold text-white transition-colors duration-150 ease-out hover:bg-[#13244a]";
export const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold ring-1 transition-colors duration-150 ease-out";

/** Toggle a provider in / out of "My operation". */
export function AddToOperationButton({ item }: { item: OperationItem }) {
  const t = useTranslations("MarketChain.actions");
  const { has, toggle } = useOperation();
  const added = has(item.id);

  return (
    <button
      type="button"
      onClick={() => toggle(item)}
      aria-pressed={added}
      className={cn(
        BTN_SECONDARY,
        added
          ? "bg-market-or/15 text-[var(--color-landing-navy)] ring-market-or/60 hover:bg-market-or/25"
          : "bg-white text-[var(--color-landing-navy)] ring-slate-200 hover:bg-slate-50",
      )}
    >
      {added ? <Check className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
      {added ? t("added") : t("add")}
    </button>
  );
}

/**
 * Message the provider through the platform inbox (contact details stay
 * hidden). Guests go to /login and come back to this page afterwards.
 */
export function ProviderContactButton({
  label,
  signedIn,
  viewerId,
  companyId,
  companyName,
  companyOwnerId,
}: {
  label: string;
  signedIn: boolean;
  viewerId: string | null;
  companyId: string;
  companyName: string;
  companyOwnerId: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (!signedIn) {
    return (
      <Link href={`/login?redirect=${encodeURIComponent(pathname)}`} className={BTN_PRIMARY}>
        <MessageSquare className="h-4 w-4" aria-hidden />
        {label}
      </Link>
    );
  }
  if (viewerId === companyOwnerId) return null; // your own company

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={BTN_PRIMARY}>
        <MessageSquare className="h-4 w-4" aria-hidden />
        {label}
      </button>
      {open && (
        <ContactSupplierModal
          isOpen={open}
          onClose={() => setOpen(false)}
          companyId={companyId}
          companyName={companyName}
          companyOwnerId={companyOwnerId}
        />
      )}
    </>
  );
}

/**
 * Floating "My operation" bar — follows the visitor across the chain pages as
 * soon as one provider is set aside; "Send to the team" jumps to the request
 * form, which attaches the selection. Enter/exit: §2.2 (≤ 250 ms).
 */
export function OperationBar() {
  const t = useTranslations("MarketChain.basket");
  const reduce = useReducedMotion();
  const { items, clear } = useOperation();

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: reduce ? 0.12 : 0.25, ease: EASE }}
          className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-2xl items-center gap-3 rounded-2xl bg-market-navy/95 p-2 pl-4 text-white shadow-2xl shadow-slate-950/30 ring-1 ring-white/10 backdrop-blur-md"
          role="region"
          aria-label={t("label")}
        >
          <div className="flex -space-x-2" aria-hidden>
            {items.slice(0, 3).map((i) => (
              <span
                key={i.id}
                className="grid h-8 w-8 place-items-center rounded-full bg-white text-[11px] font-bold text-market-navy ring-2 ring-market-navy"
              >
                {initialsOf(i.name)}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold leading-tight">{t("label")}</p>
            <p className="truncate text-[12px] text-white/60">
              {t("count", { count: items.length })}
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            aria-label={t("clear")}
            className="grid h-9 w-9 flex-none place-items-center rounded-xl text-white/60 transition-colors duration-150 ease-out hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <a
            href="#chain-request"
            className="group inline-flex flex-none items-center gap-1.5 rounded-xl bg-market-or px-3.5 py-2.5 text-[13px] font-bold text-market-navy transition-colors duration-150 ease-out hover:bg-market-or-light"
          >
            <span className="hidden sm:inline">{t("send")}</span>
            <span className="sm:hidden">{t("sendShort")}</span>
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
              aria-hidden
            />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
