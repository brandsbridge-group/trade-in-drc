"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { renderCampaignEmail, type CampaignLanguage } from "@/lib/newsletter/campaign-email";

type Device = "desktop" | "mobile";

const DEVICES: { device: Device; icon: typeof Monitor }[] = [
  { device: "desktop", icon: Monitor },
  { device: "mobile", icon: Smartphone },
];

/**
 * A campaign as its subscribers will see it: the inbox line (sender, subject)
 * and the e-mail itself, rendered by the function the sender uses.
 */
export function EmailPreview({
  language,
  subject,
  body,
  sender,
}: {
  language: CampaignLanguage;
  subject: string;
  body: string;
  sender: string | null;
}) {
  const t = useTranslations("Admin.newsletter.preview");
  const [device, setDevice] = useState<Device>("desktop");
  const shownSubject = subject.trim() || t("subjectEmpty");
  const deferredBody = useDeferredValue(body);
  const emptyBody = t("bodyEmpty");

  const html = useMemo(
    () =>
      renderCampaignEmail({
        language,
        subject: shownSubject,
        body: deferredBody.trim() || emptyBody,
        // Site-relative logo, and an unsubscribe link that leads nowhere: this is not a real send.
        origin: "",
        unsubscribeUrl: "#",
      }).html,
    [language, shownSubject, deferredBody, emptyBody]
  );

  // "TradeInDRC <news@…>" → the name an inbox shows.
  const senderName = sender?.replace(/<[^>]*>/, "").trim() || sender || "TradeInDRC";

  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/70">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-sm font-semibold text-market-navy">
          {t("title")} <span className="font-normal text-slate-500">· {t(`language.${language}`)}</span>
        </h2>
        <div className="inline-flex gap-0.5 rounded-xl bg-slate-200/70 p-1">
          {DEVICES.map(({ device: option, icon: Icon }) => (
            <button
              key={option}
              type="button"
              aria-pressed={device === option}
              aria-label={t(option)}
              title={t(option)}
              onClick={() => setDevice(option)}
              className={cn(
                "grid size-7 place-items-center rounded-lg transition-colors",
                device === option ? "bg-white text-market-navy ring-1 ring-slate-200" : "text-slate-500 hover:text-market-navy"
              )}
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>
      </header>

      <div className="flex items-center gap-3 border-y border-slate-100 px-4 py-2.5">
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-market-navy text-xs font-semibold text-white">
          {senderName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 text-[13px] leading-snug">
          <p className="truncate font-semibold text-slate-900">{senderName}</p>
          <p className={cn("truncate", subject.trim() ? "text-slate-700" : "text-slate-400")}>{shownSubject}</p>
        </div>
      </div>

      <div className="bg-slate-100 p-3">
        <iframe
          title={t("frameTitle", { language: t(`language.${language}`) })}
          sandbox=""
          srcDoc={html}
          className={cn(
            "mx-auto block h-[560px] w-full rounded-xl bg-white ring-1 ring-slate-200",
            device === "mobile" && "max-w-[390px]"
          )}
        />
      </div>
      <p className="px-4 py-2.5 text-xs text-slate-500">{t("note")}</p>
    </section>
  );
}
