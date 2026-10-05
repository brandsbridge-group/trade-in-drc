"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "react-toastify";
import { ExternalLink, Loader2, RotateCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authEmailRedirect } from "@/lib/auth/email-redirect";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { MailSentIllustration } from "@/components/auth-design/mail-sent-illustration";

const RESEND_COOLDOWN_S = 60;

/** Best-effort webmail URL for the address's provider; falls back to mailto:. */
function inboxUrl(email: string): string {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (/^(gmail|googlemail)\./.test(domain)) return "https://mail.google.com/mail/u/0/#inbox";
  if (/^(outlook|hotmail|live|msn)\./.test(domain)) return "https://outlook.live.com/mail/";
  if (/^yahoo\./.test(domain)) return "https://mail.yahoo.com/";
  if (/^(icloud|me|mac)\./.test(domain)) return "https://www.icloud.com/mail";
  if (/^proton(mail)?\./.test(domain)) return "https://mail.proton.me/";
  return "mailto:";
}

function VerifyEmailContent() {
  const t = useTranslations("Auth.verifyEmail");
  const locale = useLocale();
  const reduce = useReducedMotion();
  const search = useSearchParams();
  const email = search.get("email") ?? "";
  // Carried from signup: where the visitor was headed (e.g. the company form).
  // Dropping it here used to strand them on the default landing page.
  const redirectTarget = search.get("redirect");
  const withRedirect = (path: string) => {
    if (!redirectTarget) return path;
    const context = redirectTarget.includes("/companies/new") ? "&context=company" : "";
    return `${path}?redirect=${encodeURIComponent(redirectTarget)}${context}`;
  };
  const [sending, setSending] = useState(false);
  // Signup just sent the first e-mail, so start in cooldown.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  async function resend() {
    if (!email) {
      toast.error(t("missingEmail"));
      return;
    }
    setSending(true);
    const { error } = await createClient().auth.resend({
      type: "signup",
      email,
      // Same domain as the page: without it the link uses the project's Site URL.
      options: { emailRedirectTo: authEmailRedirect(window.location.origin, locale, "signup") },
    });
    setSending(false);
    if (error) {
      // Supabase answers in English; say it in the visitor's language.
      toast.error(error.status === 429 || /security purposes|rate limit/i.test(error.message) ? t("resendRateLimited") : t("resendError"));
    } else {
      toast.success(t("resent"));
      setCooldown(RESEND_COOLDOWN_S);
    }
  }

  const steps = [t("step1"), t("step2"), t("step3")];

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, translateY: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, translateY: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", duration: 0.45, bounce: 0 }}
      className="text-center"
    >
      <MailSentIllustration />

      <h1 className="mt-3 text-xl font-bold tracking-tight md:text-xl">{t("title")}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {email
          ? t.rich("body", {
              email,
              b: (chunks) => <strong className="break-all font-semibold text-foreground">{chunks}</strong>,
            })
          : t("bodyNoEmail")}
      </p>

      {/* 1 → 2 → 3 steps */}
      <ol className="mx-auto mt-4 flex max-w-sm items-start justify-between gap-2">
        {steps.map((label, i) => (
          <li key={i} className="relative flex flex-1 flex-col items-center gap-1.5">
            {i > 0 && (
              <span className="absolute right-1/2 top-3.5 z-0 h-px w-full bg-gradient-to-r from-primary/15 to-primary/30" aria-hidden />
            )}
            <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-4 ring-white">
              {i + 1}
            </span>
            <span className="text-[11px] leading-tight text-muted-foreground">{label}</span>
          </li>
        ))}
      </ol>

      <div className="mt-5 grid gap-2">
        <Button asChild className="h-10 w-full rounded-lg text-sm font-semibold shadow-md shadow-primary/20">
          <a
            href={inboxUrl(email)}
            // mailto: opens the mail app; a new tab would just stay blank.
            {...(inboxUrl(email).startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}
          >
            {t("openInbox")}
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <Button
          variant="outline"
          onClick={resend}
          disabled={sending || cooldown > 0}
          className="h-10 w-full rounded-lg text-sm font-medium tabular-nums"
        >
          {sending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RotateCw className="mr-2 h-4 w-4" />
          )}
          {cooldown > 0 ? t("resendIn", { seconds: cooldown }) : t("resend")}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-xs text-muted-foreground">
        <p>
          {t("wrongEmail")}{" "}
          <Link href={withRedirect("/signup")} className="font-medium text-primary underline underline-offset-4">
            {t("changeEmail")}
          </Link>
        </p>
        <span className="text-slate-300" aria-hidden>·</span>
        <p>
          <Link href={withRedirect("/login")} className="font-medium text-primary underline underline-offset-4">
            {t("backToLogin")}
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export function VerifyEmailForm() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
