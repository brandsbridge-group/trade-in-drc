"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/constants/routes";
import { USER_ROLE } from "@/constants/status";
import { resolvePostAuthRedirect } from "@/lib/auth/redirect-guard";
import { EmailField, PasswordField, SubmitButton, authErrorMessage, currentLocale } from "./auth-fields";

export function LoginForm() {
  const t = useTranslations("Auth");
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      toast.error(authErrorMessage(error, t));
      setLoading(false);
      return;
    }
    toast.success(t("successLogin"));

    const locale = currentLocale();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    // Full-page navigation takes a few seconds: `loading` stays true on
    // purpose so the button keeps spinning until the next page is up.
    if (profile?.role === USER_ROLE.ADMIN) {
      // Admin always wins over `?redirect=`, even on a valid same-origin
      // link: the admin console is the one surface with elevated
      // capabilities, so an admin always lands somewhere predictable rather
      // than wherever a (possibly phished) link pointed them.
      window.location.href = `/${locale}${ROUTES.ADMIN}`;
    } else {
      // resolvePostAuthRedirect is the single source of truth for the
      // post-auth landing spot (shared with signup and the OAuth /callback).
      window.location.href = resolvePostAuthRedirect(
        searchParams.get("redirect"),
        locale,
        window.location.origin
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <EmailField
        label={t("email")}
        placeholder="name@example.com"
        disabled={loading}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <PasswordField
        label={t("password")}
        labelAside={
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            {t("forgotPasswordLink")}
          </Link>
        }
        autoComplete="current-password"
        disabled={loading}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <SubmitButton loading={loading}>{t("signIn")}</SubmitButton>
    </form>
  );
}
