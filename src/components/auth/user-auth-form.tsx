"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/constants/routes";
import { USER_ROLE } from "@/constants/status";
import { resolvePostAuthRedirect } from "@/lib/auth/redirect-guard";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  mode?: "login" | "signup" | "reset";
  onModeChange?: (mode: "login" | "signup" | "reset") => void;
  onSuccess?: () => void;
}

export function UserAuthForm({ className, mode: externalMode, onModeChange, onSuccess, ...props }: UserAuthFormProps) {
  const t = useTranslations("Auth");
  const searchParams = useSearchParams();
  const [loadingAction, setLoadingAction] = React.useState<"form" | null>(null);
  const [internalMode, setInternalMode] = React.useState<"login" | "signup" | "reset">("login");
  const mode = externalMode ?? internalMode;
  const setMode = onModeChange ?? setInternalMode;
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const supabase = createClient();

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setLoadingAction("form");

    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        toast.success(t("resetEmailSent"));
        setMode("login");
      } else if (mode === "signup") {
        const localeMatch = window.location.pathname.match(/^\/(en|fr|tr|es|zh)/);
        const locale = localeMatch ? localeMatch[1] : "en";
        const origin = window.location.origin;

        // Most people registering a company don't have an account yet, so
        // this is the branch that actually carries `?redirect=` for the vast
        // majority of the flow — mirror the login branch's guard rather than
        // re-deriving the logic (resolvePostAuthRedirect is the single source
        // of truth for the post-auth landing spot, shared with the OAuth
        // /callback route and the login branch below).
        const safeRedirect = resolvePostAuthRedirect(
          searchParams.get("redirect"),
          locale,
          origin
        );

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // The confirmation link opens /callback, which forwards `redirect`
            // on to resolvePostAuthRedirect itself — see route.ts. Keeping both
            // ends on the same helper means they can never disagree about
            // what's "safe".
            emailRedirectTo: `${origin}/${locale}/callback?redirect=${encodeURIComponent(safeRedirect)}`,
          },
        });
        if (error) throw error;
        toast.success(t("successRegister"));
        if (onSuccess) onSuccess();
        // Redirect to verify-email so the user can confirm their address.
        // Forward `redirect` through too, in case verify-email ever needs it
        // (e.g. a future "open dashboard" link) — cheap to carry, costly to
        // silently drop.
        window.location.href = `/${locale}/verify-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(safeRedirect)}`;
        return;
      } else {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("successLogin"));

        // Redirect based on role — use the session we just got
        const localeMatch = window.location.pathname.match(/^\/(en|fr|tr|es|zh)/);
        const locale = localeMatch ? localeMatch[1] : "en";

        if (signInData.user) {
          // Query profile with the fresh session
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", signInData.user.id)
            .single();

          if (onSuccess) onSuccess();

          if (profile?.role === USER_ROLE.ADMIN) {
            // Admin always wins over `?redirect=`, even on a valid same-origin
            // link: the admin console is the one surface with elevated
            // capabilities, and an admin should always land somewhere
            // predictable rather than wherever a (possibly phished) link
            // pointed them — convenience loses to a stable landing spot here.
            window.location.href = `/${locale}${ROUTES.ADMIN}`;
          } else {
            // P2-7: every successful path lands on /dashboard/companies —
            // the registration wizard's own success screen already does.
            // resolvePostAuthRedirect bakes that default in, so this branch
            // (and the signup branch above, and the OAuth /callback route)
            // can't drift back to a bare /dashboard fallback. An explicit
            // `?redirect=` target still always wins — only the default is
            // shared.
            const target = resolvePostAuthRedirect(
              searchParams.get("redirect"),
              locale,
              window.location.origin
            );
            window.location.href = target;
          }
        }
        return;
      }
    } catch (error: unknown) {
      const message: string = (error as Error)?.message ?? "";
      if (message.includes("Invalid login credentials")) {
        toast.error(t("errorInvalidCredentials"));
      } else if (message.includes("User already registered")) {
        toast.error(t("errorAccountExists"));
      } else if (message.includes("Password should be at least")) {
        toast.error(t("errorPasswordTooShort"));
      } else {
        toast.error(message || t("errorGeneric"));
      }
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, translateY: 4 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -4 }}
          transition={{ duration: 0.15 }}
          className="grid gap-6"
        >
          <form onSubmit={onSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={!!loadingAction}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {mode !== "reset" && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t("password")}</Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("reset")}
                        className="text-xs text-primary hover:underline"
                      >
                        {t("forgotPasswordLink")}
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    disabled={!!loadingAction}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              <Button disabled={!!loadingAction}>
                {loadingAction === "form" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "reset"
                  ? t("sendResetLink")
                  : mode === "signup"
                    ? t("signUp")
                    : t("signIn")}
              </Button>
            </div>
          </form>
          {mode === "reset" ? (
            <Button
              variant="outline"
              type="button"
              disabled={!!loadingAction}
              onClick={() => setMode("login")}
            >
              {t("backToSignIn")}
            </Button>
          ) : (
            <div className="grid gap-3">
              <button
                type="button"
                disabled={!!loadingAction}
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {mode === "signup" ? t("hasAccount") : t("noAccount")}
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
