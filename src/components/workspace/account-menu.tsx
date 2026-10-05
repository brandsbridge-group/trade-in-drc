"use client";

import { ArrowUpRight, ChevronDown, Globe, LogOut, ShieldCheck, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface WorkspaceMenuLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface WorkspaceAccountMenuProps {
  displayName: string;
  email: string | null;
  /** Second line of the trigger and chip in the header ("Super Admin"); omit for a company account. */
  roleLabel?: string;
  links: WorkspaceMenuLink[];
  backToSiteLabel: string;
  signOutLabel: string;
  onSignOut: () => void | Promise<void>;
}

const ROW = "h-10 cursor-pointer rounded-lg px-2.5 text-[13.5px] font-medium text-slate-700 focus:bg-slate-100 focus:text-market-navy";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/**
 * Account menu of the two signed-in areas (company dashboard, staff console).
 * Same three blocks as the public navbar's menu: who is signed in, where they
 * can go (the area's own links, then back to the public site), and sign-out.
 */
export function WorkspaceAccountMenu({ displayName, email, roleLabel, links, backToSiteLabel, signOutLabel, onSignOut }: WorkspaceAccountMenuProps) {
  const t = useTranslations("Nav.account");
  const initials = initialsOf(displayName) || "·";
  // An account without a full name is shown by its e-mail once, not twice.
  const showEmail = Boolean(email) && email !== displayName;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("open")}
        className="group flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 outline-none ring-1 ring-slate-200 transition-colors hover:ring-slate-300 focus-visible:ring-2 focus-visible:ring-market-navy data-[state=open]:ring-slate-300"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-market-navy text-[11px] font-semibold text-market-or-light" aria-hidden>
          {initials}
        </span>
        <span className="hidden max-w-[160px] text-left lg:block">
          <span className="block truncate text-[12.5px] font-semibold text-market-navy">{displayName}</span>
          {(roleLabel || showEmail) && <span className="block truncate text-[11px] text-slate-500">{roleLabel ?? email}</span>}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ease-out group-data-[state=open]:rotate-180" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} aria-label={t("menu")} className="w-72 rounded-2xl border-slate-200/80 p-0 shadow-xl">
        <div className="flex items-center gap-3 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-market-navy text-sm font-semibold text-market-or-light" aria-hidden>
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-market-navy">{displayName}</p>
            {showEmail && <p className="truncate text-xs text-slate-500">{email}</p>}
            {roleLabel && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-market-navy px-2 py-0.5 text-[11px] font-semibold text-white">
                <ShieldCheck className="h-3 w-3" aria-hidden />
                {roleLabel}
              </span>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="m-0 bg-slate-100" />

        <div className="p-2">
          {links.map(({ href, label, icon: Icon }) => (
            <DropdownMenuItem key={href} asChild className={ROW}>
              <Link href={href}>
                <Icon className="h-4 w-4 text-slate-400" aria-hidden />
                {label}
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem asChild className={ROW}>
            <Link href="/">
              <Globe className="h-4 w-4 text-slate-400" aria-hidden />
              <span className="flex-1">{backToSiteLabel}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" aria-hidden />
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="m-0 bg-slate-100" />

        <div className="p-2">
          <DropdownMenuItem
            onClick={() => onSignOut()}
            className="h-10 cursor-pointer rounded-lg px-2.5 text-[13.5px] font-medium text-market-red focus:bg-red-50 focus:text-market-red"
          >
            <LogOut className="h-4 w-4 text-market-red" aria-hidden />
            {signOutLabel}
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
