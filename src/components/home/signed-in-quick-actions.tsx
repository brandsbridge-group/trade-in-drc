"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { Building2, FileText, Inbox, Send, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-provider";
import { Link } from "@/i18n/routing";
import type { User } from "@supabase/supabase-js";

/**
 * Quick-action entry. `href` is a locale-relative path resolved by the i18n Link.
 * `labelKey` is a leaf under `HomeSearch.signedIn.quickActions`.
 */
interface QuickAction {
  labelKey: string;
  href: string;
  icon: LucideIcon;
}

const QUICK_ACTIONS: QuickAction[] = [
  { labelKey: "myCompanies", href: "/dashboard/companies", icon: Building2 },
  { labelKey: "submitRequest", href: "/request", icon: Send },
  { labelKey: "myRequests", href: "/dashboard", icon: FileText },
  { labelKey: "inbox", href: "/dashboard/inbox", icon: Inbox },
  { labelKey: "getPremium", href: "/pricing", icon: Sparkles },
];

/**
 * App-home quick-actions row for signed-in users (customer note 1: one unified
 * page for everyone; signed-in users additionally get this row). Renders a
 * personalized greeting plus shortcut cards into the authenticated areas. When
 * signed out it renders nothing — the public search-forward panel is the shared
 * surface for everyone. Auth state comes from `useAuth()`; while loading we
 * render nothing to avoid a flash of the greeting before the session resolves.
 */
export function SignedInQuickActions() {
  const t = useTranslations("HomeSearch.signedIn");
  const tActions = useTranslations("HomeSearch.signedIn.quickActions");
  const { user, loading } = useAuth();
  const reduce = useReducedMotion();

  if (loading || !user) return null;

  const name = displayName(user);
  const greeting = name ? t("greeting", { name }) : t("greetingNoName");

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, translateY: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, translateY: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", duration: reduce ? 0 : 0.3, bounce: 0 }}
      aria-label={greeting}
    >
      <p className="mb-3 text-lg font-semibold text-foreground">{greeting}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {QUICK_ACTIONS.map(({ labelKey, href, icon: Icon }) => (
          <Link
            key={labelKey}
            href={href}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 transition-colors duration-150 ease-out hover:border-primary hover:bg-muted/40"
          >
            <span className="rounded-md bg-primary/10 p-2 text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 truncate text-sm font-medium text-foreground">
              {tActions(labelKey)}
            </span>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}

/**
 * Friendly display name for the greeting. Prefers a profile-style metadata name,
 * then the email local-part. Returns `null` when nothing resolves so the caller
 * can render a name-less greeting (`greetingNoName`) rather than injecting a
 * hardcoded placeholder. Never throws on a missing field.
 */
function displayName(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const metaName =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim());
  if (metaName) return metaName;
  if (user.email) return user.email.split("@")[0];
  return null;
}
