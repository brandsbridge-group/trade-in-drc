"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Building blocks shared by the three auth forms (login, signup, forgot
 * password). Each form owns its own logic; only the look lives here.
 */

const inputClass =
  "h-10 rounded-lg bg-muted/40 transition-colors duration-150 focus-visible:bg-background";
const iconClass =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground";

type FieldProps = Omit<React.ComponentProps<typeof Input>, "id" | "type"> & {
  label: string;
  /** Optional element on the right of the label (e.g. "Forgot password?"). */
  labelAside?: React.ReactNode;
};

export function EmailField({ label, labelAside, className, ...props }: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="email">{label}</Label>
        {labelAside}
      </div>
      <div className="relative">
        <Mail className={iconClass} aria-hidden />
        <Input
          id="email"
          type="email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          required
          className={cn(inputClass, "pl-9", className)}
          {...props}
        />
      </div>
    </div>
  );
}

export function NameField({ label, className, ...props }: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="full_name">{label}</Label>
      <div className="relative">
        <User className={iconClass} aria-hidden />
        <Input
          id="full_name"
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          required
          minLength={2}
          className={cn(inputClass, "pl-9", className)}
          {...props}
        />
      </div>
    </div>
  );
}

export function PasswordField({
  label,
  labelAside,
  id = "password",
  className,
  ...props
}: FieldProps & { id?: string }) {
  const t = useTranslations("Auth");
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {labelAside}
      </div>
      <div className="relative">
        <Lock className={iconClass} aria-hidden />
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoCapitalize="none"
          autoCorrect="off"
          required
          className={cn(inputClass, "pl-9 pr-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          aria-pressed={visible}
          aria-controls={id}
          disabled={props.disabled}
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className="h-10 w-full rounded-lg mt-6 text-sm font-medium shadow-md shadow-primary/20"
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

/** Locale prefix of the current URL (`/fr/login` → `fr`). */
export function currentLocale(): string {
  return window.location.pathname.match(/^\/(en|fr|tr|es|zh)/)?.[1] ?? "en";
}

/** Maps a Supabase auth error to a translated, user-facing message. */
export function authErrorMessage(error: unknown, t: (key: string) => string): string {
  const message = (error as Error)?.message ?? "";
  if (message.includes("Invalid login credentials")) return t("errorInvalidCredentials");
  if (message.includes("User already registered")) return t("errorAccountExists");
  if (message.includes("Password should be at least")) return t("errorPasswordTooShort");
  return message || t("errorGeneric");
}
