"use client";

import { useLocale, useTranslations } from "next-intl";
import { Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deletionBlockers, termName } from "@/lib/taxonomy/terms";
import type { TermTarget } from "./shared";

const CLOSE =
  "rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-market-navy ring-1 ring-slate-200 transition-colors hover:bg-slate-100 disabled:opacity-60";

/**
 * Deleting an entry. Three answers: reserved to a super-admin, impossible
 * while something still uses the entry (with what, and how many), or a plain
 * confirmation. The database enforces the same three rules (00066).
 */
export function DeleteTermDialog({
  target,
  canDelete,
  busy,
  onConfirm,
  onClose,
}: {
  target: TermTarget | null;
  canDelete: boolean;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("Taxonomy");
  const locale = useLocale();
  if (!target?.term) return null;

  const { kind, term } = target;
  const name = termName(term, locale);
  const blockers = deletionBlockers(kind, term.usage);
  const specFields = "spec_fields" in term.usage ? term.usage.spec_fields : 0;
  const state = !canDelete ? "reserved" : blockers.length > 0 ? "blocked" : "confirm";

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg text-market-navy">
            {state !== "confirm" && <ShieldAlert className="size-5 shrink-0 text-amber-600" aria-hidden />}
            {t(state === "confirm" ? "delete.title" : state === "blocked" ? "delete.blockedTitle" : "delete.reservedTitle", { name })}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-slate-600">
            {t(state === "confirm" ? "delete.body" : state === "blocked" ? "delete.blockedBody" : "delete.reservedBody", { name })}
          </DialogDescription>
        </DialogHeader>

        {state === "blocked" && (
          <>
            <ul className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-[13px] font-medium text-market-navy">
              {blockers.map((blocker) => (
                <li key={blocker.key} className="flex items-center gap-2">
                  <span className="size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                  {t(`usage.${blocker.key}`, { count: blocker.count })}
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500">{t(`delete.blockedHint.${kind}`)}</p>
          </>
        )}

        {state === "confirm" && specFields > 0 && (
          <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-800">{t("delete.specNote", { count: specFields })}</p>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={CLOSE}>
            {t(state === "confirm" ? "form.cancel" : "delete.close")}
          </button>
          {state === "confirm" && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
              {t("delete.confirm")}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
