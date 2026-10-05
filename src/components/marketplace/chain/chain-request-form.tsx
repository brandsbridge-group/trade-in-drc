"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Send, X } from "lucide-react";

import type { ChainKey } from "@/lib/marketplace/chain";
import { useOperation } from "./operation-store";
import { submitChainRequest } from "./chain-request-actions";

const FIELD =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-slate-400 focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10";
const LABEL = "mb-1.5 block text-xs font-semibold text-slate-700";

/**
 * "Can't find the right partner?" form. Attaches everything in "My operation"
 * (removable here) and, when the page carries a product context, that product.
 * Members skip name / email — the server uses their account.
 */
export function ChainRequestForm({
  segment,
  signedIn,
  defaultNature,
  forProduct,
}: {
  segment: ChainKey;
  signedIn: boolean;
  defaultNature?: string;
  forProduct?: string;
}) {
  const t = useTranslations("MarketChain.request");
  const { items, remove, clear } = useOperation();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null | undefined>(undefined);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    setError(null);
    startTransition(async () => {
      const res = await submitChainRequest({
        segment,
        nature: get("nature"),
        route: get("route"),
        deadline: get("deadline"),
        fullName: get("fullName"),
        email: get("email"),
        items: items.map((i) => ({ id: i.id, kind: i.kind })),
        forProduct: forProduct ?? "",
      });
      if (res.ok) {
        setReference(res.reference ?? null);
        clear();
      } else {
        setError(res.error === "invalid" ? t("invalid") : t("error"));
      }
    });
  }

  if (reference !== undefined) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center" role="status">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden />
        <p className="font-display text-lg font-bold text-[var(--color-landing-navy)]">
          {t("successTitle")}
        </p>
        <p className="max-w-xs text-sm text-slate-600">{t("successBody")}</p>
        {reference && (
          <p className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs font-semibold text-slate-700">
            {t("reference", { ref: reference })}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
      <div>
        <label htmlFor="chain-nature" className={LABEL}>
          {t("nature")}
        </label>
        <input
          id="chain-nature"
          name="nature"
          required
          minLength={2}
          maxLength={200}
          defaultValue={defaultNature}
          placeholder={t("naturePh")}
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor="chain-route" className={LABEL}>
          {t("route")}
        </label>
        <input id="chain-route" name="route" maxLength={200} placeholder={t("routePh")} className={FIELD} />
      </div>
      <div>
        <label htmlFor="chain-deadline" className={LABEL}>
          {t("deadline")}
        </label>
        <input
          id="chain-deadline"
          name="deadline"
          maxLength={120}
          placeholder={t("deadlinePh")}
          className={FIELD}
        />
      </div>

      {!signedIn && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="chain-name" className={LABEL}>
              {t("name")}
            </label>
            <input
              id="chain-name"
              name="fullName"
              required
              minLength={2}
              maxLength={160}
              autoComplete="name"
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="chain-email" className={LABEL}>
              {t("email")}
            </label>
            <input
              id="chain-email"
              name="email"
              type="email"
              required
              maxLength={200}
              autoComplete="email"
              className={FIELD}
            />
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div>
          <p className={LABEL}>{t("attached", { count: items.length })}</p>
          <ul className="flex flex-wrap gap-1.5">
            {items.map((i) => (
              <li
                key={i.id}
                className="inline-flex items-center gap-1 rounded-full bg-market-or/15 py-1 pl-3 pr-1 text-xs font-semibold text-[var(--color-landing-navy)]"
              >
                {i.name}
                <button
                  type="button"
                  onClick={() => remove(i.id)}
                  aria-label={t("remove", { name: i.name })}
                  className="grid h-5 w-5 place-items-center rounded-full transition-colors duration-150 ease-out hover:bg-market-or/30"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-landing-navy)] px-4 py-3 text-sm font-bold text-white transition-colors duration-150 ease-out hover:bg-[#13244a] disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Send className="h-4 w-4" aria-hidden />
        )}
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
